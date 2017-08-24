import * as React from "react";
import { RouteComponentProps } from "react-router";
import Avatar from "material-ui/Avatar";
import LockIcon from "material-ui/svg-icons/action/lock-outline";
import { Card, CardTitle, CardText, CardActions } from "material-ui/Card";
import RaisedButton from "material-ui/RaisedButton";
import FontIcon from "material-ui/FontIcon";
import { cyan500, pinkA200 } from "material-ui/styles/colors";

import * as styles from "./Login.css";

interface LoginState {
    fetching: boolean;
}

export default class Login extends React.Component<RouteComponentProps<any>, LoginState> {

    constructor() {
        super();
        this.state = { fetching: true };
    }

    componentDidMount() {
        const myHeaders = new Headers({
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
        });
        fetch("/auth/check", {
            method: "GET",
            headers: myHeaders,
            credentials: "same-origin", // auto send cookies
        }).then((res) => {
            if (res.status === 200) {
                location.href = "/";
            } else {
                this.setState({ fetching: false });
            }
        });
    }

    public render() {
        return (
            <div className={styles.main} style={{ backgroundColor: cyan500 }}>
                {this.state.fetching ? this.fetching() : this.login()}
            </div >
        );
    }

    private fetching(): JSX.Element {
        return (
            <Card>
                <CardTitle title="ログイン" subtitle="ごいたオンライン認証画面" />
                <CardText>
                    ログイン状況を確認中・・・
                </CardText>
            </Card>
        );
    }

    private login(): JSX.Element {
        return (
            <Card>
                <CardTitle title="ログイン" subtitle="ごいたオンライン認証画面" />
                <CardText className={styles.text}>
                    いずれかのSNSアカウントでログインしてください。
                </CardText>
                <CardText className={styles.text}>
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
                        className={styles.snsBtn}
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
                        className={styles.snsBtn}
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
                        className={styles.snsBtn}
                        style={{ display: "block" }}
                        icon={<FontIcon className="fa fa-google" />}
                    />
                </CardActions>
            </Card>
        );
    }
}
