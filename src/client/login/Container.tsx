import { Login } from "./Login";
import { connect, MapDispatchToPropsParam, MapStateToPropsParam } from "react-redux";
import { Dispatch } from "redux";
import { LoginState, requestLoginFacebook } from "./module";
import { ReduxAction, ReduxState } from "../store";
import { RouteComponentProps } from "react-router";

export class ActionDispatcher {
    private myHeaders = new Headers({
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    });

    constructor(private dispatch: (action: ReduxAction) => void) { }

    public update(userlist: string[]): void {
        this.dispatch(requestLoginFacebook());
    }
}

const mapStateToProps: MapStateToPropsParam<{ value: LoginState }, any> = (state: ReduxState, ownProps: RouteComponentProps<{}>) => {
    return { value: state.login };
};

const mapDispatchToProps: MapDispatchToPropsParam<{ actions: ActionDispatcher }, {}> = (dispatch: Dispatch<ReduxAction>) => ({ actions: new ActionDispatcher(dispatch) });

export default connect(mapStateToProps, mapDispatchToProps)(Login);
