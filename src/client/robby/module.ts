import { Action } from "redux";

enum ActionNames {
    UPDATE = "robby/update",
}

interface UpdateAction extends Action {
    type: ActionNames.UPDATE;
    userlist?: string[]; // avoid typescript 2.4.x strict type check
}

export const update = (userlist: string[]): UpdateAction => ({
    type: ActionNames.UPDATE,
    userlist,
});

export interface RobbyState {
    userlist: string[];
}

export type RobbyActions = UpdateAction;

const initialState: RobbyState = {
    userlist: [],
};

export default function reducer(state: RobbyState = initialState, action: RobbyActions): RobbyState {
    switch (action.type) {
        case ActionNames.UPDATE:
            return { ...state, userlist: action.userlist };
        default:
            return state;
    }
}
