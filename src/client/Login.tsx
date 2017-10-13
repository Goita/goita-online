import * as React from "react";
import { RouteComponentProps } from "react-router";

import LockIcon from "material-ui/svg-icons/action/lock-outline";
import { Card, CardTitle, CardText, CardActions } from "material-ui/Card";
import RaisedButton from "material-ui/RaisedButton";
import FontIcon from "material-ui/FontIcon";
import { cyan500, pinkA200 } from "material-ui/styles/colors";

import LoginForm from "./components/LoginForm";

import { withStyles, WithStyles } from "material-ui-next";

const styles = {
    main: {
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
    },
};

type ClassNames = keyof typeof styles;

interface LoginState {
    fetching: boolean;
}

class Login extends React.Component<RouteComponentProps<any> & WithStyles<ClassNames>, LoginState> {

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
        const classes = this.props.classes;
        return (
            <div className={classes.main} style={{ backgroundColor: cyan500 }}>
                {this.state.fetching ? this.fetching() : <LoginForm />}
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
}

export default withStyles<{} & ClassNames>(styles)<{}>(Login);
