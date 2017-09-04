import * as React from "react";
import { IRoom, IUser, IRoomOptions } from "../types";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import TextField from "material-ui/TextField";

interface Props {
    open: boolean;
    onCreateNewRoom: (description: string, opt: IRoomOptions) => void;
    onClose: () => void;
}

interface State {
    description: string;
    opt: IRoomOptions;
    descError: string;
}

export default class NewRoomDialog extends React.Component<Props, State> {
    constructor() {
        super();
        this.state = {
            description: "",
            descError: "",
            opt: null,
        };
    }

    verifyInput = (): boolean => {
        return this.state.description ? true : false;
    }

    public handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") { this.handleCreate(); }
    }

    handleCreate = () => {
        if (!this.state.description) {
            this.setState({ descError: "部屋の説明を入力してください" });
            return;
        }

        this.props.onCreateNewRoom(this.state.description, this.state.opt);
    }

    public handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value !== this.state.description) {
            this.setState({ description: e.target.value });
            if (e.target.value) {
                this.setState({ descError: "" });
            }
        }
    }

    render() {
        const isOptionVerified = this.verifyInput();
        const actions = [
            <FlatButton
                label="キャンセル"
                primary={true}
                onClick={this.props.onClose}
            />,
            <FlatButton
                label="作成"
                primary={true}
                keyboardFocused={true}
                disabled={!isOptionVerified}
                onClick={this.handleCreate}
            />,
        ];

        return (
            <Dialog title="部屋の作成"
                actions={actions}
                modal={false}
                open={this.props.open}
                onRequestClose={this.props.onClose}
            >
                <div>
                    <TextField value={this.state.description} errorText={this.state.descError} onChange={this.handleDescriptionChange} floatingLabelText="部屋の説明を入力" onKeyDown={this.handleKeyDown} />
                    <hr />
                    <TextField floatingLabelText="ルーム設定" hintText="そのうち実装" disabled={true} />
                </div>
            </Dialog>
        );
    }
}
