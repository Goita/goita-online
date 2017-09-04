import { Lobby } from "./Lobby";
import { connect, MapDispatchToPropsParam, MapStateToPropsParam } from "react-redux";
import { Dispatch } from "redux";
import { LobbyState, updateAccount, updateInfo, userJoined, userLeft, roomCreated, roomRemoved } from "./module";
import { ReduxAction, ReduxState } from "../store";
import { RouteComponentProps } from "react-router";
import { IUser, IRoom, IChatMessage } from "../types";

export class ActionDispatcher {
    private myHeaders = new Headers({
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    });

    constructor(private dispatch: (action: ReduxAction) => void) { }

    public updateAccount(user: IUser): void {
        this.dispatch(updateAccount(user));
    }
    public updateInfo(info: { users: IUser[], rooms: IRoom[] }): void {
        this.dispatch(updateInfo(info));
    }

    public userJoined(user: IUser): void {
        this.dispatch(userJoined(user));
    }

    public userLeft(userid: string): void {
        this.dispatch(userLeft(userid));
    }

    public roomCreated(room: IRoom): void {
        this.dispatch(roomCreated(room));
    }
    public roomRemoved(no: number): void {
        this.dispatch(roomRemoved(no));
    }
}

const mapStateToProps: MapStateToPropsParam<{ value: LobbyState }, any> = (state: ReduxState, ownProps: RouteComponentProps<{}>) => {
    return { value: state.lobby };
};

const mapDispatchToProps: MapDispatchToPropsParam<{ actions: ActionDispatcher }, {}> = (dispatch: Dispatch<ReduxAction>) => ({ actions: new ActionDispatcher(dispatch) });

export default connect(mapStateToProps, mapDispatchToProps)(Lobby);
