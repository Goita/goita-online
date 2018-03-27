import UserData from "./user";
import Player from "./player";
export interface GameHistory {
    wonUser: UserData;
    wonTeam: number;
    wonScore: number;
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
