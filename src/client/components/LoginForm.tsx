import * as React from "react";
import { RouteComponentProps } from "react-router";

import Typography from "material-ui/Typography";
import Card, { CardContent, CardActions } from "material-ui/Card";
import Button from "material-ui/Button";
import Grid from "material-ui/Grid";
import LoginButton from "./LoginButton";
import { withStyles, WithStyles } from "material-ui";

import * as FontAwesome from "react-fontawesome";

const styles = {
    title: {
        color: "yellow",
        backgroundColor: "skyblue",
    },
    text: {
        maxWidth: "400px",
        margin: "20px 0",
    },
};

type ClassNames = keyof typeof styles;

class LoginForm extends React.Component<{} & WithStyles<ClassNames>, {}> {
    public render(): JSX.Element {
        const classes = this.props.classes;
        return (
            <Card>
                <CardContent>
                    <Typography type="headline">ログイン</Typography>
                    <Typography type="subheading">ごいたオンライン認証画面</Typography>
                    <Typography className={classes.text}>いずれかのSNSアカウントでログインしてください。</Typography>
                    <Typography className={classes.text}>
                        SNSアカウントの登録IDが他のユーザに表示されることはありませんが、ユーザ名と画像アイコンは初期状態でログインに使用したSNSアカウントのものが使用されます。この設定はログイン後に変更することが可能です。
                    </Typography>
                </CardContent>
                <CardContent>
                    <Grid container direction="column" alignItems="center" justify="center" spacing={16}>
                        <Grid item xs={6}>
                            <LoginButton backgroundColor="#1ab7ea" fa="twitter" text="Twitter" href="/auth/twitter" />
                        </Grid>
                        <Grid item xs={6}>
                            <LoginButton
                                backgroundColor="#3b5998"
                                fa="facebook"
                                text="Facebook"
                                href="/auth/facebook"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <LoginButton backgroundColor="#dd4b39" fa="google" text="Google" href="/auth/google" />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    }
}

export default withStyles(styles)<{}>(LoginForm);
