import * as React from "react";
import { AppState } from "../app/module";
import { LobbyState, Room, User, ChatMessage } from "./module";
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

    constructor() {
        super();
        this.state = { msg: "" };
    }

    componentDidMount() {
        this.socket = io.connect("/lobby");
        const socket = this.socket;
        socket.on("info", (info: { rooms: { [key: number]: Room }, users: { [key: string]: User } }) => {
            const users = [] as User[];
            for (const key of Object.keys(info.users)) {
                users.push(info.users[key]);
            }
            const rooms = [] as Room[];
            for (const key of Object.keys(info.rooms)) {
                rooms.push(info.rooms[Number(key)]);
            }
            this.props.actions.updateInfo({ users, rooms });
        });
        socket.on("unauthorized", (msg: string) => {
            console.log(msg);
            location.href = "/login";
        });
        socket.on("recieve msg", (msg: ChatMessage) => {
            this.props.actions.reciveMessage(msg);
        });
    }

    public handleSend = () => {
        this.socket.emit("send msg", this.state.msg);
        this.setState({ msg: "" });
        const input = this.refs.chatMessage as HTMLInputElement;
        input.value = "";
    }

    public handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") { this.handleSend(); }
    }

    public handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ msg: e.target.value });
    }

    public render() {
        const rooms = this.props.value.rooms.map((r) => <div>room #{r.no}</div>);
        const list = this.props.value.users.map((u, i) => <div key={u.id}>no.{i} name: {u.name}</div>);
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
                    <input type="text" ref="chatMessage" placeholder="メッセージを入力してください..." size={30}
                        onChange={this.handleMessageChange} onKeyDown={this.handleEnter} />
                    <button onClick={this.handleSend}>送信</button>
                </div>
            </div>
        );
    }
}
