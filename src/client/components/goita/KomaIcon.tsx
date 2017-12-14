import * as React from "react";
import * as goita from "goita-core";

import { withStyles, WithStyles, StyleRules } from "material-ui/styles";

type classKeys = "relPos" | "absPos";
const styles: StyleRules<classKeys> = {
    relPos: {
        position: "relative",
    },
    absPos: {
        position: "absolute",
    },
};

interface Props extends React.CSSProperties {
    koma?: goita.Koma | null;
    onClick?: () => void;
    className?: string;
}

interface State {}

class KomaIcon extends React.Component<Props & WithStyles<classKeys>, State> {
    public render() {
        const props = this.props;
        const classes = props.classes;
        let ret = null;
        if (props.koma) {
            ret = (
                <div className={classes.relPos}>
                    <img className={classes.absPos} src={"/images/koma.png"} />
                    <img
                        className={classes.absPos}
                        src={"/images/koma" + props.koma.value + ".png"}
                        onClick={this.props.onClick}
                    />
                </div>
            );
        } else {
            ret = (
                <div className={classes.relPos}>
                    <img className={classes.absPos} src={"/images/koma0.png"} onClick={this.props.onClick} />
                </div>
            );
        }

        return <div className={this.props.className}>{ret}</div>;
    }
}

export default withStyles(styles)<Props>(KomaIcon);
