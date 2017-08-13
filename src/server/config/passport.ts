import * as Facebook from "passport-facebook";
// import * as Local from "passport-local";

import { User } from "../models/User";
// import * as store from "store";
import * as p from "passport";

const host = process.env.NODE_ENV !== "production" ? "localhost:3000" : "goita.net";

export function SetupPassport(passport: p.Passport) {

    passport.serializeUser<any, any>((user, done) => {
        done(undefined, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });

    // NOTE: to set up FB auth you need your own clientID, clientSecret and set up your callbackURL.  This can all be done at https://developers.facebook.com/
    passport.use(new Facebook.Strategy({
        clientID: process.env.FACEBOOK_ID,
        clientSecret: process.env.FACEBOOK_SECRET,
        callbackURL: "http://" + host + "/auth/facebook/callback",
        profileFields: ["id", "displayName", "photos", "email"],
    },
        (accessToken, refreshToken, profile, done) => {
            const id = "fb" + profile.id;
            User.findOne({ userid: id }, (err, user) => {
                if (err) { console.log(err); }
                if (!err && user !== null) {
                    done(null, user);
                } else {
                    const newUser = new User({ userid: id, authtype: "facebook", name: profile.displayName, email: profile.emails[0].value, icon: profile.photos[0].value });
                    newUser.save((e, u) => {
                        if (e) {
                            console.log(e);
                        } else {
                            done(null, u);
                        }
                    });
                }
            });
        },
    ));
}
