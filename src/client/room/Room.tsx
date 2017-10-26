import * as React from "react";
import { IRoom, IUser, IChatMessage, IRoomOptions, IPlayer, IGameHistory } from "../types";
import { withStyles, WithStyles } from "material-ui-next/styles";
import { RoomState } from "./module";
import { ActionDispatcher } from "./Container";
import { Link, Redirect } from "react-router-dom";
import AppBar from "material-ui-next/AppBar";
import Toolbar from "material-ui-next/Toolbar";
import Typography from "material-ui-next/Typography";
import MenuIcon from "material-ui-icons/Menu";
import IconButton from "material-ui-next/IconButton";
import Avatar from "material-ui-next/Avatar";
import Divider from "material-ui-next/Divider";
import Tabs, { Tab } from "material-ui-next/Tabs";
import Chat from "../components/Chat";
import Game from "../components/Game";
import GameHistory from "../components/GameHistory";
import * as io from "socket.io-client";

// TODO: considering the replacement
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";

enum RedirectLocation {
    none,
    lobby,
    login,
}

enum TabNames {
    game,
    history,
    chat,
}

const styles = {
    flex: {
        flex: 1,
    },
};

type Styles = keyof typeof styles;

interface Props {
    value: RoomState;
    actions: ActionDispatcher;
    no: number | undefined;
}

interface State {
    redirect: RedirectLocation;
    selectedTab: number;
    messages: IChatMessage[];
}

class Room extends React.Component<Props & WithStyles<Styles>, State> {
    socket: SocketIOClient.Socket;

    constructor() {
        super();
        this.state = { redirect: RedirectLocation.none, selectedTab: 0, messages: [] };
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

        socket.on("user updated", (user: IUser) => {
            this.props.actions.updateUser(user);
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

    public handleTabChange = (event: object, value: TabNames) => {
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
        const user = this.props.value.account;
        let playerNo = this.props.value.room.players.findIndex((p) => p.user && p.user.id === user.id);
        const board = playerNo < 0 ? this.props.value.board : this.props.value.privateBoard;
        const observer = (playerNo < 0);
        playerNo = observer ? 0 : playerNo;

        return (
            <div>
                <AppBar position="static">
                    <Toolbar>
                        <IconMenu
                            iconButtonElement={<IconButton><MenuIcon /></IconButton>}
                            anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
                            targetOrigin={{ horizontal: "left", vertical: "top" }}
                        >
                            <MenuItem primaryText="ゲーム" onClick={() => this.setState({ selectedTab: TabNames.game })} />
                            <MenuItem primaryText="履歴" onClick={() => this.setState({ selectedTab: TabNames.history })} />
                            <MenuItem primaryText="チャット" onClick={() => this.setState({ selectedTab: TabNames.chat })} />
                            <Divider />
                            <MenuItem primaryText="ロビーに戻る" onClick={() => this.setState({ redirect: RedirectLocation.lobby })} />
                        </IconMenu>
                        <Typography className={this.props.classes.flex}>
                            {"部屋 #" + this.props.no + " : " + this.props.value.room.description}
                        </Typography>
                        <div>
                            <Avatar src={this.props.value.account.icon} />
                            {this.props.value.account.name + " R" + this.props.value.account.rate}
                        </div>

                    </Toolbar>
                </AppBar>
                <Tabs value={this.state.selectedTab}
                    onChange={this.handleTabChange}>
                    <Tab label="ゲーム" value={TabNames.game}>
                        <Game room={this.props.value.room} board={board} playerNo={playerNo} observer={observer} />
                    </Tab>
                    <Tab label="ゲーム履歴" value={TabNames.history}>
                        <GameHistory playerNo={playerNo} current={board} histories={this.props.value.histories} />
                    </Tab>
                    <Tab label="チャット" value={TabNames.chat}>
                        <Chat onSend={this.handleSend} users={this.props.value.users} messages={this.state.messages} />
                    </Tab>
                </Tabs>
            </div>
        );
    }
}

export default withStyles(styles)<Props>(Room);
