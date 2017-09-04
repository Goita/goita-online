import * as React from "react";
import { IRoom, IUser, IChatMessage, IRoomOptions } from "../types";
import { LobbyState } from "./module";
import { ActionDispatcher } from "./Container";
import { Redirect } from "react-router-dom";
import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from "material-ui/Toolbar";
import NavigationMenu from "material-ui/svg-icons/navigation/menu";
import IconButton from "material-ui/IconButton";
import Avatar from "material-ui/Avatar";
import Divider from "material-ui/Divider";
import { Tabs, Tab } from "material-ui/Tabs";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";

import * as io from "socket.io-client";

import RoomList from "../components/RoomList";
import Chat from "../components/Chat";
import AccountMenu from "../components/AccountMenu";

interface Props {
    value: LobbyState;
    actions: ActionDispatcher;
}

interface State {
    redirectToRoom: number;
    selectedTab: string;
    readMsg: number;
    messages: IChatMessage[];
}

export class Lobby extends React.Component<Props, State> {
    socket: SocketIOClient.Socket;

    constructor() {
        super();
        this.state = { redirectToRoom: -1, selectedTab: "room", readMsg: -1, messages: [] };
    }

    componentDidMount() {
        this.socket = io.connect("/lobby");
        const socket = this.socket;
        socket.on("unauthorized", (msg: string) => {
            console.log(msg);
            location.href = "/login";
        });
        socket.on("account", (user: IUser) => {
            this.props.actions.updateAccount(user);
        });
        socket.on("info", (info: { rooms: IRoom[], users: { [key: string]: IUser } }) => {
            const users = [] as IUser[];
            for (const key of Object.keys(info.users)) {
                users.push(info.users[key]);
            }

            this.props.actions.updateInfo({ users, rooms: info.rooms });
            console.log("lobby info");
        });

        socket.on("recieve msg", (msg: IChatMessage) => {
            this.setState({ messages: [...this.state.messages, msg] });
        });

        socket.on("user joined", (user: IUser) => {
            this.props.actions.userJoined(user);
            console.log("user joined");
        });
        socket.on("user left", (id: string) => {
            this.props.actions.userLeft(id);
        });

        socket.on("room created", (room: IRoom) => {
            this.props.actions.roomCreated(room);
        });
        socket.on("room removed", (no: number) => {
            this.props.actions.roomRemoved(no);
        });
        socket.on("move to room", (no: number) => {
            this.setState({ redirectToRoom: no });
            this.socket.close();
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

    public handleCreateRoom = (description: string, opt: IRoomOptions) => {
        this.socket.emit("new room", { description, opt });
    }

    public render() {
        if (this.state.redirectToRoom > 0) {
            return <Redirect to={"/room/" + this.state.redirectToRoom} />;
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
                            <MenuItem primaryText="部屋" onClick={() => this.setState({ selectedTab: "room" })} />
                            <MenuItem primaryText="チャット" onClick={() => this.setState({ selectedTab: "chat" })} />
                        </IconMenu>
                        <ToolbarTitle text="ごいたオンライン" />
                    </ToolbarGroup>
                    <ToolbarGroup>
                        <Avatar src={this.props.value.account.icon} />
                        {this.props.value.account.name + " R" + this.props.value.account.rate}
                        <AccountMenu />
                    </ToolbarGroup>
                </Toolbar>
                <Tabs value={this.state.selectedTab}
                    onChange={this.handleTabChange}>
                    <Tab label="部屋" value="room">
                        <RoomList rooms={this.props.value.rooms} onCreateNewRoom={this.handleCreateRoom} />
                    </Tab>
                    <Tab label="チャット" value="chat">
                        <Chat onSend={this.handleSend} users={this.props.value.users} messages={this.state.messages} />
                    </Tab>
                </Tabs>
            </div>
        );
    }
}
