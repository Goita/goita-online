import * as React from "react";
import { RouteComponentProps } from "react-router";
import RaisedButton from "material-ui/RaisedButton";
import FontIcon from "material-ui/FontIcon";

interface LoginProps extends RouteComponentProps<any> {
    isAuthenticated: boolean;
}

interface LoginState {
    fetching: boolean;
    loggedin: boolean;
}

export default class Login extends React.Component<LoginProps, LoginState> {

    constructor() {
        super();
        this.state = { fetching: true, loggedin: false };
    }

    componentDidMount() {
        const myHeaders = new Headers({
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
        });
        fetch("/auth/check", {
            method: "GET",
            headers: myHeaders,
            credentials: "same-origin", // auto send cookies
        }).then((res) => {
            if (res.status === 200) {
                this.setState({ fetching: false, loggedin: true });
            } else {
                this.setState({ fetching: false, loggedin: false });
            }
        });
    }

    public notLoginRender() {
        return (
            <div>
                <RaisedButton
                    href="/auth/twitter"
                    target="_blank"
                    label="Twitterでログイン"
                    primary={true}
                    style={{ margin: 12 }}
                    icon={<FontIcon className="muidocs-icon-custom-github" />}
                />
                <div>
                    <a href="/auth/facebook">
                        Login With Facebook
                    </a>
                </div>
                <div>
                    <a href="/auth/google">
                        Login With Google+
                    </a>
                </div>
            </div >
        );
    }

    public loggedInRender() {
        return (
            <div>
                <p>You're already logged in.</p>
                <a href="/logout">Logout</a>
            </div>
        );
    }

    public render() {

        if (this.state.fetching) {
            return <div>checking Login status...</div>;
        } else {
            if (this.state.loggedin) {
                return this.loggedInRender();
            } else {
                return this.notLoginRender();
            }
        }
    }
}
