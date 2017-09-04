import * as React from "react";
import TextField from "material-ui/TextField";
import FlatButton from "material-ui/FlatButton";

interface Props {
    onSend: (msg: string) => void;
}

interface State {
    msg: string;
}

export default class MessageInput extends React.Component<Props, State> {

    constructor() {
        super();
        this.state = { msg: "" };
    }

    public handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") { this.handleSend(); }
    }

    public handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ msg: e.target.value });

    }

    public handleSend = () => {
        if (!this.state.msg) {
            return;
        }
        this.props.onSend(this.state.msg);
        this.setState({ msg: "" });
        const input = this.refs.chatMessage as HTMLInputElement;
        input.value = "";
    }

    render() {
        return (
            <div style={{ margin: "10px" }}>
                <TextField ref="chatMessage" value={this.state.msg} floatingLabelText="発言を入力" max={30}
                    onChange={this.handleMessageChange} onKeyDown={this.handleEnter} />
                <FlatButton label="送信" onClick={this.handleSend} disabled={!this.state.msg} />
            </div>
        );
    }
}
