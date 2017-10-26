import { Action } from "redux";
import { IUser, IRoom, IChatMessage } from "../types";

enum ActionNames {
    UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
    UPDATE_INFO = "UPDATE_INFO",
    USER_JOINED = "USER_JOINED",
    USER_LEFT = "USER_LEFT",
    ROOM_CREATED = "ROOM_CREATED",
    ROOM_REMOVED = "ROOM_REMOVED",
}

interface UpdateAccountAction extends Action {
    type: ActionNames.UPDATE_ACCOUNT;
    user: IUser;
}

export const updateAccount = (user: IUser): UpdateAccountAction => ({
    type: ActionNames.UPDATE_ACCOUNT,
    user,
});

interface UpdateInfoAction extends Action {
    type: ActionNames.UPDATE_INFO;
    // add an optional flag to avoid typecheck error
    info?: {
        users: IUser[];
        rooms: IRoom[];
    };
}

export const updateInfo = (info: { users: IUser[]; rooms: IRoom[] }): UpdateInfoAction => ({
    type: ActionNames.UPDATE_INFO,
    info,
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

interface RoomCreatedAction extends Action {
    type: ActionNames.ROOM_CREATED;
    room: IRoom;
}

export const roomCreated = (room: IRoom): RoomCreatedAction => ({
    type: ActionNames.ROOM_CREATED,
    room,
});

interface RoomRemovedAction extends Action {
    type: ActionNames.ROOM_REMOVED;
    no: number;
}

export const roomRemoved = (no: number): RoomRemovedAction => ({
    type: ActionNames.ROOM_REMOVED,
    no,
});

export interface LobbyState {
    account: IUser;
    rooms: IRoom[];
    users: IUser[];
}

export type LobbyActions =
    | UpdateAccountAction
    | UpdateInfoAction
    | UserJoinedAction
    | UserLeftAction
    | RoomCreatedAction
    | RoomRemovedAction;

const initialState: LobbyState = {
    account: { id: null, name: null, rate: 0, icon: null, roomNo: -1, joinedTime: new Date(Date.now()) },
    rooms: [],
    users: [],
};

export default function reducer(state: LobbyState = initialState, action: LobbyActions): LobbyState {
    switch (action.type) {
        case ActionNames.UPDATE_ACCOUNT:
            return { ...state, account: action.user };
        case ActionNames.UPDATE_INFO:
            return { ...state, users: action.info.users, rooms: action.info.rooms };
        case ActionNames.USER_JOINED:
            return { ...state, users: [...state.users, action.user] };
        case ActionNames.USER_LEFT:
            return { ...state, users: state.users.filter(u => u.id !== action.userid) };
        case ActionNames.ROOM_CREATED:
            return { ...state, rooms: [...state.rooms, action.room] };
        case ActionNames.ROOM_REMOVED:
            return { ...state, rooms: state.rooms.filter(r => r.no !== action.no) };
        default:
            return state;
    }
}
