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

interface Props {
    koma?: goita.Koma | null;
}

interface State {}

class KomaIcon extends React.Component<Props & WithStyles<classKeys>, State> {
    public render() {
        const props = this.props;
        const classes = props.classes;
        if (props.koma) {
            return (
                <div className={classes.relPos}>
                    <img className={classes.absPos} src={"/images/koma.png"} />
                    <img className={classes.absPos} src={"/images/koma" + props.koma.value + ".png"} />
                </div>
            );
        } else {
            return (
                <div className={classes.relPos}>
                    <img className={classes.absPos} src={"/images/koma0.png"} />
                </div>
            );
        }
    }
}

export default withStyles(styles)<Props>(KomaIcon);
