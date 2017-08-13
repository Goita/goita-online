import { Action } from "redux";

enum ActionNames {
    LOGIN_REQUEST = "app/login/request",
    LOGIN_SUCCESS = "app/login/success",
}

interface RequestLoginAction extends Action {
    type: ActionNames.LOGIN_REQUEST;
    userlist?: string[]; // avoid typescript 2.4.x strict type check
}

export const requestLogin = (): RequestLoginAction => ({
    type: ActionNames.LOGIN_REQUEST,
});

interface RecieveLoginAction extends Action {
    type: ActionNames.LOGIN_SUCCESS;
}

export const login = (): RecieveLoginAction => ({
    type: ActionNames.LOGIN_SUCCESS,
});

export interface AppState {
    isAuthenticated: boolean;
    isFetching: boolean;
    socket: SocketIOClient.Socket;
}

export type AppActions = RecieveLoginAction | RequestLoginAction;

const initialState: AppState = {
    isAuthenticated: false,
    isFetching: false,
    socket: null,
};

export default function reducer(state: AppState = initialState, action: AppActions): AppState {
    switch (action.type) {
        case ActionNames.LOGIN_REQUEST:
            return { ...state, isFetching: true };
        case ActionNames.LOGIN_SUCCESS:
            console.log("login successed");
            return { ...state, isFetching: false, isAuthenticated: true };
        default:
            return state;
    }
}
