import * as React from "react";
import { AppState } from "./module";
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
        return;
    }

    public render() {
        return (
            <div>
                <h1>Navigation bar</h1>
                <li><Link to="/somewhere" >Somewhere</Link></li>
                <li><Link to="/game/lobby" >Lobby</Link></li>
                <li><Link to="/login" >Login</Link></li>
                <li><a href="/logout" >Logout</a></li>
                <hr />
                <GameContainer />
            </div>
        );
    }
}
