import * as React from "react";
import * as goita from "goita-core";

import Button from "material-ui/Button";
import Badge from "material-ui/Badge";

import { withStyles, WithStyles } from "material-ui";

const styles = {
    block: {
        display: "block",
    },
    abs: {
        position: "absolute",
    },
};

type ClassNames = keyof typeof styles;

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

class Hand extends React.Component<Props & WithStyles<ClassNames>, State> {
    public constructor() {
        super();
        this.state = { block: null, attack: null };
    }

    componentWillUpdate(nextProps: Props, nextState: State) {
        // reset preview when player does not have own turn.
        if (!nextProps.canPlay) {
            this.resetPlayKoma();
        }
    }

    public render() {
        const classes = this.props.classes;
        const list = this.removeHand(this.props.hand, this.state.block, this.state.attack).map((k, i) => (
            <Button raised disabled={!this.props.canPlay} key={k.value + i} onClick={() => this.stagePlayKoma(k)}>
                <div className={classes.abs}>
                    <img src={"/images/koma.png"} />
                    <img src={"/images/koma" + k.value + ".png"} />
                </div>
            </Button>
        ));

        const blockPreview = this.previewKoma("受", this.state.block);
        const attackPreview = this.previewKoma("攻", this.state.attack);

        const disabledPlay = this.props.noPreviewAttack || !this.state.attack;

        return (
            <div>
                <div className={classes.block}>
                    {blockPreview}
                    {attackPreview}
                    {this.state.block && (
                        <Button raised onClick={() => this.resetPlayKoma()}>
                            リセット
                        </Button>
                    )}
                    {this.state.block &&
                        this.state.attack && (
                            <Button raised disabled={disabledPlay} onClick={() => this.play()}>
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

    private stagePlayKoma(koma: goita.Koma) {
        if (!this.state.block) {
            this.setState({ block: koma });
        } else if (!this.state.attack) {
            if (this.props.noPreviewAttack) {
                this.props.onPlay(this.state.block, koma);
            } else {
                this.setState({ attack: koma });
            }
        }
    }

    private resetPlayKoma() {
        this.setState({ block: null, attack: null });
    }

    private previewKoma(type: string, koma: goita.Koma): JSX.Element {
        return (
            <Badge badgeContent={type}>
                {koma ? (
                    <div>
                        <img src={"/images/koma.png"} />
                        <img src={"/images/koma" + koma.value + ".png"} />
                    </div>
                ) : (
                    <div>
                        <img src={"/images/koma0.png"} />
                    </div>
                )}
            </Badge>
        );
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

export default withStyles<{} & ClassNames>(styles)<Props>(Hand);
