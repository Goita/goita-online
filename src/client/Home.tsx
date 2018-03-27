import * as React from "react";
import { RouteComponentProps } from "react-router-dom";

export default class Home extends React.Component<RouteComponentProps<any>, {}> {
    public render() {
        return (
            <div>
                <h1>ごいたオンラインへようこそ！</h1>
                <p>
                    ゲームを開始する場合はこちら<a href="/lobby">ロビーへ移動</a>
                </p>
            </div>
        );
    }
}
