import * as React from "react";
import TextField from "material-ui/TextField";
import Button from "material-ui/Button";

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

    public handleEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter") {
            this.handleSend();
        }
    };

    public handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ msg: e.target.value });
    };

    public handleSend = () => {
        if (!this.state.msg) {
            return;
        }
        this.props.onSend(this.state.msg);
        this.setState({ msg: "" });
    };

    render() {
        return (
            <div style={{ margin: "10px" }}>
                <TextField
                    value={this.state.msg}
                    helperText="発言を入力"
                    onChange={this.handleMessageChange}
                    onKeyDown={this.handleEnter}
                />
                <Button onClick={this.handleSend} disabled={!this.state.msg}>
                    送信
                </Button>
            </div>
        );
    }
}
