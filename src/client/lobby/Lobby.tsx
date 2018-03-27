import * as React from "react";
import { withStyles, WithStyles } from "material-ui/styles";
import { IRoom, IUser, IChatMessage, IRoomOptions } from "../types";
import { LobbyState } from "./module";
import { ActionDispatcher } from "./Container";
import { Redirect } from "react-router-dom";
import AppBar from "material-ui/AppBar";
import Toolbar from "material-ui/Toolbar";
import Typography from "material-ui/Typography";
import NavigationMenu from "material-ui-icons/Menu";
import IconButton from "material-ui/IconButton";
import Avatar from "material-ui/Avatar";
import Divider from "material-ui/Divider";
import Tabs, { Tab } from "material-ui/Tabs";
import Menu, { MenuItem } from "material-ui/Menu";

import * as io from "socket.io-client";

import RoomList from "../components/RoomList";
import Chat from "../components/Chat";
import UserStatus from "../components/UserStatus";

const styles = {
    appIcon: {
        fill: "white",
    },
    title: {
        flex: 1,
    },
};

type ClassNames = keyof typeof styles;

enum TabNames {
    room = 1,
    chat = 2,
}

interface Props {
    value: LobbyState;
    actions: ActionDispatcher;
}

interface State {
    redirectToRoom: number;
    selectedTab: TabNames;
    readMsg: number;
    messages: IChatMessage[];
    open: boolean;
    anchorEl: HTMLElement;
}

class Lobby extends React.Component<Props & WithStyles<ClassNames>, State> {
    socket: SocketIOClient.Socket;

    constructor() {
        super();
        this.state = {
            redirectToRoom: -1,
            selectedTab: TabNames.room,
            readMsg: -1,
            messages: [],
            open: false,
            anchorEl: null,
        };
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
        socket.on("info", (info: { rooms: IRoom[]; users: { [key: string]: IUser } }) => {
            const users = [] as IUser[];
            for (const key of Object.keys(info.users)) {
                users.push(info.users[key]);
            }

            this.props.actions.updateInfo({ users, rooms: info.rooms });
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
    };

    public handleTabChange = (event: object, value: TabNames) => {
        this.setState({
            selectedTab: value,
        });
    };

    public handleCreateRoom = (description: string, opt: IRoomOptions) => {
        this.socket.emit("new room", { description, opt });
    };

    handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        this.setState({ open: true, anchorEl: event.currentTarget });
    };

    handleRequestClose = () => {
        this.setState({ open: false });
    };

    selectTab = (menu: TabNames) => () => {
        this.setState({ selectedTab: menu });
        this.handleRequestClose();
    };

    public render() {
        if (this.state.redirectToRoom > 0) {
            return <Redirect to={"/room/" + this.state.redirectToRoom} />;
        }

        const classes = this.props.classes;

        return (
            <div>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton
                            aria-owns={this.state.open ? "lobby-menu" : null}
                            aria-haspopup="true"
                            onClick={this.handleMenuClick}>
                            <NavigationMenu className={classes.appIcon} />
                        </IconButton>
                        <Typography color="inherit" type="headline" className={classes.title}>
                            ごいたオンライン
                        </Typography>
                        <UserStatus account={this.props.value.account} />
                    </Toolbar>
                    <Tabs value={this.state.selectedTab} onChange={this.handleTabChange}>
                        <Tab label="部屋" value={TabNames.room} />
                        <Tab label="チャット" value={TabNames.chat} />
                    </Tabs>
                </AppBar>
                {this.state.selectedTab === TabNames.room && (
                    <RoomList rooms={this.props.value.rooms} onCreateNewRoom={this.handleCreateRoom} />
                )}
                {this.state.selectedTab === TabNames.chat && (
                    <Chat onSend={this.handleSend} users={this.props.value.users} messages={this.state.messages} />
                )}
                <Menu
                    id="lobby-menu"
                    open={this.state.open}
                    onRequestClose={this.handleRequestClose}
                    anchorEl={this.state.anchorEl}>
                    <MenuItem onClick={this.selectTab(TabNames.room)}>部屋</MenuItem>
                    <MenuItem onClick={this.selectTab(TabNames.chat)}>チャット</MenuItem>
                </Menu>
            </div>
        );
    }
}

export default withStyles(styles)(Lobby);
