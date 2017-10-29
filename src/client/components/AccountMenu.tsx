import * as React from "react";

import { withStyles, WithStyles } from "material-ui/styles";
import AccountBox from "material-ui-icons/AccountBox";
import IconButton from "material-ui/IconButton";
import Menu, { MenuItem } from "material-ui/Menu";

const styles = {
    root: {
        margin: 4,
    },
    fillWhite: {
        fill: "white",
    },
};
const decorate = withStyles(styles);

interface State {
    open: boolean;
    anchorEl: HTMLElement;
}

type ST = keyof typeof styles;
interface Props {
    className: string;
}

const AccountMenu = decorate(
    class extends React.Component<Props & WithStyles<ST>, State> {
        constructor() {
            super();
            this.state = {
                open: false,
                anchorEl: null,
            };
        }

        handleClick = (event: React.MouseEvent<HTMLElement>) => {
            this.setState({ open: true, anchorEl: event.currentTarget });
        };

        handleRequestClose = () => {
            this.setState({ open: false });
        };

        render() {
            return (
                <div className={this.props.classes.root}>
                    <IconButton
                        aria-owns={this.state.open ? "account-menu" : null}
                        aria-haspopup="true"
                        onClick={this.handleClick}>
                        <AccountBox className={this.props.classes.fillWhite} />
                    </IconButton>
                    <Menu
                        id="account-menu"
                        anchorEl={this.state.anchorEl}
                        open={this.state.open}
                        onRequestClose={this.handleRequestClose}>
                        <MenuItem onClick={() => (location.href = "/account")}>ユーザ設定</MenuItem>
                        <MenuItem onClick={() => (location.href = "/logout")}>ログアウト</MenuItem>
                    </Menu>
                </div>
            );
        }
    },
);

export default AccountMenu;
