import lobby, { LobbyActions, LobbyState } from "./lobby/module";
import room, { RoomActions, RoomState } from "./room/module";
import { createStore, combineReducers, Action } from "redux";

export default createStore<ReduxState>(
    combineReducers({
        lobby,
        room,
    }),
);

// tslint:disable-next-line:interface-over-type-literal
export type ReduxState = {
    lobby: LobbyState;
    room: RoomState;
};

export type ReduxAction = Action | LobbyActions | RoomActions;
