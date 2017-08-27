import { User } from "../models/User";
import { Response, Request, NextFunction } from "express";

export const getUser = (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    User.findOne({ userid: id }, (err, user) => {
        if (err) { return next(err); }
        if (!user) {
            res.status(400).contentType("application/json")
                .json("User not found.");
        } else {
            res.contentType("application/json")
                .json(user);
        }
    });
};
