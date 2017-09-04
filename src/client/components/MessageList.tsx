import * as React from "react";
import { IChatMessage } from "../types";
import { List, ListItem } from "material-ui/List";
import Avatar from "material-ui/Avatar";

interface Props {
    messages: IChatMessage[];
}

export default class MessageList extends React.Component<Props, {}> {
    render() {
        const messages = this.props.messages.map((m) => <ListItem key={m.id} innerDivStyle={{ padding: "2px" }}>{m.user}: {m.text}</ListItem>);
        return (
            <List>
                {messages}
            </List>
        );
    }
}
