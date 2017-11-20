import * as React from "react";
import { IRoom, IUser, IRoomOptions } from "../types";
import Table, { TableBody, TableHead, TableRow, TableCell } from "material-ui/Table";
import Button from "material-ui/Button";
import AddIcon from "material-ui-icons/Add";
import NewRoomDialog from "./NewRoomDialog";

import { withStyles, WithStyles } from "material-ui";

const styles = {
    create: {
        float: "right",
    },
};

type ClassNames = keyof typeof styles;

interface Props {
    rooms: IRoom[];
    onCreateNewRoom: (description: string, opt: IRoomOptions) => void;
}

interface State {
    newRoomDialogOpen: boolean;
}

class RoomList extends React.Component<Props & WithStyles<ClassNames>, State> {
    constructor(props: Props & WithStyles<ClassNames>) {
        super(props);
        this.state = { newRoomDialogOpen: false };
    }

    selectRoom = (roomNo: number) => () => {
        console.log("roomNo :" + roomNo + " selected.");
        return;
    };

    handleRoomClick = (no: number) => {
        console.log("room#" + no + " clicked!");
    };

    handleOpen = () => {
        this.setState({ newRoomDialogOpen: true });
    };
    handleClose = () => {
        this.setState({ newRoomDialogOpen: false });
    };

    render() {
        const classes = this.props.classes;
        const items = this.props.rooms.map(room => {
            return (
                <TableRow key={room.no}>
                    <TableCell onClick={this.selectRoom(room.no)}>{"#" + room.no}</TableCell>
                    <TableCell>{room.description}</TableCell>
                    <TableCell>{room.players.join(", ")}</TableCell>
                    <TableCell>{"-----"}</TableCell>
                </TableRow>
            );
        });
        return (
            <div>
                <Button fab color="accent" aria-label="add" className={classes.create} onClick={this.handleOpen}>
                    <AddIcon />
                </Button>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>部屋番号</TableCell>
                            <TableCell>説明</TableCell>
                            <TableCell>プレイヤー</TableCell>
                            <TableCell>設定</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>{items}</TableBody>
                </Table>
                <NewRoomDialog
                    open={this.state.newRoomDialogOpen}
                    onClose={this.handleClose}
                    onCreateNewRoom={this.props.onCreateNewRoom}
                />
            </div>
        );
    }
}

export default withStyles(styles)(RoomList);
