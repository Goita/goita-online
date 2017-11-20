import * as React from "react";
import * as Pixi from "pixi.js";
import * as goita from "goita-core";
import { withStyles, WithStyles, StyleRules } from "material-ui/styles";

import { IDictionary } from "../../types";

const styles: StyleRules = {
    boardSize: {
        width: "100%",
        height: "50vh",
    },
};

type ClassNames = keyof typeof styles;

const contentWidth = 560;
const contentHeight = 560;
const komaWidth = 48;
const komaHeight = 48;

interface Props {
    board: goita.Board;
    frontPlayerNo: number;
    showFrontHand: boolean;
    showHidden: boolean;
    viewScale: number;
}

interface States {}

class Board extends React.Component<Props & WithStyles<ClassNames>, States> {
    private app: Pixi.Application;
    private textures: IDictionary<PIXI.Texture> = {};
    private hiddenSpriteList = new Array<PIXI.Sprite>();
    private textStyles: IDictionary<PIXI.TextStyle> = {};
    private gameCanvas: HTMLDivElement;

    private cropHeight: number;

    constructor() {
        super();
        this.loadTextures();
    }

    public update(): void {
        this.app.stage.removeChildren();
        this.setStaticContent();
        this.updateBoard();
        // this.app.renderer.render(this.app.stage);
    }

    /**
     * After mounting, add the Pixi Renderer to the div and start the Application.
     */
    public componentDidMount() {
        this.app = new Pixi.Application(0, 0, {
            antialias: false,
            backgroundColor: 0xccffaa,
        });
        this.gameCanvas.appendChild(this.app.view);
        this.app.start();

        this.setStaticContent();
        this.updateBoard();
        this.resize();
    }

    /**
     * Stop the Application when unmounting.
     */
    public componentWillUnmount() {
        this.app.renderer.destroy();
        // this.gameCanvas.removeChild(this.app.view);
        this.app.stop();
    }

    public componentDidUpdate(prevProps: Props, prevState: States) {
        this.update();
        this.resize();
    }

    /**
     * Simply render the div that will contain the Pixi Renderer.
     */
    public render() {
        // tslint:disable-next-line:no-this-assignment
        const component = this;
        return (
            <div
                ref={thisDiv => {
                    component.gameCanvas = thisDiv;
                }}
            />
        );
    }

    private setCenterPivot(sprite: PIXI.Sprite) {
        sprite.pivot.x = sprite.width / 2;
        sprite.pivot.y = sprite.height / 2;
        sprite.x = contentWidth / 2;
        sprite.y = contentHeight / 2;
        // sprite.scale.set(scale, scale);
    }

    private setStaticContent() {
        // board
        // const scale = 0.75;
        const scale = 1;

        const boardBg = new PIXI.Sprite(this.textures["board-bg"]);
        boardBg.texture.on("update", () => {
            boardBg.pivot.x = boardBg.width / 2;
            boardBg.pivot.y = boardBg.height / 2;
            boardBg.x = contentWidth / 2;
            boardBg.y = contentHeight / 2;
            boardBg.scale.set(scale, scale);
        });
        boardBg.name = "board-bg";
        this.app.stage.addChild(boardBg);

        const boardLines = new PIXI.Sprite(this.textures["board-line"]);
        boardLines.texture.on("update", () => {
            boardLines.pivot.x = boardLines.width / 2;
            boardLines.pivot.y = boardLines.height / 2;
            boardLines.x = contentWidth / 2;
            boardLines.y = contentHeight / 2;
            boardLines.scale.set(scale, scale);
        });
        boardLines.name = "board-line";
        this.app.stage.addChild(boardLines);
    }

    private updateBoard() {
        const poslist = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        const rf = 140;
        const rh = 250;
        const cx = contentWidth / 2;
        const cy = contentHeight / 2;
        for (let i = 0; i < 4; i++) {
            // show field
            const p = this.props.board.players[i];
            const vi = goita.Util.shiftTurn(i, -this.props.frontPlayerNo);
            const field = this.createFieldContainer(p.field, p.hiddenfield);
            // degree to radius
            field.rotation = -90 * vi / 180 * Math.PI;
            field.x = cx + poslist[vi][0] * rf;
            field.y = cy + poslist[vi][1] * rf;
            this.app.stage.addChild(field);

            // show hand
            if (i === this.props.frontPlayerNo && !this.props.showFrontHand) {
                continue;
            }
            const hand = this.createHandConainer(p.hand, i !== this.props.frontPlayerNo);
            hand.rotation = -90 * vi / 180 * Math.PI;
            hand.x = cx + poslist[vi][0] * rh;
            hand.y = cy + poslist[vi][1] * rh;
            this.app.stage.addChild(hand);
        }
    }

    private loadTextures() {
        const pathToImg = "/images/";
        this.textures["koma"] = PIXI.Texture.fromImage(pathToImg + "koma.png");
        this.textures["koma0"] = PIXI.Texture.fromImage(pathToImg + "koma0.png");
        this.textures["komax"] = PIXI.Texture.fromImage(pathToImg + "komax.png");
        for (let i = 1; i < (10 || 0); i = i + 1) {
            this.textures["koma" + i] = PIXI.Texture.fromImage(pathToImg + "koma" + i + ".png");
            this.textures["koma" + i + "dark"] = PIXI.Texture.fromImage(pathToImg + "koma" + i + "dark.png");
        }
        this.textures["board-line"] = PIXI.Texture.fromImage(pathToImg + "japanese-chess-bdl.png");
        this.textures["board-bg"] = PIXI.Texture.fromImage(pathToImg + "japanese-chess-bg.jpg");
        this.textures["forward"] = PIXI.Texture.fromImage(pathToImg + "ic_arrow_forward_black_48dp_1x.png");
        this.textures["back"] = PIXI.Texture.fromImage(pathToImg + "ic_arrow_back_black_48dp_1x.png");
        this.textures["first"] = PIXI.Texture.fromImage(pathToImg + "ic_first_page_black_48dp_1x.png");
        this.textures["last"] = PIXI.Texture.fromImage(pathToImg + "ic_last_page_black_48dp_1x.png");
    }

    private createFieldContainer(field: goita.Koma[], hiddenField: goita.Koma[]): PIXI.Container {
        const pcontainer = new PIXI.Container();
        for (let i = 0; i < 8; i++) {
            const f = field[i];
            const hf = hiddenField[i];
            const x = Math.floor(i / 2) * komaWidth;
            const y = (i % 2) * komaHeight;
            const slist = this.getKomaSpriteList(f, hf);
            for (const s of slist) {
                s.x = x;
                s.y = y;
                pcontainer.addChild(s);
            }
        }

        pcontainer.pivot.x = komaWidth * 2;
        pcontainer.pivot.y = komaHeight;
        return pcontainer;
    }

    private createHandConainer(hand: goita.Koma[], hidden: boolean): PIXI.Container {
        const hcontainer = new PIXI.Container();
        for (let i = 0; i < 8; i++) {
            const h = hand[i];
            if (h.isEmpty) {
                continue;
            }
            const slist = new Array<PIXI.Sprite>();
            const x = i * komaWidth;
            const y = 0;
            if (hidden) {
                const sb = new PIXI.Sprite(this.textures["komax"]);
                const sf = new PIXI.Sprite(this.textures["koma" + h.value + "dark"]);
                sf.renderable = this.props.showHidden;
                this.hiddenSpriteList.push(sf);
                slist.push(sb);
                slist.push(sf);
            } else {
                const sb = new PIXI.Sprite(this.textures["koma"]);
                const sf = new PIXI.Sprite(this.textures["koma" + h.value]);
                slist.push(sb);
                slist.push(sf);
            }

            for (const s of slist) {
                s.x = x;
                s.y = y;
                hcontainer.addChild(s);
            }
        }
        hcontainer.pivot.x = komaWidth * 4;
        hcontainer.pivot.y = komaHeight / 2;
        return hcontainer;
    }

    private getKomaSpriteList(koma: goita.Koma, hiddenKoma: goita.Koma, alwaysVisible: boolean = false): PIXI.Sprite[] {
        const slist = new Array<PIXI.Sprite>();
        if (koma.isEmpty) {
            const s = new PIXI.Sprite(this.textures["koma" + koma.value]);
            slist.push(s);
        } else if (koma.isHidden) {
            const s = new PIXI.Sprite(this.textures["koma" + koma.value]);
            const hs = new PIXI.Sprite(this.textures["koma" + hiddenKoma.value + "dark"]);
            if (!alwaysVisible) {
                hs.renderable = this.props.showHidden;
                this.hiddenSpriteList.push(hs);
            }
            slist.push(s);
            slist.push(hs);
        } else {
            const sb = new PIXI.Sprite(this.textures["koma"]);
            const sf = new PIXI.Sprite(this.textures["koma" + koma.value]);
            slist.push(sb);
            slist.push(sf);
        }
        return slist;
    }

    private setupTextStyles() {
        this.textStyles["rich"] = new PIXI.TextStyle({
            fontFamily: "",
            fontSize: 16,
            fontStyle: "italic",
            fontWeight: "bold",
            fill: ["#ffffff", "#00ff99"], // gradient
            stroke: "#4a1850",
            strokeThickness: 3,
            dropShadow: true,
            dropShadowColor: "#000000",
            dropShadowBlur: 2,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 3,
            wordWrap: true,
            wordWrapWidth: 440,
        });
        this.textStyles["history"] = new PIXI.TextStyle({
            fontSize: 24,
        });
    }

    private resize() {
        this.cropHeight = this.props.showFrontHand ? 0 : 50;
        const width = contentWidth * this.props.viewScale;
        const height = contentHeight * this.props.viewScale;
        const ratio = Math.min(width / contentWidth, height / contentHeight);
        this.app.renderer.resize(contentWidth * ratio, (contentHeight - this.cropHeight) * ratio);
        this.app.stage.scale.set(ratio);
        for (const child of this.app.stage.children) {
            if (child.name === "board-bg" || child.name === "board-line") {
                this.setCenterPivot(child as PIXI.Sprite);
            }
        }
    }
}

export default withStyles(styles)(Board);
