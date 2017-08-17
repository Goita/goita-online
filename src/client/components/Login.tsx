import * as React from "react";
import { RouteComponentProps } from "react-router";

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
                <a href="/auth/twitter">
                    Login With Twitter
                </a>
                <a href="/auth/facebook">
                    Login With Facebook
                </a>
                <a href="/auth/google">
                    Login With Google+
                </a>
            </div>
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
