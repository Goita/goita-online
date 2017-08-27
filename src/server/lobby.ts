import * as SocketIO from "socket.io";
import UserData from "./user";
import { Room, RoomOptions } from "./room";

/** game lobby */
export default class Lobby {

    public msgID: number;
    public users: { [key: string]: UserData };
    public rooms: { [key: number]: Room };

    private io: SocketIO.Server;
    private ioLobby: SocketIO.Namespace;

    public constructor() {
        this.users = {};
        this.rooms = {};
        this.msgID = 0;
    }

    public addUser(user: UserData): void {
        this.users[user.id] = user;
    }

    public removeUser(userid: string): void {
        delete this.users[userid];
    }

    public createRoom(description: string, opt?: RoomOptions): Room {
        let no = 1;
        while (this.rooms[no]) { no++; }
        const room = new Room(this.io, this, no, description, opt);
        this.rooms[no] = room;
        return room;
    }

    public removeRoom(no: number) {
        delete this.rooms[no];
        this.ioLobby.emit("room removed", no);
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

            // join user room for private invitation
            socket.join(user.id);

            socket.broadcast.emit("user joined", user);

            socket.emit("info", { users: this.users, rooms: this.rooms });

            socket.on("req info", () => {
                socket.emit("info", { users: this.users, rooms: this.rooms });
            });

            socket.on("send msg", (text: string) => {
                this.ioLobby.emit("recieve msg", { text, user: user.name, id: this.msgID });
                this.msgID++;
                console.log("recieved msg: " + text);
            });

            socket.on("new room", (data: { description: string, opt?: RoomOptions }) => {
                const room = this.createRoom(data.description, data.opt);
                socket.emit("move to room", room.no);
                socket.broadcast.emit("room created", room);
            });

            socket.on("disconnect", () => {
                // remove user from lobby
                this.removeUser(user.id);
                socket.broadcast.emit("user left", user.id);
            });
        });
    }
}
