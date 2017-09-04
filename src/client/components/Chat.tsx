import * as React from "react";
import * as ReactDOM from "react-dom";
import { IChatMessage, IUser } from "../types";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import UserList from "./UserList";

import * as styles from "./Chat.css";

interface Props {
    onSend: (msg: string) => void;
    messages: IChatMessage[];
    users: IUser[];
}

export default class Chat extends React.Component<Props, {}> {

    usersEnd: HTMLDivElement = null;
    messagesEnd: HTMLDivElement = null;

    scrollToBottom = () => {
        const node = ReactDOM.findDOMNode(this.messagesEnd);
        node.scrollIntoView({ behavior: "smooth" });
    }

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }
    render() {
        return (
            <div className={styles.height} style={{ display: "flex" }}>
                <div style={{ flex: 2 }}>
                    <div className={styles.scroll} >
                        <MessageList messages={this.props.messages} />
                        <div style={{ float: "left", clear: "both" }}
                            ref={(el) => { this.messagesEnd = el; }} />
                    </div>
                    <MessageInput onSend={this.props.onSend} />
                </div>
                <div className={styles.scroll} style={{ flex: 1 }}>
                    <UserList users={this.props.users} />
                    <div style={{ float: "left", clear: "both" }}
                        ref={(el) => { this.usersEnd = el; }} />
                </div>
            </div>
        );
    }
}
