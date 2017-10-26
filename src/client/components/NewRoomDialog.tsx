import * as React from "react";
import { IRoom, IUser, IRoomOptions } from "../types";
import Dialog, { DialogActions, DialogContent, DialogContentText, DialogTitle } from "material-ui-next/Dialog";
import Button from "material-ui-next/Button";
import TextField from "material-ui-next/TextField";

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
    };

    public handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            this.handleCreate();
        }
    };

    handleCreate = () => {
        if (!this.state.description) {
            this.setState({ descError: "部屋の説明を入力してください" });
            return;
        }

        this.props.onCreateNewRoom(this.state.description, this.state.opt);
    };

    public handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value !== this.state.description) {
            this.setState({ description: e.target.value });
            if (e.target.value) {
                this.setState({ descError: "" });
            }
        }
    };

    render() {
        const isOptionVerified = this.verifyInput();
        return (
            <Dialog open={this.props.open} onRequestClose={this.props.onClose}>
                <DialogTitle>部屋の作成</DialogTitle>
                <DialogContent>
                    {/* errorText={this.state.descError} */}
                    {/* onKeyDown={this.handleKeyDown} */}
                    <TextField
                        id="description"
                        autoFocus
                        margin="dense"
                        label="部屋の説明を入力"
                        value={this.state.description}
                        onChange={this.handleDescriptionChange}
                    />
                    <hr />
                    <TextField id="settings" label="ルーム設定" helperText="そのうち実装" disabled={true} />
                </DialogContent>
                <DialogActions>
                    <Button color="primary" onClick={this.props.onClose}>
                        キャンセル
                    </Button>,
                    <Button color="primary" disabled={!isOptionVerified} onClick={this.handleCreate}>
                        作成
                    </Button>,
                </DialogActions>
            </Dialog>
        );
    }
}
