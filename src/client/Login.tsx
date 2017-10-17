import * as React from "react";
import { RouteComponentProps } from "react-router";

import Typography from "material-ui-next/Typography";
import Card, { CardContent, CardActions } from "material-ui-next/Card";
import { blue } from "material-ui-next/colors";

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
            <div className={classes.main} style={{ backgroundColor: blue[100] }}>
                {this.state.fetching ? this.fetching() : <LoginForm />}
            </div >
        );
    }

    private fetching(): JSX.Element {
        return (
            <Card>
                <CardContent title="ログイン">
                    <Typography type="headline">
                        ログイン
                    </Typography>
                    <Typography type="subheading">
                        ごいたオンライン認証画面
                    </Typography>
                    <Typography component="p">
                        ログイン状況を確認中・・・
                    </Typography>
                </CardContent>
            </Card>
        );
    }
}

export default withStyles<{} & ClassNames>(styles)<{}>(Login);
