import express = require("express");
import http = require("http");
import * as path from "path";

const app = express();
app.set("port", process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, "public")));
app.get("/hello", (req, res) => {
    res.send("Hello dev world!");
});

http.createServer(app).listen(app.get("port"), () => {
    console.log("Express server listening on port " + app.get("port"));
});
