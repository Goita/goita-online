import * as React from "react";
import { IRoom, IGameHistory } from "../types";
import Avatar from "material-ui/Avatar";

import * as goita from "goita-core";

import GoitaBoard from "./common/GoitaBoard";

interface Props {
    room: IRoom;
    board: string;
    privateBoard: string;
}

export default class MessageList extends React.Component<Props, {}> {
    render() {
        const board = goita.Board.createFromString(this.props.board);
        return (
            <GoitaBoard board={board} width={600} height={800} showHidden={true} playerNo={0}></GoitaBoard>
        );
    }
}
