import * as React from "react";
import { RouteComponentProps } from "react-router";
import RaisedButton from "material-ui/RaisedButton";
import FontIcon from "material-ui/FontIcon";

import "./Login.css";

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
                    backgroundColor="#1ab7ea"
                    labelColor="#FFFFFF"
                    labelStyle={{ textTransform: "none" }}
                    style={{ margin: 12 }}
                    icon={<FontIcon className="fa fa-twitter" />}
                />
                <RaisedButton
                    href="/auth/facebook"
                    target="_blank"
                    label="Facebookでログイン"
                    backgroundColor="#3b5998"
                    labelColor="#FFFFFF"
                    labelStyle={{ textTransform: "none" }}
                    style={{ margin: 12 }}
                    icon={<FontIcon className="fa fa-facebook" />}
                />
                <RaisedButton
                    href="/auth/google"
                    target="_blank"
                    label="Google+でログイン"
                    backgroundColor="#dd4b39"
                    labelColor="#FFFFFF"
                    labelStyle={{ textTransform: "none" }}
                    style={{ margin: 12 }}
                    icon={<FontIcon className="fa fa-google-plus" />}
                />
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
