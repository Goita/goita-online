import * as React from "react";
import { AppState } from "../app/module";
import { LobbyState } from "./module";
import { ActionDispatcher } from "./Container";

import * as io from "socket.io-client";

interface Props {
    value: LobbyState;
    actions: ActionDispatcher;
}

interface State {
    msg: string;
}

export class Lobby extends React.Component<Props, State> {
    socket: SocketIOClient.Socket;
    componentDidMount() {
        this.socket = io.connect("/lobby");
        const socket = this.socket;
        socket.on("welcome", (msg: string) => {
            console.log(msg);
        });
        socket.on("unauthorized", (msg: string) => {
            console.log(msg);
            location.href = "/login";
        });
        socket.on("recieve msg", (msg) => {
            this.props.actions.reciveMessage(msg);
        });
    }

    public handleClickSend = () => {
        const msg = this.state.msg;
        this.socket.emit("send msg", msg);
    }

    public handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({ msg: e.target.value });
    }

    public render() {
        const rooms = this.props.value.rooms.map((r) => <div>room #{r.no}</div>);
        const list = this.props.value.users.map((u, i) => <div key={u.id}>no.{i} name: {u}</div>);
        const messages = this.props.value.messages.map((m) => <div key={m.id}>{m.user}: {m.text}</div>);
        return (
            <div>
                <div>{rooms}</div>
                <hr />
                <div>
                    {list}
                </div>
                <hr />
                <div>{messages}</div>
                <hr />
                <div className="input-pane">
                    <textarea id="lobby-chat-msg" cols={30} rows={10} placeholder="input message here..." onChange={this.handleMessageChange}></textarea>
                    <button onClick={this.handleClickSend}>SEND</button>
                </div>
            </div>
        );
    }
}
