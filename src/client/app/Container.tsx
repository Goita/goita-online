import { App } from "./App";
import { connect, MapDispatchToPropsParam, MapStateToPropsParam } from "react-redux";
import { Dispatch } from "redux";
import { AppState, requestLogin } from "./module";
import { ReduxAction, ReduxState } from "../store";
import { RouteComponentProps } from "react-router";

export class ActionDispatcher {
    private myHeaders = new Headers({
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    });

    constructor(private dispatch: (action: ReduxAction) => void) { }

    public requestLogin(): void {
        this.dispatch(requestLogin());
    }
}

const mapStateToProps: MapStateToPropsParam<{ value: AppState }, any> = (state: ReduxState, ownProps: RouteComponentProps<{}>) => {
    return { value: state.app };
};

const mapDispatchToProps: MapDispatchToPropsParam<{ actions: ActionDispatcher }, {}> = (dispatch: Dispatch<ReduxAction>) => ({ actions: new ActionDispatcher(dispatch) });

export default connect(mapStateToProps, mapDispatchToProps)(App);
