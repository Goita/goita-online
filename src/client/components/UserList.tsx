import * as React from "react";
import Avatar from "material-ui/Avatar";
import List, { ListItem, ListItemAvatar, ListItemText } from "material-ui/List";
import { IUser, IChatMessage } from "../types";

interface Props {
    users: IUser[];
}

/** displays user list  */
export default class UserList extends React.Component<Props, {}> {
    render() {
        const items = this.props.users.map(u => {
            return (
                <ListItem key={u.id}>
                    <ListItemAvatar>
                        <Avatar src={u.icon} />
                    </ListItemAvatar>
                    <ListItemText primary={u.name} secondary={"#" + u.roomNo} />
                    <ListItemText primary={"レート: " + u.rate} />
                </ListItem>
            );
        });
        return <List>{items}</List>;
    }
}
