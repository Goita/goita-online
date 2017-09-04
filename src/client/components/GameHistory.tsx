import * as React from "react";
import { IGameHistory } from "../types";
import { List, ListItem } from "material-ui/List";

interface Props {
    histories: IGameHistory[];
}

export default class GameHistory extends React.Component<Props, {}> {
    render() {
        const items = this.props.histories.map((h, i) =>
            <ListItem key={i} >
                {(h.wonTeam === 0 ? "黒" : "白") + " " + h.wonUser.name + " 得点: " + h.wonScore}
            </ListItem>,
        );
        return (
            <List>{items}</List>
        );
    }
}
