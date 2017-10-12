import * as React from "react";
import * as Pixi from "pixi.js";
import * as goita from "goita-core";

import { IDictionary } from "../../types";

const contentWidth = 600;
const contentHeight = 134;
const komaWidth = 48;
const komaHeight = 48;

interface HistoryProps {
    board: goita.Board;
    playerNo: number;
    showHidden: boolean;
    width: number;
    height: number;
}

export default class History extends React.Component<HistoryProps, {}> {
    private app: Pixi.Application;
    private graphics = new PIXI.Graphics();
    private textures: IDictionary<PIXI.Texture> = {};
    private hiddenSpriteList = new Array<PIXI.Sprite>();
    private textStyles: IDictionary<PIXI.TextStyle> = {};
    private gameCanvas: HTMLDivElement;

    constructor() {
        super();
    }

    /**
     * After mounting, add the Pixi Renderer to the div and start the Application.
     */
    public componentDidMount() {
        this.app = new Pixi.Application(contentWidth, contentHeight, { antialias: false, backgroundColor: 0xccffaa });
        this.gameCanvas.appendChild(this.app.view);
        this.app.start();

        this.loadTextures();
        this.setupTextStyles();

        this.update();

        this.resize();
    }

    /**
     * Stop the Application when unmounting.
     */
    public componentWillUnmount() {
        this.app.stop();
    }

    public componentDidUpdate(prevProps: HistoryProps, prevState: {}) {
        this.update();
        if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
            this.resize();
        }
    }

    /**
     * Simply render the div that will contain the Pixi Renderer.
     */
    public render() {
        // tslint:disable-next-line:no-this-assignment
        const component = this;
        return (
            <div ref={(thisDiv) => { component.gameCanvas = thisDiv; }} />
        );
    }

    private loadTextures() {
        const pathToImg = "./img/";
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

    private createHistoryContainer(history: goita.BoardHistory): PIXI.Container {
        const root = new PIXI.Container();
        // history window
        const g = new PIXI.Graphics();
        g.lineStyle(2, 0x0044CC, 1);
        g.beginFill(0x2299FF, 1);
        g.drawRoundedRect(0, 0, 596, 130, 15);
        g.endFill();

        root.addChild(g);

        const innerContent = new PIXI.Container();
        const moves = new Array<goita.Move[]>();
        for (let i = 0; i < 4; i++) {
            moves.push(new Array<goita.Move>());
        }
        // pad null to dealer position
        for (let i = 0; i < history.dealer; i++) {
            moves[i].push(null);
        }

        // fill with history
        for (const m of history.moveStack) {
            moves[m.no].push(m);
        }
        const nameOffset = 50;
        const margin = 10;
        const hlines = new Array<PIXI.Container>();
        for (let i = 0; i < 4; i++) {
            const c = new PIXI.Container();
            const pname = new PIXI.Text("p" + (i + 1), this.textStyles["rich"]);
            c.addChild(pname);
            let count = 0;
            for (const m of moves[i]) {
                if (!m) {
                    count++;
                    continue;
                }
                if (m.pass) {
                    const p = new PIXI.Text("なし", this.textStyles["history"]);
                    p.x = (komaWidth + margin) * count + nameOffset;
                    c.addChild(p);
                } else {
                    let blist: PIXI.Sprite[];
                    if (m.faceDown) {
                        blist = m.no === this.props.playerNo ?
                            this.getKomaSpriteList(goita.Koma.hidden, m.block, true) :
                            this.getKomaSpriteList(goita.Koma.hidden, m.block);

                    } else {
                        blist = this.getKomaSpriteList(m.block, m.block);
                    }
                    const alist = this.getKomaSpriteList(m.attack, m.attack);
                    for (const b of blist) {
                        b.x = (komaWidth + margin) * count + nameOffset;
                        b.scale.x = 0.5;
                        b.scale.y = 0.5;
                        c.addChild(b);
                    }
                    for (const a of alist) {
                        a.x = (komaWidth) * (count + 0.5) + margin * count + nameOffset;
                        a.scale.x = 0.5;
                        a.scale.y = 0.5;
                        c.addChild(a);
                    }
                }

                count++;
            }
            hlines.push(c);
        }
        const headerHeight = 23;
        for (let i = 0; i < 4; i++) {
            const line = hlines[i];
            line.position.y = (komaHeight + 6) / 2 * i + headerHeight;
            innerContent.addChild(line);
        }

        // history header
        for (let i = 0; i < moves[0].length; i++) {
            const text = new PIXI.Text((i + 1) + "順目", this.textStyles["rich"]);
            text.position.x = (komaWidth + margin) * i + nameOffset;
            innerContent.addChild(text);
        }

        innerContent.x = 4;
        innerContent.y = 0;
        root.addChild(innerContent);

        return root;
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

    private update() {
        this.app.stage.removeChildren();
        const history = this.createHistoryContainer(this.props.board.history);
        history.x = 2;
        history.y = 2;
        this.app.stage.addChild(history);
    }

    private resize() {
        const width = this.props.width;
        const height = this.props.height;
        const ratio = Math.min(width / contentWidth, height / contentHeight);
        this.app.renderer.resize(contentWidth * ratio, contentHeight * ratio);
        this.app.stage.scale.set(ratio);
    }

}
