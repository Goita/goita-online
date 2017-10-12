import * as React from "react";
import { IRoom, IGameHistory } from "../types";
import Avatar from "material-ui/Avatar";

import * as goita from "goita-core";

import Board from "./goita/Board";
import Hand from "./goita/Hand";
import RaisedButton from "material-ui/RaisedButton";

interface Props {
    room: IRoom;
    board: string;
    playerNo: number;
    observer: boolean;
}

export default class Game extends React.Component<Props, {}> {
    render() {
        const board = goita.Board.createFromString(this.props.board);
        const frontPlayer = board.players[this.props.playerNo];
        const isMyTurn = board.turnPlayer.no === this.props.playerNo;
        const canPass = isMyTurn && board.canPass();
        const canPlay = isMyTurn && board.toThinkingInfo().getBlockKomaList().length > 0;
        const playPanel = (
            <div>
                <Hand hand={frontPlayer.hand} canPlay={canPlay} onPlay={(b, a) => { console.log("play!" + b.Text + a.Text); }} noPreviewAttack={false} />
                <RaisedButton primary disabled={!canPass} onClick={() => console.log("pass!")}>なし</RaisedButton>
            </div >
        );

        return (
            <div>
                <Board board={board} width={600} height={800} showHidden={true} frontPlayerNo={this.props.playerNo} showFrontHand={this.props.observer}></Board>
                {!this.props.observer && playPanel}
            </div>
        );
    }
}
