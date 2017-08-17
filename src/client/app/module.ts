import { Action } from "redux";

enum ActionNames {
    LOGIN_REQUEST = "LOGIN_REQUEST",
    LOGIN_SUCCESS = "LOGIN_SUCCESS",
    UPDATE_LOGIN_INFO = "UPDATE_LOGIN_INFO",
}

interface RequestLoginAction extends Action {
    type: ActionNames.LOGIN_REQUEST;
    userlist?: string[]; // avoid typescript 2.4.x strict type check
}

export const requestLogin = (): RequestLoginAction => ({
    type: ActionNames.LOGIN_REQUEST,
});

interface LoginSuccessAction extends Action {
    type: ActionNames.LOGIN_SUCCESS;
}

export const loginSuccess = (): LoginSuccessAction => ({
    type: ActionNames.LOGIN_SUCCESS,
});

interface UpdateLoginInfoAction extends Action {
    type: ActionNames.UPDATE_LOGIN_INFO;
    info: LoginInfo;
}

export const updateLoginInfo = (info: LoginInfo): UpdateLoginInfoAction => ({
    type: ActionNames.UPDATE_LOGIN_INFO,
    info,
});

export interface LoginInfo {
    id: string;
    name: string;
    icon: string;
}

export interface AppState {
    isAuthenticated: boolean;
    isFetching: boolean;
    loginInfo: LoginInfo;
}

export type AppActions = LoginSuccessAction | RequestLoginAction | UpdateLoginInfoAction;

const initialState: AppState = {
    isAuthenticated: false,
    isFetching: false,
    loginInfo: { id: null, name: null, icon: null },
};

export default function reducer(state: AppState = initialState, action: AppActions): AppState {
    switch (action.type) {
        case ActionNames.LOGIN_REQUEST:
            return { ...state, isFetching: true };
        case ActionNames.LOGIN_SUCCESS:
            console.log("login successed");
            return { ...state, isFetching: false, isAuthenticated: true };
        case ActionNames.UPDATE_LOGIN_INFO:
            return { ...state, loginInfo: action.info };
        default:
            return state;
    }
}
