import * as React from "react";
import Avatar from "material-ui/Avatar";
import { List, ListItem } from "material-ui/List";
import { IUser, IChatMessage } from "../types";

interface Props {
    users: IUser[];
}

/** displays user list  */
export default class UserList extends React.Component<Props, {}> {

    render() {
        const items = this.props.users.map((u) => {
            return <ListItem key={u.id} primaryText={u.name} secondaryText={"#" + u.roomNo} leftAvatar={<Avatar src={u.icon} />}>{"レート: " + u.rate}</ListItem>;
        });
        return (
            <List>
                {items}
            </List>
        );
    }
}
