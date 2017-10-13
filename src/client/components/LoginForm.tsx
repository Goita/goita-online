import * as React from "react";
import { RouteComponentProps } from "react-router";

import LockIcon from "material-ui/svg-icons/action/lock-outline";
import { Card, CardTitle, CardText, CardActions } from "material-ui/Card";
import RaisedButton from "material-ui/RaisedButton";
import FontIcon from "material-ui/FontIcon";

import { withStyles, WithStyles } from "material-ui-next";

const styles = {
    title: {
        color: "yellow",
        backgroundColor: "skyblue",
    },
    text: {
        maxWidth: "400px",
    },
    snsBtn: {
        width: "70%!important",
        margin: "12px auto !important",
    },
};

type ClassNames = keyof typeof styles;

class LoginForm extends React.Component<{} & WithStyles<ClassNames>, {}> {

    public render(): JSX.Element {
        const classes = this.props.classes;
        return (
            <Card>
                <CardTitle title="ログイン" subtitle="ごいたオンライン認証画面" />
                <CardText className={classes.text}>
                    いずれかのSNSアカウントでログインしてください。
                </CardText>
                <CardText className={classes.text}>
                    SNSアカウントの登録IDが他のユーザに表示されることはありませんが、ユーザ名と画像アイコンは初期状態でログインに使用したSNSアカウントのものが使用されます。この設定はログイン後に変更することが可能です。
                </CardText>
                <CardActions>
                    <RaisedButton
                        href="/auth/twitter"
                        target="_blank"
                        label="Twitter"
                        backgroundColor="#1ab7ea"
                        labelColor="#FFFFFF"
                        labelStyle={{ textTransform: "none" }}
                        className={classes.snsBtn}
                        style={{ display: "block" }}
                        icon={<FontIcon className="fa fa-twitter" />}
                    />
                    <RaisedButton
                        href="/auth/facebook"
                        target="_blank"
                        label="Facebook"
                        backgroundColor="#3b5998"
                        labelColor="#FFFFFF"
                        labelStyle={{ textTransform: "none" }}
                        className={classes.snsBtn}
                        style={{ display: "block" }}
                        icon={<FontIcon className="fa fa-facebook" />}
                    />
                    <RaisedButton
                        href="/auth/google"
                        target="_blank"
                        label="Google"
                        backgroundColor="#dd4b39"
                        labelColor="#FFFFFF"
                        labelStyle={{ textTransform: "none" }}
                        className={classes.snsBtn}
                        style={{ display: "block" }}
                        icon={<FontIcon className="fa fa-google" />}
                    />
                </CardActions>
            </Card>
        );
    }
}

export default withStyles(styles)<{}>(LoginForm);
