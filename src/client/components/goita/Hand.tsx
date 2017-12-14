import * as React from "react";
import * as goita from "goita-core";

import Button from "material-ui/Button";
import Badge from "material-ui/Badge";
import KomaIcon from "./KomaIcon";
import PlayPreview from "./PlayPreview";
import Grid from "material-ui/Grid";

import { withStyles, WithStyles, StyleRules } from "material-ui/styles";

type classKeys = "container" | "itemPreview" | "itemReset" | "itemPlay" | "itemHands";
const styles: StyleRules<classKeys> = {
    container: {
        display: "grid",
        gridTemplateColumns: "140px 50px 50px auto",
        gridTemplateRows: "60px 80px",
    },
    itemPreview: {
        gridColumnStart: 1,
        gridColumnEnd: "span 1",
        gridRowStart: 1,
        gridRowEnd: "span 1",
    },
    itemReset: {
        gridColumnStart: 2,
        gridColumnEnd: "span 1",
        gridRowStart: 1,
        gridRowEnd: "span 1",
    },
    itemPlay: {
        gridColumnStart: 3,
        gridColumnEnd: "span 1",
        gridRowStart: 1,
        gridRowEnd: "span 1",
    },
    itemHands: {
        gridColumnStart: 1,
        gridColumnEnd: "span 4",
        gridRowStart: 2,
        gridRowEnd: "span 1",
    },
};

interface Props {
    hand: goita.Koma[];
    canPlay: boolean;
    onPlay: (block: goita.Koma, attack: goita.Koma) => void;
    noPreviewAttack: boolean;
}

interface State {
    block: goita.Koma;
    attack: goita.Koma;
}

class Hand extends React.Component<Props & WithStyles<classKeys>, State> {
    public constructor() {
        super();
        this.state = { block: null, attack: null };
    }

    public render() {
        const classes = this.props.classes;
        const list = this.removeHand(this.props.hand, this.state.block, this.state.attack).map((k, i) => (
            // <Button raised disabled={!this.props.canPlay} key={k.value + i} onClick={this.stagePlayKoma(k)}>
            <Grid item xs={1}>
                <KomaIcon koma={k} onClick={this.stagePlayKoma(k)} />
            </Grid>
            // {/* </Button> */}
        ));

        const disabledPlay = this.props.noPreviewAttack || !this.state.attack;

        return (
            <div className={classes.container}>
                <PlayPreview className={classes.itemPreview} block={this.state.block} attack={this.state.attack} />
                {this.state.block && (
                    <Button className={classes.itemReset} raised onClick={this.resetPlayKoma}>
                        リセット
                    </Button>
                )}
                {this.state.block &&
                    this.state.attack && (
                        <Button className={classes.itemPlay} raised disabled={disabledPlay} onClick={this.play}>
                            打つ
                        </Button>
                    )}
                <Grid className={classes.itemHands} container spacing={8}>
                    <Grid item xs={12}>
                        <Grid container spacing={8}>
                            {list}
                        </Grid>
                    </Grid>
                </Grid>
            </div>
        );
    }

    private play() {
        this.props.onPlay(this.state.block, this.state.attack);
        this.resetPlayKoma();
    }

    private stagePlayKoma = (koma: goita.Koma) => () => {
        if (!this.state.block) {
            this.setState({ block: koma });
        } else if (!this.state.attack) {
            if (this.props.noPreviewAttack) {
                this.props.onPlay(this.state.block, koma);
            } else {
                this.setState({ attack: koma });
            }
        }
    };

    private resetPlayKoma() {
        this.setState({ block: null, attack: null });
    }

    private removeHand(hand: goita.Koma[], block: goita.Koma, attack: goita.Koma): goita.Koma[] {
        const removeList = [block, attack];
        const retList = hand.slice();
        for (const koma of removeList) {
            if (!koma) {
                continue;
            }
            const i = goita.KomaArray.findIndexExact(retList, koma);
            retList.splice(i, 1);
        }
        return retList;
    }
}

export default withStyles<{} & classKeys>(styles)<Props>(Hand);
