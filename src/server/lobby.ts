import * as SocketIO from "socket.io";
import UserData from "./user";
import { Room, RoomOptions } from "./room";

/** game lobby */
export default class Lobby {

    public io: SocketIO.Namespace;
    public msgID: number;
    public users: { [key: string]: UserData };
    public rooms: { [key: number]: Room };

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

    public createRoom(opt?: RoomOptions): Room {
        let no = 1;
        while (this.rooms[no]) { no++; }
        const room = new Room(no, opt);
        this.rooms[no] = room;
        return room;
    }

    public removeRoom(no: number) {
        delete this.rooms[no];
        this.io.emit("room removed", no);
    }

    public handleLobbyEvent(io: SocketIO.Server): void {

        this.io = io.of("/lobby");
        this.io.on("connection", (socket: SocketIO.Socket) => {
            if (!socket.request.user || !socket.request.user.logged_in) {
                console.log("not authorized access");
                socket.emit("unauthorized", "Not logged in to lobby");
                return;
            }
            const user = new UserData(socket.request.user);
            this.addUser(user);
            socket.broadcast.emit("user joined", user);

            socket.emit("info", { users: this.users, rooms: this.rooms });

            socket.on("req info", () => {
                socket.emit("info", { users: this.users, rooms: this.rooms });
            });

            socket.on("send msg", (text: string) => {
                this.io.emit("recieve msg", { text, user: user.name, id: this.msgID });
                this.msgID++;
                console.log("recieved msg: " + text);
            });

            socket.on("new room", (opt?: RoomOptions) => {
                const room = this.createRoom(opt);
                socket.emit("move to room", room.no);
                socket.broadcast.emit("room created", room);
            });

            socket.on("disconnect", () => {
                // remove user from room
                if (user.isInRoom) {
                    const room = this.rooms[user.roomNo];
                    if (user.sitting && !room.game.isEnd) {
                        const no = room.players.findIndex((p) => p.user.id === user.id);
                        room.leaveAccidentally(no);
                    } else if (user.sitting) {
                        const no = room.players.findIndex((p) => p.user.id === user.id);
                        room.standUp(no);
                    } else {
                        room.removeUser(user.id);
                    }
                }

                // remove user from lobby
                this.removeUser(user.id);
                socket.broadcast.emit("user left", user.id);
            });
        });
    }
}
