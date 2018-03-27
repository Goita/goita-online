import * as React from "react";
import { IUser, IRoom, IPlayer } from "../types";
import Avatar from "material-ui/Avatar";

import * as goita from "goita-core";

import Hand from "./goita/Hand";
import Button from "material-ui/Button";

interface Props {
    account: IUser;
    room: IRoom;
    onSitOn: (no: number) => void;
    onStandUp: () => void;
}

export default class Players extends React.Component<Props, {}> {
    handleSitAt = (no: number) => () => {
        this.props.onSitOn(no);
    };

    handleStandUp = () => {
        this.props.onStandUp();
    };

    render() {
        const players = this.props.room.players.map((p, i) => {
            return (
                <li key={i}>
                    {p.user ? (
                        <span>
                            {p.user.name +
                                " " +
                                (p.ready ? "READY" : "") +
                                " " +
                                (p.absent ? "離席中" : "") +
                                " 持ち時間:" +
                                p.maintime +
                                "秒 秒読み:" +
                                p.subtime}
                        </span>
                    ) : null}
                    {!p.user ? (
                        <Button raised onClick={this.handleSitAt(i)}>
                            席につく
                        </Button>
                    ) : null}
                    {p.user && p.user.id === this.props.account.id ? (
                        <Button raised onClick={this.handleStandUp}>
                            席を立つ
                        </Button>
                    ) : null}
                </li>
            );
        });
        return <ol>{players}</ol>;
    }
}
