import * as React from "react";
import { IGameHistory } from "../types";
import * as goita from "goita-core";
import List, { ListItem, ListItemText } from "material-ui/List";
import BoardHisotry from "./goita/BoardHistory";

interface Props {
    histories: IGameHistory[];
    current: string;
    playerNo: number;
}

export default class GameHistory extends React.Component<Props, {}> {
    render() {
        const items = this.props.histories.map((h, i) => (
            <ListItem key={i}>
                <ListItemText primary={(h.wonTeam === 0 ? "黒" : "白") + " " + h.wonUser.name + " 得点: " + h.wonScore} />
            </ListItem>
        ));
        const board = goita.Board.createFromString(this.props.current);
        return (
            <div>
                <BoardHisotry width={600} height={134} showHidden={true} board={board} playerNo={this.props.playerNo} />
                <List>{items}</List>
            </div>
        );
    }
}
