import app, { AppActions, AppState } from "./app/module";
import lobby, { LobbyActions, LobbyState } from "./lobby/module";
import { createStore, combineReducers, Action } from "redux";

export default createStore<ReduxState>(
    combineReducers({
        app,
        lobby,
    }),
);

// tslint:disable-next-line:interface-over-type-literal
export type ReduxState = {
    app: AppState;
    lobby: LobbyState;
};

export type ReduxAction = Action | AppActions | LobbyActions;
