import { Room } from "./Room";
import { connect, MapDispatchToPropsParam, MapStateToPropsParam } from "react-redux";
import { Dispatch } from "redux";
import { RoomState, updateAccount, updateRoomInfo, userJoined, userLeft, updateUser, updateBoardInfo, updatePlayerInfo, updatePrivateBoardInfo, updateRoomConfig, updateGameHistory, decideGoshi, waitGoshi, solveGoshi } from "./module";
import { ReduxAction, ReduxState } from "../store";
import { RouteComponentProps } from "react-router";
import { IUser, IRoom, IChatMessage, IRoomOptions, IPlayer, IGameHistory } from "../types";

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

    public updateRoomInfo(room: IRoom): void {
        this.dispatch(updateRoomInfo(room));
    }

    public userJoined(user: IUser): void {
        this.dispatch(userJoined(user));
    }

    public userLeft(userid: string): void {
        this.dispatch(userLeft(userid));
    }

    public updateUser(user: IUser): void {
        this.dispatch(updateUser(user));
    }

    public updateRoomConfig(opt: IRoomOptions): void {
        this.dispatch(updateRoomConfig(opt));
    }

    public updateBoardInfo(board: string): void {
        this.dispatch(updateBoardInfo(board));
    }

    public updatePrivateBoardInfo(board: string): void {
        this.dispatch(updatePrivateBoardInfo(board));
    }

    public updatePlayerInfo(players: IPlayer[]): void {
        this.dispatch(updatePlayerInfo(players));
    }

    public updateGameHistory(histories: IGameHistory[]): void {
        this.dispatch(updateGameHistory(histories));
    }

    public waitGoshi(): void {
        this.dispatch(waitGoshi());
    }

    public decideGoshi(): void {
        this.dispatch(decideGoshi());
    }
    public solveGoshi(): void {
        this.dispatch(solveGoshi());
    }
}

// pass react-router parameter to props
const mapStateToProps: MapStateToPropsParam<{ value: RoomState, no: number }, any> = (state: ReduxState, ownProps: RouteComponentProps<{ no: number | undefined }>) => {
    return { value: state.room, no: ownProps.match.params.no };
};

const mapDispatchToProps: MapDispatchToPropsParam<{ actions: ActionDispatcher }, {}> = (dispatch: Dispatch<ReduxAction>) => ({ actions: new ActionDispatcher(dispatch) });

export default connect(mapStateToProps, mapDispatchToProps)(Room);
