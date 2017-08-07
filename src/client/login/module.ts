import { Action } from "redux";

enum ActionNames {
    LOGIN_REQUEST_FACEBOOK = "login/request/facebook",
    LOGIN_SUCCESS_FACEBOOK = "login/success/facebook",
}

interface RequestLoginFacebookAction extends Action {
    type: ActionNames.LOGIN_REQUEST_FACEBOOK;
    userlist?: string[]; // avoid typescript 2.4.x strict type check
}

export const requestLoginFacebook = (): RequestLoginFacebookAction => ({
    type: ActionNames.LOGIN_REQUEST_FACEBOOK,
});

interface RecieveLoginFacebookAction extends Action {
    type: ActionNames.LOGIN_SUCCESS_FACEBOOK;
}

export const loginFacebook = (): RecieveLoginFacebookAction => ({
    type: ActionNames.LOGIN_SUCCESS_FACEBOOK,
});

export interface LoginState {
    isAuthenticated: boolean;
    isFetching: boolean;
}

export type LoginActions = RecieveLoginFacebookAction | RequestLoginFacebookAction;

const initialState: LoginState = {
    isAuthenticated: false,
    isFetching: false,
};

export default function reducer(state: LoginState = initialState, action: LoginActions): LoginState {
    switch (action.type) {
        case ActionNames.LOGIN_REQUEST_FACEBOOK:
            return state;
        case ActionNames.LOGIN_SUCCESS_FACEBOOK:
            console.log("login successed");
            return state;
        default:
            return state;
    }
}
