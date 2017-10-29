import * as React from "react";
import { IChatMessage } from "../types";
import List, { ListItem, ListItemText } from "material-ui/List";
import Avatar from "material-ui/Avatar";
import { withStyles, WithStyles } from "material-ui";

const styles = {
    smallMargin: {
        margin: "2px",
    },
};

type ClassNames = keyof typeof styles;
interface Props {
    messages: IChatMessage[];
}

class MessageList extends React.Component<Props & WithStyles<ClassNames>, {}> {
    render() {
        const classes = this.props.classes;
        const messages = this.props.messages.map(m => (
            <ListItem key={m.id}>
                <ListItemText primary={m.user + ":" + m.text} className={classes.smallMargin} />
            </ListItem>
        ));
        return <List>{messages}</List>;
    }
}

export default withStyles(styles)(MessageList);
