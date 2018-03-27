import * as React from "react";
import { IUser, IRoom, IGameHistory } from "../types";
import Avatar from "material-ui/Avatar";
import Button from "material-ui/Button";
import * as goita from "goita-core";

import Board from "./goita/Board";
import Hand from "./goita/Hand";
import Players from "./Players";

interface Props {
    account: IUser;
    room: IRoom;
    board: string;
    playerNo: number;
    observer: boolean;
    onSitOn: (no: number) => void;
    onStandUp: () => void;
    onSetReady: () => void;
    onCancelReady: () => void;
}

export default class Game extends React.Component<Props, {}> {
    handlePlay = (b: goita.Koma, a: goita.Koma) => {
        console.log("play!" + b.Text + a.Text);
    };

    handlePass = () => {
        console.log("pass!");
    };

    render() {
        const board = goita.Board.createFromString(this.props.board);
        const frontPlayer = board.players[this.props.playerNo];
        const isMyTurn = board.turnPlayer.no === this.props.playerNo;
        const canPass = isMyTurn && board.canPass();
        const canPlay = isMyTurn && board.toThinkingInfo().getBlockKomaList().length > 0;
        const playPanel = (
            <div>
                <Hand hand={frontPlayer.hand} canPlay={canPlay} onPlay={this.handlePlay} noPreviewAttack={false} />
                <Button raised color="primary" disabled={!canPass} onClick={this.handlePass}>
                    なし
                </Button>
            </div>
        );

        return (
            <div>
                <Players
                    account={this.props.account}
                    room={this.props.room}
                    onSitOn={this.props.onSitOn}
                    onStandUp={this.props.onStandUp}
                />
                <Board
                    board={board}
                    showHidden={true}
                    frontPlayerNo={this.props.playerNo}
                    showFrontHand={this.props.observer}
                    viewScale={0.8}
                />
                {!this.props.observer && playPanel}
            </div>
        );
    }
}
