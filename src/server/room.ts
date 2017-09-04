import * as SocketIO from "socket.io";
import UserData from "./user";
import { User, UserModel } from "./models/User";
import { Player } from "./player";
import Lobby from "./lobby";
import * as goita from "goita-core";

/** game room */
export class Room {

    public no: number;
    public description: string;
    public users: { [key: string]: UserData };
    public userCount: number;
    public options: RoomOptions;
    public game: goita.Game;
    public isInGame: boolean;
    public players: Player[];
    public createdTime: Date;
    public owner: UserData;

    /** fires when this room is removed */
    public onRemove: (room: Room) => void;

    private msgID: number;
    private ioRoom: SocketIO.Namespace;

    public constructor(no: number, description: string, opt?: RoomOptions) {
        this.no = no;
        this.description = description;
        this.msgID = 0;
        this.game = goita.Factory.createGame();
        this.users = {};
        this.userCount = 0;
        this.players = [];
        for (let i = 0; i < 4; i++) {
            this.players[i] = new Player();
        }
        const o = opt ? opt : defaultRoomOptions;
        this.setOptions(o);
        this.createdTime = new Date(Date.now());
    }

    public get info(): RoomInfo {
        return { no: this.no, users: this.users, players: this.players, description: this.description, opt: this.options };
    }

    public get histories(): GameHistory[] {
        const histories = [] as GameHistory[];
        for (const b of this.game.history) {
            const fs = b.getFinishState();
            if (fs.wonScore > 0) {
                histories.push({ wonUser: this.players[fs.nextDealerNo].user, wonTeam: fs.nextDealerNo % 2, wonScore: fs.wonScore });
            }
        }
        return histories;
    }

    public addUser(user: UserData): void {
        this.users[user.id] = user;
        this.userCount++;
        user.roomNo = this.no;
        user.joinedTime = new Date(Date.now());
    }

    public removeUser(userid: string): void {
        const user = this.users[userid];
        user.roomNo = 0;
        delete this.users[userid];
        this.userCount--;
    }

    public sitDown(no: number, user: UserData): void {
        const p = this.players[no];
        p.user = user;
        p.absent = false;
        p.ready = false;
    }

    public standUp(no: number): void {
        const p = this.players[no];
        p.user = null;
        p.absent = false;
        p.ready = false;
    }

    public leaveAccidentally(no: number): void {
        this.players[no].absent = true;
    }

    public setOptions(opt: RoomOptions) {
        this.options = opt;
        this.game.dealOptions.noGoshi = opt.noYaku;
        this.game.dealOptions.noYaku = opt.noYaku;
        this.game.winScore = opt.score;
    }

    public forceRandomPlay() {
        if (this.game.board.isGoshiSuspended) {
            this.game.board.redeal();
        } else {
            const moves = this.game.board.toThinkingInfo().getPossibleMoves();
            const i = goita.Util.rand.integer(0, moves.length - 1);
            this.game.board.playMove(moves[i]);
        }
    }

    public handleRoomEvent(io: SocketIO.Server, lobby: Lobby): void {

        this.ioRoom = io.of("/room/" + this.no);
        this.ioRoom.on("connection", (socket: SocketIO.Socket) => {
            if (!socket.request.user || !socket.request.user.logged_in) {
                console.log("not authorized access");
                socket.emit("unauthorized", "Not logged in");
                return;
            }
            const user = new UserData(socket.request.user);
            this.addUser(user);
            console.log(user.id + " joined room #" + this.no);
            // for private information message
            socket.join(user.id);

            // Room message
            socket.broadcast.emit("user joined", user);
            socket.emit("account", user);

            socket.emit("info", this.info);

            socket.on("req info", () => {
                socket.emit("info", this.info);
            });

            socket.on("send msg", (text: string) => {
                this.ioRoom.emit("recieve msg", { text, user: user.name, id: this.msgID });
                this.msgID++;
                console.log("recieved msg: " + text);
            });

            socket.on("send invitation", (userid: string) => {
                lobby.inviteToRoom(this.no, userid, user);
            });

            socket.on("change config", (opt: RoomOptions) => {
                this.setOptions(opt);
                this.ioRoom.emit("config updated", opt);
            });

            // Table message
            socket.on("sit on", (no: number) => {
                if (this.players[no].user) {
                    socket.emit("invalid action", "cannot sit on");
                    return;
                }
                this.sitDown(no, user);
                this.ioRoom.emit("player info", this.players);
            });

            socket.on("stand up", (no: number) => {
                const sittingUser = this.players[no].user;
                if (!sittingUser || sittingUser.id !== user.id) {
                    socket.emit("invalid action", "cannot stand up");
                }

                this.standUp(no);
                this.ioRoom.emit("player info", this.players);
            });

            const sittingCheck = (no: number): boolean => {
                if (!user.sitting) {
                    socket.emit("invalid action", "cannot change ready status because of not sitting on");
                    return false;
                }
                if (!this.game.board.isEndOfDeal) {
                    socket.emit("invalid action", "cannot change ready status because match in progress");
                    return false;
                }
                if (!this.players[no].user || this.players[no].user.id !== user.id) {
                    socket.emit("invalid action", "cannot change ready status because of wrong information");
                    return false;
                }
                return true;
            };

            socket.on("set ready", (no: number) => {
                if (sittingCheck(no)) {
                    return;
                }
                this.players[no].ready = true;
                this.ioRoom.emit("player info", this.players);
                if (this.players.every((p) => p.ready)) {
                    if (!this.isInGame) {
                        this.game.startNewGame();
                        this.isInGame = true;
                    }
                    this.game.startNewDeal();
                }
            });

            socket.on("cancel ready", (no: number) => {
                if (sittingCheck(no)) {
                    return;
                }
                this.players[no].ready = false;
                this.ioRoom.emit("player info", this.players);
            });

            socket.on("swap seats", () => {
                const no = this.players.findIndex((p) => p.user && p.user.id === user.id);
                if (no < 0) {
                    socket.emit("invalid action", "cannot change ready status because of not sitting on");
                    return;
                }
                if (sittingCheck(no)) {
                    return;
                }
                // swap players
                this.ioRoom.emit("player info", this.players);
            });

            // Game message

            const sendBoardInfoToAll = () => {
                this.ioRoom.emit("board info", this.game.board.history.toAllHiddenString());
                for (let i = 0; i < 4; i++) {
                    const targetUser = this.players[i].user;

                    const info = this.game.board.history.toHiddenString(i);
                    socket.to(targetUser.id).emit("private board info", info);
                }
                if (this.game.board.isGoshiSuspended) {
                    const goshiNo = this.game.board.goshiPlayerNo[0];
                    for (let i = 0; i < 4; i++) {
                        const targetUser = this.players[i].user;
                        if (goshiNo !== i && goita.Util.isSameTeam(goshiNo, i)) {
                            socket.to(targetUser.id).emit("goshi decision");
                        } else {
                            socket.to(targetUser.id).emit("goshi wait");
                        }
                    }
                }
            };

            const sendGameHistoryInfoToAll = () => {
                this.ioRoom.emit("game history info", this.histories);
            };

            socket.on("play", (move: string) => {
                const m = goita.Move.fromStr(move);
                if (!this.game.board.canPlayMove(m)) {
                    socket.emit("invalid action", "cannot play");
                    return;
                }
                this.game.board.playMove(m);
                sendBoardInfoToAll();
                if (this.game.board.isEndOfDeal) {
                    sendGameHistoryInfoToAll();
                    this.players.forEach((p) => p.ready = false);
                    if (this.game.isEnd) {
                        this.isInGame = false;
                    }
                    this.ioRoom.emit("player info", this.players);
                }
            });

            socket.on("goshi proceed", () => {
                this.game.board.continueGoshi();
                this.ioRoom.emit("goshi started");
            });

            socket.on("goshi deal again", () => {
                this.game.board.redeal();
                this.game.startNewDeal();
                sendBoardInfoToAll();
            });

            socket.on("disconnect", () => {
                // remove user from room
                if (user.sitting) {
                    if (!this.game.isEnd) {
                        const no = this.players.findIndex((p) => p.user.id === user.id);
                        this.leaveAccidentally(no);
                    } else {
                        const no = this.players.findIndex((p) => p.user.id === user.id);
                        this.standUp(no);
                    }
                }

                this.removeUser(user.id);
                console.log("user left room #" + this.no);

                if (this.userCount > 0) {
                    socket.broadcast.emit("user left", user.id);
                } else {
                    if (this.onRemove) {
                        this.onRemove(this);
                    }
                }

            });
        });
    }
}

export interface RoomInfo {
    no: number;
    description: string;
    users: { [key: string]: UserData };
    players: Player[];
    opt: RoomOptions;
}
export interface RoomOptions {
    rateUpperLimit?: number;
    rateLowerLimit?: number;
    noRating: boolean;
    /** start next round automatically after this time */
    autoStartTime: number;
    /** main time */
    maintime: number;
    /** byo-yomi time */
    subtime: number;
    noYaku: boolean;
    /** match score */
    score: number;
}

export const defaultRoomOptions: RoomOptions = {
    noRating: false,
    autoStartTime: 60,
    maintime: 300,
    subtime: 20,
    noYaku: false,
    score: 150,
};

export interface GameHistory {
    wonUser: UserData;
    wonTeam: number;
    wonScore: number;
}
