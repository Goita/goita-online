import * as React from "react";
import { RouteComponentProps } from "react-router";

export default class Home extends React.Component<RouteComponentProps<any>, {}> {
    public render() {
        return (
            <div>
                <h1>ごいたオンラインへようこそ！</h1>
                <p>ゲームを開始する場合はこちら</p>
                <a href="/game/lobby">F</a>
            </div>
        );
    }
}
