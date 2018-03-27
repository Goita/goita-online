import * as React from "react";
import { withStyles, WithStyles, StyleRulesCallback, Theme } from "material-ui/styles";
import Grid from "material-ui/Grid";
import Avatar from "material-ui/Avatar";
import AccountMenu from "./AccountMenu";
import { IUser } from "../types";

type classKeys = "appIcon";
const styles: StyleRulesCallback<classKeys> = (theme: Theme) => ({
    appIcon: {
        fill: theme.palette.common.white,
    },
});

const decorate = withStyles(styles);

interface Props {
    account: IUser;
}

const UserStatus = decorate<Props>(props => {
    return (
        <div>
            <Grid container spacing={0}>
                <Grid item xs={4}>
                    <Avatar src={props.account.icon} />
                </Grid>
                <Grid item xs={4}>
                    {props.account.name + " R" + props.account.rate}
                </Grid>
                <Grid item xs={4}>
                    <AccountMenu className={props.classes.appIcon} />
                </Grid>
            </Grid>
        </div>
    );
});

export default UserStatus;
