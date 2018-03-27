import * as React from "react";
import * as ReactDOM from "react-dom";
import { IChatMessage, IUser } from "../types";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import UserList from "./UserList";
import { withStyles, WithStyles } from "material-ui";

const styles = {
    scroll: {
        maxHeight: "80%",
        height: "80%",
        overflowY: "auto",
        border: "solid 1px red",
    },
    height: {
        height: "80vh",
    },
};

type ClassNames = keyof typeof styles;

interface Props {
    onSend: (msg: string) => void;
    messages: IChatMessage[];
    users: IUser[];
}

class Chat extends React.Component<Props & WithStyles<ClassNames>, {}> {
    usersEnd: HTMLDivElement = null;
    messagesEnd: HTMLDivElement = null;

    scrollToBottom = () => {
        const node = ReactDOM.findDOMNode(this.messagesEnd);
        node.scrollIntoView({ behavior: "smooth" });
    };

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }
    render() {
        const classes = this.props.classes;
        return (
            <div className={classes.height} style={{ display: "flex" }}>
                <div style={{ flex: 2 }}>
                    <div className={classes.scroll}>
                        <MessageList messages={this.props.messages} />
                        <div
                            style={{ float: "left", clear: "both" }}
                            ref={el => {
                                this.messagesEnd = el;
                            }}
                        />
                    </div>
                    <MessageInput onSend={this.props.onSend} />
                </div>
                <div className={classes.scroll} style={{ flex: 1 }}>
                    <UserList users={this.props.users} />
                    <div
                        style={{ float: "left", clear: "both" }}
                        ref={el => {
                            this.usersEnd = el;
                        }}
                    />
                </div>
            </div>
        );
    }
}

export default withStyles<{} & ClassNames>(styles)<Props>(Chat);
