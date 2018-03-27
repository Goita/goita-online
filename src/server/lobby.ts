import * as SocketIO from "socket.io";
import UserData from "./user";
import { RoomInfo, RoomOptions } from "./types";
import Room from "./room";

/** game lobby */
export default class Lobby {
    public msgID: number;
    public users: { [key: string]: UserData };
    public rooms: { [key: number]: Room };

    private ioLobby: SocketIO.Namespace;

    public constructor() {
        this.users = {};
        this.rooms = {};
        this.msgID = 0;
    }

    public get info(): LobbyInfo {
        const rms = [] as RoomInfo[];
        for (const k in this.rooms) {
            if (k) {
                rms.push(this.rooms[Number(k)].info);
            }
        }
        return { users: this.users, rooms: rms };
    }

    public addUser(user: UserData): void {
        this.users[user.id] = user;
    }

    public removeUser(userid: string): void {
        delete this.users[userid];
    }

    public createRoom(description: string, opt?: RoomOptions): Room {
        let no = 1;
        while (this.rooms[no]) {
            no++;
        }
        const room = new Room(no, description, opt);
        this.rooms[no] = room;
        room.onRemove = r => {
            this.removeRoom(r.no);
        };
        return room;
    }

    public removeRoom(no: number) {
        delete this.rooms[no];
        this.ioLobby.emit("room removed", no);
        console.log("room #" + no + " removed");
    }

    public inviteToRoom(no: number, userid: string, fromUser: UserData) {
        this.ioLobby.to(userid).emit("recieved invitation", this.rooms[no]);
    }

    public handleLobbyEvent(io: SocketIO.Server): void {
        this.ioLobby = io.of("/lobby");
        this.ioLobby.on("connection", (socket: SocketIO.Socket) => {
            if (!socket.request.user || !socket.request.user.logged_in) {
                console.log("not authorized access");
                socket.emit("unauthorized", "Not logged in to lobby");
                return;
            }
            const user = new UserData(socket.request.user);
            this.addUser(user);
            console.log(user.id + " joined to lobby");

            // join user room for private invitation
            socket.join(user.id);

            socket.broadcast.emit("user joined", user);
            socket.emit("account", user);
            socket.emit("info", this.info);

            socket.on("req info", () => {
                socket.emit("info", this.info);
            });

            socket.on("send msg", (text: string) => {
                this.ioLobby.emit("recieve msg", { text, user: user.name, id: this.msgID });
                this.msgID++;
                console.log("recieved msg: " + text);
            });

            socket.on("new room", (data: { description: string; opt?: RoomOptions }) => {
                const room = this.createRoom(data.description, data.opt);
                room.handleRoomEvent(io, this);
                socket.emit("move to room", room.no);
                socket.broadcast.emit("room created", room.info);
            });

            socket.on("disconnect", () => {
                // remove user from lobby
                this.removeUser(user.id);
                socket.broadcast.emit("user left", user.id);
                console.log(user.id + " has left lobby");
            });
        });
    }
}

export interface LobbyInfo {
    users: { [key: string]: UserData };
    rooms: RoomInfo[];
}
