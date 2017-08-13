import { Lobby } from "./Lobby";
import { connect, MapDispatchToPropsParam, MapStateToPropsParam } from "react-redux";
import { Dispatch } from "redux";
import { LobbyState, ChatMessage, User, Room, updateInfo, recieveMessage, userJoined, userLeft, roomCreated, roomRemoved } from "./module";
import { ReduxAction, ReduxState } from "../store";
import { RouteComponentProps } from "react-router";

export class ActionDispatcher {
    private myHeaders = new Headers({
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    });

    constructor(private dispatch: (action: ReduxAction) => void) { }

    public updateInfo(info: { users: User[], rooms: Room[] }): void {
        this.dispatch(updateInfo(info));
    }

    public reciveMessage(msg: ChatMessage): void {
        this.dispatch(recieveMessage(msg));
    }

    public userJoined(user: User): void {
        this.dispatch(userJoined(user));
    }

    public userLeft(userid: string): void {
        this.dispatch(userLeft(userid));
    }

    public roomCreated(room: Room): void {
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
