import robby, { RobbyActions, RobbyState } from "./robby/module";
import login, { LoginActions, LoginState } from "./login/module";
import { createStore, combineReducers, Action } from "redux";

export default createStore<ReduxState>(
    combineReducers({
        robby,
        login,
    }),
);

// tslint:disable-next-line:interface-over-type-literal
export type ReduxState = {
    robby: RobbyState;
    login: LoginState;
};

export type ReduxAction = RobbyActions | LoginActions | Action;
