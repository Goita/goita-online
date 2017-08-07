import * as React from "react";
import { LoginState } from "./module";
import { ActionDispatcher } from "./Container";

interface Props {
    value: LoginState;
    actions: ActionDispatcher;
}

export class Login extends React.Component<Props, {}> {

    public render() {
        return (
            <div>
                {this.props.value.isAuthenticated
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
