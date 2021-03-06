import * as React from "react";
import { IRoom, IUser, IChatMessage, IRoomOptions, IPlayer, IGameHistory } from "../types";
import { withStyles, WithStyles } from "material-ui/styles";
import { RoomState } from "./module";
import { ActionDispatcher } from "./Container";
import { Link, Redirect } from "react-router-dom";
import AppBar from "material-ui/AppBar";
import Toolbar from "material-ui/Toolbar";
import Typography from "material-ui/Typography";
import MenuIcon from "material-ui-icons/Menu";
import IconButton from "material-ui/IconButton";
import Avatar from "material-ui/Avatar";
import Divider from "material-ui/Divider";
import Tabs, { Tab } from "material-ui/Tabs";
import Chat from "../components/Chat";
import Game from "../components/Game";
import GameHistory from "../components/GameHistory";
import * as io from "socket.io-client";
import Menu, { MenuItem } from "material-ui/Menu";
import UserStatus from "../components/UserStatus";

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
    fillWhite: {
        fill: "white",
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
    open: boolean;
    anchorEl: HTMLElement;
}

class Room extends React.Component<Props & WithStyles<Styles>, State> {
    socket: SocketIOClient.Socket;

    constructor() {
        super();
        this.state = {
            redirect: RedirectLocation.none,
            selectedTab: 0,
            messages: [],
            open: false,
            anchorEl: null,
        };
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
    };

    public handleTabChange = (event: object, value: TabNames) => {
        this.setState({
            selectedTab: value,
        });
    };

    selectTab = (menu: TabNames) => () => {
        this.setState({ selectedTab: menu });
        this.handleRequestClose();
    };

    handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        this.setState({ open: true, anchorEl: event.currentTarget });
    };

    handleRequestClose = () => {
        this.setState({ open: false });
    };

    handleSitOn = (no: number) => {
        this.socket.emit("sit on", no);
    };

    handleStandUp = () => {
        this.socket.emit("stand up");
    };

    handleSetReady = () => {
        this.socket.emit("set ready");
    };

    handleCancelReady = () => {
        this.socket.emit("cancel ready");
    };

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
        let playerNo = this.props.value.room.players.findIndex(p => p.user && p.user.id === user.id);
        const board = playerNo < 0 ? this.props.value.board : this.props.value.privateBoard;
        const observer = playerNo < 0;
        playerNo = observer ? 0 : playerNo;
        const classes = this.props.classes;
        return (
            <div>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton
                            aria-owns={this.state.open ? "lobby-menu" : null}
                            aria-haspopup="true"
                            onClick={this.handleMenuClick}>
                            <MenuIcon className={classes.fillWhite} />
                        </IconButton>
                        <Menu id="lobby-menu" anchorEl={this.state.anchorEl}>
                            <MenuItem onClick={this.selectTab(TabNames.game)}>ゲーム</MenuItem>
                            <MenuItem onClick={this.selectTab(TabNames.history)}>履歴</MenuItem>
                            <MenuItem onClick={this.selectTab(TabNames.chat)}>チャット</MenuItem>
                            <Divider />
                            <MenuItem href="/lobby">ロビーに戻る</MenuItem>
                        </Menu>
                        <Typography color="inherit" type="headline" className={this.props.classes.flex}>
                            {"部屋 #" + this.props.no + " : " + this.props.value.room.description}
                        </Typography>
                        <UserStatus account={this.props.value.account} />
                    </Toolbar>
                    <Tabs value={this.state.selectedTab} onChange={this.handleTabChange}>
                        <Tab label="ゲーム" value={TabNames.game} />
                        <Tab label="ゲーム履歴" value={TabNames.history} />
                        <Tab label="チャット" value={TabNames.chat} />
                    </Tabs>
                </AppBar>
                {this.state.selectedTab === TabNames.game && (
                    <Game
                        account={this.props.value.account}
                        room={this.props.value.room}
                        board={board}
                        playerNo={playerNo}
                        observer={observer}
                        onSitOn={this.handleSitOn}
                        onStandUp={this.handleStandUp}
                        onSetReady={this.handleSetReady}
                        onCancelReady={this.handleCancelReady}
                    />
                )}
                {this.state.selectedTab === TabNames.history && (
                    <GameHistory playerNo={playerNo} current={board} histories={this.props.value.histories} />
                )}
                {this.state.selectedTab === TabNames.chat && (
                    <Chat onSend={this.handleSend} users={this.props.value.users} messages={this.state.messages} />
                )}
            </div>
        );
    }
}

export default withStyles(styles)<Props>(Room);
