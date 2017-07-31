import * as React from "react";
import { RobbyState } from "./module";
import { ActionDispatcher } from "./Container";

interface Props {
    value: RobbyState;
    actions: ActionDispatcher;
}

export class Robby extends React.Component<Props, {}> {
    public render() {
        const list = this.props.value.userlist.map((u, i) => <div>no.{i} name: {u}</div>);

        return (
            <div>
                {list}
            </div>
        );
    }
}
