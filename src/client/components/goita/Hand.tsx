import * as React from "react";
import * as goita from "goita-core";

import Button from "material-ui/Button";
import Badge from "material-ui/Badge";
import KomaIcon from "./KomaIcon";

import { withStyles, WithStyles, StyleRules } from "material-ui/styles";

type classKeys = "block" | "relPos" | "absPos";
const styles: StyleRules<classKeys> = {
    block: {
        display: "block",
    },
    relPos: {
        position: "relative",
    },
    absPos: {
        position: "absolute",
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
            <Button raised disabled={!this.props.canPlay} key={k.value + i} onClick={this.stagePlayKoma(k)}>
                <KomaIcon koma={k} />
            </Button>
        ));

        const previewKoma = (type: string, koma: goita.Koma): JSX.Element => {
            return (
                <Badge badgeContent={type}>
                    <KomaIcon koma={koma} />
                </Badge>
            );
        };

        const blockPreview = previewKoma("受", this.state.block);
        const attackPreview = previewKoma("攻", this.state.attack);

        const disabledPlay = this.props.noPreviewAttack || !this.state.attack;

        return (
            <div>
                <div className={classes.block}>
                    {blockPreview}
                    {attackPreview}
                    {this.state.block && (
                        <Button raised onClick={this.resetPlayKoma}>
                            リセット
                        </Button>
                    )}
                    {this.state.block &&
                        this.state.attack && (
                            <Button raised disabled={disabledPlay} onClick={this.play}>
                                打つ
                            </Button>
                        )}
                </div>
                <div className={classes.block}>{list}</div>
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
