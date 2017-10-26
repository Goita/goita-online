import * as React from "react";

import { withStyles, WithStyles } from "material-ui-next/styles";
import AccountBox from "material-ui-icons/AccountBox";
import IconButton from "material-ui-next/IconButton";
import Menu, { MenuItem } from "material-ui-next/Menu";

const styles = {
    root: {
        margin: 4,
    },
};
const decorate = withStyles(styles);

interface State {
    open: boolean;
    anchorEl: HTMLElement;
}

type ST = keyof typeof styles;
interface Props { }

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
        }

        handleRequestClose = () => {
            this.setState({ open: false });
        }

        render() {
            return (
                <div className={this.props.classes.root}>
                    <IconButton aria-owns={this.state.open ? "account-menu" : null} aria-haspopup="true" onClick={this.handleClick}>
                        <AccountBox />
                    </IconButton>
                    <Menu id="account-menu"
                        anchorEl={this.state.anchorEl}
                        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                        open={this.state.open}
                        onRequestClose={this.handleRequestClose}>
                        <MenuItem onClick={() => location.href = "/account"}>
                            ユーザ設定
                        </MenuItem>
                        <MenuItem onClick={() => location.href = "/logout"}>
                            ログアウト
                        </MenuItem>
                    </Menu>
                </div>
            );
        }
    });

export default AccountMenu;
