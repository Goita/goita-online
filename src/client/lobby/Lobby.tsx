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

    public handleCreateRoom = () => {
        const descriptionInput = this.refs.description as HTMLInputElement;
        const formData = {
            description: descriptionInput.value,
        };

        fetch("/api/game/room", {
            method: "post", body: JSON.stringify(formData),
            headers: new Headers({
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }),
            credentials: "same-origin", // auto send cookies
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                } else {
                    console.log("error on creating room... -> " + res.statusText);
                }
            }).then((data) => {
                console.log("room #" + data.no + " has created");
                location.href = "/game/room/" + data.no;
            });
    }

    public render() {
        const rooms = this.props.value.rooms.map((r) => <div key={r.no}>room #{r.no} description: {r.description}</div>);
        const users = this.props.value.users.map((u, i) => <div key={u.id}>no.{i} name: {u.name}</div>);
        const messages = this.props.value.messages.map((m) => <div key={m.id}>{m.user}: {m.text}</div>);
        return (
            <div>
                <h2>部屋一覧</h2>
                <div>{rooms}</div>
                <hr />
                <h2>ユーザー</h2>
                <div>
                    {users}
                </div>
                <hr />
                <h2>メッセージ</h2>
                <div>{messages}</div>
                <hr />
                <div className="input-pane">
                    <input type="text" ref="chatMessage" placeholder="メッセージを入力してください..." size={30}
                        onChange={this.handleMessageChange} onKeyDown={this.handleEnter} />
                    <button onClick={this.handleSend}>送信</button>
                </div>
                <form action="" onSubmit={this.handleCreateRoom} >
                    <h2>ルームの作成</h2>
                    <label>
                        <span>ルーム説明</span>
                        <input type="text" ref="description" placeholder="ルームの説明を入れてください..." size={20} />
                    </label>
                    <label>
                        <span>ルーム設定</span>
                        <input type="text" disabled placeholder="仮実装のため無効" />
                    </label>
                    <button type="submit">ルーム作成</button>
                </form>
            </div>
        );
    }
}
