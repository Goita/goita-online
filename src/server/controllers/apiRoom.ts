import { User, UserModel } from "../models/User";
import Lobby from "../lobby";
import { Response, Request, NextFunction } from "express";

export class RoomController {
    private lobby: Lobby;
    public constructor(lobby: Lobby) {
        this.lobby = lobby;
        console.log("lobby set");
        console.log(lobby);
    }

    public postRoom = (req: Request, res: Response, next: NextFunction) => {
        const description = req.body.description;
        if (!description) {
            res.status(400).json("Must input room's description.");
            return;
        }
        const user = req.user as UserModel;
        const opt = req.params.opt ? JSON.parse(req.params.opt) : undefined;
        const room = this.lobby.createRoom(description, opt);
        room.addUser(req.user.id);
        console.log("room #" + room.no + " has created.");
        res.contentType("application/json").json({ no: room.no });
    }
}
