import robby, { RobbyActions, RobbyState } from "./robby/module";
import { createStore, combineReducers, Action } from "redux";

export default createStore<ReduxState>(
    combineReducers({
        robby,
    }),
);

// tslint:disable-next-line:interface-over-type-literal
export type ReduxState = {
    robby: RobbyState;
};

export type ReduxAction = RobbyActions | Action;
