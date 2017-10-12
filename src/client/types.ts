
export interface IDictionary<TValue> {
    [id: string]: TValue;
}

export interface IChatMessage {
    id: number;
    user: string;
    text: string;
}

export interface IUser {
    id: string;
    name: string;
    rate: number;
    icon: string;
    roomNo: number;
    joinedTime: Date;
}

export interface IRoom {
    no: number;
    description: string;
    users: { [key: string]: IUser };
    players: IPlayer[];
    opt: IRoomOptions;
}

export interface IPlayer {
    user: IUser;
    absent: boolean;
    ready: boolean;
    maintime: number;
    subtime: number;
}

export interface IRoomOptions {
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

export interface IGameHistory {
    wonUser: IUser;
    wonTeam: number;
    wonScore: number;
}
