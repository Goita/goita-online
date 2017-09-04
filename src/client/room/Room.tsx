import * as React from "react";
import { IRoom, IUser, IChatMessage, IRoomOptions, IPlayer, IGameHistory } from "../types";

import { RoomState } from "./module";
import { ActionDispatcher } from "./Container";
import { Link, Redirect } from "react-router-dom";
import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from "material-ui/Toolbar";
import NavigationMenu from "material-ui/svg-icons/navigation/menu";
import IconButton from "material-ui/IconButton";
import Avatar from "material-ui/Avatar";
import Divider from "material-ui/Divider";
import { Tabs, Tab } from "material-ui/Tabs";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";
import Chat from "../components/Chat";
import Game from "../components/Game";
import GameHistory from "../components/GameHistory";

import * as io from "socket.io-client";

enum RedirectLocation {
    none,
    lobby,
    login,
}

interface Props {
    value: RoomState;
    actions: ActionDispatcher;
    no: number | undefined;
}

interface State {
    redirect: RedirectLocation;
    selectedTab: string;
    messages: IChatMessage[];
}

export class Room extends React.Component<Props, State> {
    socket: SocketIOClient.Socket;

    constructor() {
        super();
        this.state = { redirect: RedirectLocation.none, selectedTab: "game", messages: [] };
    }

    componentDidMount() {
        this.socket = io.connect("/room/" + this.props.no);
        const socket = this.socket;
        socket.on("connect_error", (error: any) => {
            console.log(error);
        });
        socket.on("connect_timeout", (timeout: any) => {
            console.log("connect timeout: " + timeout);
        });
        socket.on("disconnect", (reason: any) => {
            console.log("disconnect. reason: " + reason);
        });

        socket.on("error", (error: any) => {
            console.log(error);
            this.setState({ redirect: RedirectLocation.lobby });
        });
        socket.on("account", (user: IUser) => {
            this.props.actions.updateAccount(user);
        });
        socket.on("info", (room: IRoom) => {
            this.props.actions.updateRoomInfo(room);
            console.log(room);
        });
        socket.on("unauthorized", (msg: string) => {
            console.log(msg);
            this.setState({ redirect: RedirectLocation.login });
        });
        socket.on("recieve msg", (msg: IChatMessage) => {
            this.setState({ messages: [...this.state.messages, msg] });
        });

        socket.on("user joined", (user: IUser) => {
            this.props.actions.userJoined(user);
        });
        socket.on("user left", (id: string) => {
            this.props.actions.userLeft(id);
        });

        socket.on("config updated", (opt: IRoomOptions) => {
            this.props.actions.updateRoomConfig(opt);
        });
        socket.on("player info", (players: IPlayer[]) => {
            this.props.actions.updatePlayerInfo(players);
        });

        socket.on("game history info", (histories: IGameHistory[]) => {
            this.props.actions.updateGameHistory(histories);
        });

        socket.on("board info", (board: string) => {
            this.props.actions.updateBoardInfo(board);
        });

        socket.on("private board info", (board: string) => {
            this.props.actions.updatePrivateBoardInfo(board);
        });

        socket.on("goshi decision", () => {
            this.props.actions.decideGoshi();
        });

        socket.on("goshi wait", () => {
            this.props.actions.waitGoshi();
        });

        socket.on("goshi solve", () => {
            this.props.actions.solveGoshi();
        });
    }

    public handleSend = (msg: string) => {
        this.socket.emit("send msg", msg);
    }

    public handleTabChange = (value: string) => {
        this.setState({
            selectedTab: value,
        });
    }

    public render() {
        switch (this.state.redirect) {
            case RedirectLocation.login:
                this.socket.close();
                return <Redirect push to="/login" />;
            case RedirectLocation.lobby:
                console.log("return to lobby");
                this.socket.close();
                return <Redirect push to="/lobby" />;
            default:
        }

        return (
            <div>
                <Toolbar>
                    <ToolbarGroup>
                        <IconMenu
                            iconButtonElement={<IconButton><NavigationMenu /></IconButton>}
                            anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
                            targetOrigin={{ horizontal: "left", vertical: "top" }}
                        >
                            <MenuItem primaryText="ゲーム" onClick={() => this.setState({ selectedTab: "game" })} />
                            <MenuItem primaryText="チャット" onClick={() => this.setState({ selectedTab: "chat" })} />
                            <Divider />
                            <MenuItem primaryText="ロビーに戻る" onClick={() => this.setState({ redirect: RedirectLocation.lobby })} />
                        </IconMenu>
                        <ToolbarTitle text={"部屋 #" + this.props.no + " : " + this.props.value.room.description} />
                    </ToolbarGroup>
                    <ToolbarGroup>
                        <Avatar src={this.props.value.account.icon} />
                        {this.props.value.account.name + " R" + this.props.value.account.rate}
                    </ToolbarGroup>
                </Toolbar>
                <Tabs value={this.state.selectedTab}
                    onChange={this.handleTabChange}>
                    <Tab label="ゲーム" value="game">
                        <Game room={this.props.value.room} board={this.props.value.board} privateBoard={this.props.value.privateBoard} />
                    </Tab>
                    <Tab label="ゲーム履歴" value="history">
                        <GameHistory histories={this.props.value.histories} />
                    </Tab>
                    <Tab label="チャット" value="chat">
                        <Chat onSend={this.handleSend} users={this.props.value.users} messages={this.state.messages} />
                    </Tab>
                </Tabs>
            </div>
        );
    }
}
