import * as SocketIO from "socket.io";
import UserData from "./user";
import { User, UserModel } from "./models/User";
import * as goita from "goita-core";

/** game room */
export class Room {

    public no: number;
    public users: { [key: string]: UserData };
    public options: RoomOptions;
    public game: goita.Game;
    public players: Player[];
    public createdTime: Date;
    /** owner's userid */
    public owner: string;

    public constructor(no: number, opt?: RoomOptions) {
        this.no = no;
        this.game = goita.Factory.createGame();

        const o = opt ? opt : defaultRoomOptions;
        this.setOptions(o);
    }
    public addUser(user: UserData): void {
        this.users[user.id] = user;
    }

    public removeUser(userid: string): void {
        delete this.users[userid];
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
}

export interface RoomOptions {
    rateUpperLimit?: number;
    rateLowerLimit?: number;
    noRating: boolean;
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
    maintime: 300,
    subtime: 20,
    noYaku: false,
    score: 150,
};

export class Player {
    public user: UserData;
    /**
     * User has left. But game is in progress.
     * User will be removed when game finishes.
     */
    public absent: boolean;
    public ready: boolean;
    public maintime: number;
    public subtime: number;
}
