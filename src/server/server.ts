/**
 * Express-Socket.io-Mongo-React-Redux game server
 */
import * as express from "express";
import * as compression from "compression";  // compresses requests
import * as session from "express-session";
import * as bodyParser from "body-parser";
import * as logger from "morgan";
import * as errorHandler from "errorhandler";
import * as lusca from "lusca";
import * as dotenv from "dotenv";
import * as mongo from "connect-mongo"; // (session)
import * as flash from "express-flash";
import * as path from "path";
import * as mongoose from "mongoose";
import * as passport from "passport";
import expressValidator = require("express-validator");
import nochace = require("nocache");
import * as SocketIo from "socket.io";

import Lobby from "./lobby";
const lobby = new Lobby();

const MongoStore = mongo(session);

/**
 * Load environment variables from .env file into process.env, where API keys and passwords are configured.
 */
dotenv.config({ path: ".env.dev" });

/**
 * API keys and Passport configuration.
 */
import * as passportConfig from "./config/passport";
passportConfig.SetupPassport(passport);
/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
(mongoose as any).Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI, { useMongoClient: true });

mongoose.connection.on("error", () => {
    console.log("MongoDB connection error. Please make sure MongoDB is running.");
    process.exit();
});

/**
 * Express configuration.
 */
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());

const sessionStore = new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true,
});
app.use(session({
    name: "session.sid",
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
}));
if (app.get("env") === "development") {
    console.log("  No Cacheing Mode");
    app.use(nochace());
}

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

// static content
app.use("/", express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }));

/**
 * OAuth authentication routes. (Sign in)
 */
app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email", "public_profile"] }));
app.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => {
    const rd = req.session.returnTo || "/";
    res.redirect(rd);
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
    const rd = req.session.returnTo || "/";
    res.redirect(rd);
});

app.get("/auth/twitter", passport.authenticate("twitter"));
app.get("/auth/twitter/callback", passport.authenticate("twitter", { failureRedirect: "/login" }), (req, res) => {
    const rd = req.session.returnTo || "/";
    res.redirect(rd);
});

/** just check http status code (OK:200 / BAD:401)  */
app.get("/auth/check", (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).contentType("application/json")
            .json("you are authenticated!!");
    } else {
        res.status(401).json("not authenticated..."); // authentication fail
    }
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/login");
});
import * as apiUserController from "./controllers/apiUser";
app.get("/api/user/:id", apiUserController.getUser);

import { RoomController } from "./controllers/apiRoom";
const roomController = new RoomController(lobby);
app.post("/api/game/room", passportConfig.isApiAuthenticated, roomController.postRoom.bind(roomController)); // override this

/**
 * React-Router parses undefined path
 */
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
    console.log(("  App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
    console.log("  Press CTRL-C to stop\n");
});

const io = SocketIo(server, {});

// share session with express
import * as passportSocketIo from "passport.socketio";
import * as cookieParser from "cookie-parser";
io.use(passportSocketIo.authorize({
    passport,
    cookieParser,
    key: "session.sid", // should be same as session options name
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    success: (data, accept) => {
        console.log("successful connection to socket.io");
        console.log(data.user.userid);
        accept(null, true);
    },
    fail: (data, message, error, accept) => {
        if (error) {
            throw new Error(message);
        }
        console.log("failed connection to socket.io:", message);
        accept(null, false);
    },
}));

import handleAppEvent from "./handleAppEvent";
handleAppEvent(io);

lobby.handleLobbyEvent(io);
