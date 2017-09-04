import * as React from "react";
import AccountBox from "material-ui/svg-icons/action/account-box";
import IconButton from "material-ui/IconButton";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";

export default function AccountMenu(): JSX.Element {
    return (
        <IconMenu iconButtonElement={<IconButton><AccountBox /></IconButton>}>
            <MenuItem primaryText="ユーザ設定" onClick={() => location.href = "/account"} />
            <MenuItem primaryText="ログアウト" onClick={() => location.href = "/logout"} />
        </IconMenu>
    );
}
