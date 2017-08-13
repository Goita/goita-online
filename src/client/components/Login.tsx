import * as React from "react";
import { RouteComponentProps } from "react-router";

interface LoginProps extends RouteComponentProps<any> {
    isAuthenticated: boolean;
}
export default class Login extends React.Component<LoginProps, {}> {

    public render() {
        return (
            <div>
                {this.props.isAuthenticated
                    ?
                    <p>You're already logged in.</p>
                    :
                    <a href="/auth/facebook">
                        Login With Facebook
                    </a>
                }
            </div>
        );
    }
}
