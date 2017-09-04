import { Action } from "redux";
import { IRoom, IUser, IChatMessage, IRoomOptions, IPlayer, IGameHistory } from "../types";

enum ActionNames {
    UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
    UPDATE_ROOM_INFO = "UPDATE_ROOM_INFO",
    USER_JOINED = "USER_JOINED",
    USER_LEFT = "USER_LEFT",
    UPDATE_ROOM_CONFIG = "UPDATE_ROOM_CONFIG",
    UPDATE_BOARD_INFO = "UPDATE_BOARD_INFO",
    UPDATE_PLAYER_INFO = "UPDATE_PLAYER_INFO",
    UPDATE_PRIVATE_BOARD_INFO = "UPDATE_PRIVATE_BOARD_INFO",
    UPDATE_GAME_HISTORY = "UPDATE_GAME_HISTORY",
    WAIT_GOSHI = "WAIT_GOSHI",
    DECIDE_GOSHI = "DECIDE_GOSHI",
    SOLVE_GOSHI = "SOLVE_GOSHI",
}

interface UpdateGameHistoryAction extends Action {
    type: ActionNames.UPDATE_GAME_HISTORY;
    histories: IGameHistory[];
}

export const updateGameHistory = (histories: IGameHistory[]): UpdateGameHistoryAction => ({
    type: ActionNames.UPDATE_GAME_HISTORY,
    histories,
});

interface UpdateRoomConfigAction extends Action {
    type: ActionNames.UPDATE_ROOM_CONFIG;
    opt: IRoomOptions;
}

export const updateRoomConfig = (opt: IRoomOptions): UpdateRoomConfigAction => ({
    type: ActionNames.UPDATE_ROOM_CONFIG,
    opt,
});

interface UpdateBoardInfoAction extends Action {
    type: ActionNames.UPDATE_BOARD_INFO;
    board: string;
}

export const updateBoardInfo = (board: string): UpdateBoardInfoAction => ({
    type: ActionNames.UPDATE_BOARD_INFO,
    board,
});

interface UpdatePlayerInfoAction extends Action {
    type: ActionNames.UPDATE_PLAYER_INFO;
    players: IPlayer[];
}

export const updatePlayerInfo = (players: IPlayer[]): UpdatePlayerInfoAction => ({
    type: ActionNames.UPDATE_PLAYER_INFO,
    players,
});

interface UpdatePrivateBoardInfoAction extends Action {
    type: ActionNames.UPDATE_PRIVATE_BOARD_INFO;
    board: string;
}

export const updatePrivateBoardInfo = (board: string): UpdatePrivateBoardInfoAction => ({
    type: ActionNames.UPDATE_PRIVATE_BOARD_INFO,
    board,
});

interface UpdateAccountAction extends Action {
    type: ActionNames.UPDATE_ACCOUNT;
    user: IUser;
}

export const updateAccount = (user: IUser): UpdateAccountAction => ({
    type: ActionNames.UPDATE_ACCOUNT,
    user,
});

interface UpdateRoomInfoAction extends Action {
    type: ActionNames.UPDATE_ROOM_INFO;
    // add an optional flag to avoid typecheck error
    room?: IRoom;
}

export const updateRoomInfo = (room: IRoom): UpdateRoomInfoAction => ({
    type: ActionNames.UPDATE_ROOM_INFO,
    room,
});

interface UserJoinedAction extends Action {
    type: ActionNames.USER_JOINED;
    user: IUser;
}

export const userJoined = (user: IUser): UserJoinedAction => ({
    type: ActionNames.USER_JOINED,
    user,
});

interface UserLeftAction extends Action {
    type: ActionNames.USER_LEFT;
    userid: string;
}

export const userLeft = (userid: string): UserLeftAction => ({
    type: ActionNames.USER_LEFT,
    userid,
});

interface WaitGoshiAction extends Action {
    type: ActionNames.WAIT_GOSHI;
}

export const waitGoshi = (): WaitGoshiAction => ({
    type: ActionNames.WAIT_GOSHI,
});

interface DecideGoshiAction extends Action {
    type: ActionNames.DECIDE_GOSHI;
}

export const decideGoshi = (): DecideGoshiAction => ({
    type: ActionNames.DECIDE_GOSHI,
});

interface SolveGoshiAction extends Action {
    type: ActionNames.SOLVE_GOSHI;
}

export const solveGoshi = (): SolveGoshiAction => ({
    type: ActionNames.SOLVE_GOSHI,
});

export interface RoomState {
    account: IUser;
    room: IRoom;
    users: IUser[];
    board: string;
    privateBoard: string;
    histories: IGameHistory[];
    goshiWait: boolean;
    goshiDecision: boolean;
}

export type RoomActions = UpdateAccountAction | UpdateRoomInfoAction | UserJoinedAction | UserLeftAction | UpdateBoardInfoAction | UpdatePlayerInfoAction | UpdatePrivateBoardInfoAction | UpdateRoomConfigAction | UpdateGameHistoryAction | WaitGoshiAction | SolveGoshiAction | DecideGoshiAction;

const initialBoard = "xxxxxxxx,xxxxxxxx,xxxxxxxx,xxxxxxxx,s1";

const initialState: RoomState = {
    account: { id: null, name: null, rate: 0, icon: null, roomNo: -1, sitting: false, joinedTime: new Date(Date.now()) }, room: { no: 0, description: "", users: {}, players: [], opt: null },
    users: [], board: initialBoard, privateBoard: initialBoard, histories: [], goshiDecision: false, goshiWait: false,
};

export default function reducer(state: RoomState = initialState, action: RoomActions): RoomState {
    switch (action.type) {
        case ActionNames.UPDATE_ACCOUNT:
            return { ...state, account: action.user };
        case ActionNames.UPDATE_ROOM_INFO:
            const users = [] as IUser[];
            for (const key of Object.keys(action.room.users)) {
                users.push(action.room.users[key]);
            }
            return { ...state, users, room: action.room };
        case ActionNames.USER_JOINED:
            return { ...state, users: [...state.users, action.user] };
        case ActionNames.USER_LEFT:
            return { ...state, users: state.users.filter((u) => u.id !== action.userid) };
        case ActionNames.UPDATE_ROOM_CONFIG:
            return { ...state, room: { ...state.room, opt: action.opt } };
        case ActionNames.UPDATE_PLAYER_INFO:
            return { ...state, room: { ...state.room, players: action.players } };
        case ActionNames.UPDATE_BOARD_INFO:
            return { ...state, board: action.board };
        case ActionNames.UPDATE_PRIVATE_BOARD_INFO:
            return { ...state, privateBoard: action.board };
        case ActionNames.UPDATE_GAME_HISTORY:
            return { ...state, histories: action.histories };
        case ActionNames.WAIT_GOSHI:
            return { ...state, goshiWait: true };
        case ActionNames.DECIDE_GOSHI:
            return { ...state, goshiDecision: true, goshiWait: true };
        case ActionNames.SOLVE_GOSHI:
            return { ...state, goshiDecision: false, goshiWait: false };
        default:
            return state;
    }
}
