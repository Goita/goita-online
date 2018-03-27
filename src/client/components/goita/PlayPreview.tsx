import * as React from "react";
import * as goita from "goita-core";

import Grid from "material-ui/Grid";
import Button from "material-ui/Button";
import Badge from "material-ui/Badge";
import KomaIcon from "./KomaIcon";

import { withStyles, WithStyles, StyleRules } from "material-ui/styles";

type classKeys = "block";
const styles: StyleRules<classKeys> = {
    block: {
        display: "block",
    },
};

interface Props {
    block: goita.Koma;
    attack: goita.Koma;
    className?: string;
}

class Hand extends React.Component<Props & WithStyles<classKeys>, {}> {
    public render() {
        const classes = this.props.classes;

        const previewKoma = (type: string, koma: goita.Koma): JSX.Element => {
            return (
                <Badge badgeContent={type}>
                    <KomaIcon koma={koma} />
                </Badge>
            );
        };

        const blockPreview = previewKoma("受", this.props.block);
        const attackPreview = previewKoma("攻", this.props.attack);

        return (
            <div className={this.props.className}>
                <Grid container spacing={8}>
                    <Grid item xs={6}>
                        {blockPreview}
                    </Grid>
                    <Grid item xs={6}>
                        {attackPreview}
                    </Grid>
                </Grid>
            </div>
        );
    }
}

export default withStyles<classKeys>(styles)<Props>(Hand);
