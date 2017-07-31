import * as Facebook from "passport-facebook";
import { oAuthConfig } from "./oAuthConfig";
// import * as Local from "passport-local";
import { User } from "../models/User";
// import * as store from "store";
import * as passport from "passport";

const host = process.env.NODE_ENV !== "production" ? "localhost:3000" : "goita.net";

export function SetupPassport(passport: passport.Passport) {

    // NOTE: to set up FB auth you need your own clientID, clientSecret and set up your callbackURL.  This can all be done at https://developers.facebook.com/
    passport.use(new Facebook.Strategy({
        clientID: oAuthConfig.facebook.clientID,
        clientSecret: oAuthConfig.facebook.clientSecret,
        callbackURL: "http://" + host + "/api/auth/facebook/callback",
    },
        (accessToken, refreshToken, profile, done) => {
            // store.set("username", profile.displayName);

            User.findOne({ "facebook.id": profile.id }, (err, user) => {
                if (err) { console.log(err); }
                if (!err && user !== null) {
                    done(null, user);
                } else {
                    const newUser = new User({ "facebook.id": profile.id, "facebook.username": profile.displayName });
                    // tslint:disable-next-line:no-shadowed-variable
                    newUser.save((err, user) => {
                        if (err) {
                            console.log(err);
                        } else {
                            done(null, user);
                        }
                    });
                }
            });
        },
    ));
}
