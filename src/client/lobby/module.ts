import { Action } from "redux";

enum ActionNames {
    UPDATE_INFO = "UPDATE_INFO",
    USER_JOINED = "USER_JOINED",
    USER_LEFT = "USER_LEFT",
    // SEND_MESSAGE = "SEND_MESSAGE",
    RECIEVE_MESSAGE = "RECIEVE_MESSAGE",
    ROOM_CREATED = "ROOM_CREATED",
    ROOM_REMOVED = "ROOM_REMOVED",
}

interface UpdateInfoAction extends Action {
    type: ActionNames.UPDATE_INFO;
    // add an optional flag to avoid typecheck error
    info?: {
        users: User[],
        rooms: Room[],
    };
}

export const updateInfo = (info: { users: User[], rooms: Room[] }): UpdateInfoAction => ({
    type: ActionNames.UPDATE_INFO,
    info,
});

interface UserJoinedAction extends Action {
    type: ActionNames.USER_JOINED;
    user: User;
}

export const userJoined = (user: User): UserJoinedAction => ({
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

interface RecieveMessageAction extends Action {
    type: ActionNames.RECIEVE_MESSAGE;
    msg: ChatMessage;
}

export const recieveMessage = (msg: ChatMessage): RecieveMessageAction => ({
    type: ActionNames.RECIEVE_MESSAGE,
    msg,
});

interface RoomCreatedAction extends Action {
    type: ActionNames.ROOM_CREATED;
    room: Room;
}

export const roomCreated = (room: Room): RoomCreatedAction => ({
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

export interface ChatMessage {
    id: number;
    user: string;
    text: string;
}

export interface User {
    id: string;
    name: string;
    rate: number;
    icon: string;
    roomNo: number;
    sitting: boolean;
    joinedTime: Date;
}

export interface Room {
    no: number;
}

export interface LobbyState {
    rooms: Room[];
    users: User[];
    messages: ChatMessage[];
}

export type LobbyActions = UpdateInfoAction | RecieveMessageAction | UserJoinedAction | UserLeftAction | RoomCreatedAction | RoomRemovedAction;

const initialState: LobbyState = {
    rooms: [],
    users: [],
    messages: [],
};

export default function reducer(state: LobbyState = initialState, action: LobbyActions): LobbyState {
    switch (action.type) {
        case ActionNames.UPDATE_INFO:
            return { ...state, users: action.info.users, rooms: action.info.rooms };
        case ActionNames.RECIEVE_MESSAGE:
            return { ...state, messages: [...state.messages, action.msg] };
        case ActionNames.USER_JOINED:
            return { ...state, users: [...state.users, action.user] };
        case ActionNames.USER_LEFT:
            return { ...state, users: state.users.filter((u) => u.id !== action.userid) };
        case ActionNames.ROOM_CREATED:
            return { ...state, rooms: [...state.rooms, action.room] };
        case ActionNames.ROOM_REMOVED:
            return { ...state, rooms: state.rooms.filter((r) => r.no !== action.no) };
        default:
            return state;
    }
}
