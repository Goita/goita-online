import * as React from "react";
import { AppState, LoginInfo } from "./module";
import { ActionDispatcher } from "./Container";
import { Link, Route } from "react-router-dom";
import GameContainer from "../GameContainer";

import * as io from "socket.io-client";

interface Props {
    value: AppState;
    actions: ActionDispatcher;
}

export class App extends React.Component<Props, {}> {
    componentDidMount() {
        const socket = io.connect();
        socket.on("unauthorized", (msg: string) => {
            location.href = "/login";
        });
        socket.on("login info", (info: LoginInfo) => {
            this.props.actions.loginSuccessed();
            this.props.actions.updateLoginInfo(info);
        });
        return;
    }

    public render() {
        return (
            <div>
                <h1>Navigation bar</h1>
                <li><Link to="/somewhere" >Somewhere</Link></li>
                <li><Link to="/game/lobby" >Lobby</Link></li>
                {this.props.value.isAuthenticated ? <li><img src={this.props.value.loginInfo.icon} /><div>{this.props.value.loginInfo.name}</div>
                    <a href="/logout" >Logout</a></li> : <li><Link to="/login" >Login</Link></li>
                }
                <hr />
                <GameContainer />
            </div>
        );
    }
}
