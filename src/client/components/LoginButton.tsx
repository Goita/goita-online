import * as React from "react";
import Button from "material-ui/Button";
import Typography from "material-ui/Typography";

import * as FontAwesome from "react-fontawesome";

import withStyles, { WithStyles } from "material-ui/styles/withStyles";

const decorate = withStyles({
    root: {
        margin: 0,
    },
    snsBtnsText: {
        color: "white",
        textTransform: "none",
    },
});

interface Props {
    href: string;
    fa: string;
    text: string;
    backgroundColor: string;
}

const LoginButton = decorate<Props>(props => {
    return (
        <Button
            href={props.href}
            className={props.classes.snsBtnsText}
            style={{ backgroundColor: props.backgroundColor, width: 200 }}>
            <FontAwesome name={props.fa} size="2x" style={{ marginRight: "10px" }} />
            {props.text}
        </Button>
    );
});

export default LoginButton;
