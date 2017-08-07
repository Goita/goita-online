import * as React from "react";
import { connect } from "react-redux";
import { Route, Switch, Redirect } from "react-router-dom";
import { RouteComponentProps } from "react-router";

import * as io from "socket.io-client";

import Robby from "./robby/Container";
import NotFound from "./NotFound";

class GameContainer extends React.Component<RouteComponentProps<any>, {}> {
    componentDidMount() {
        const socket = io.connect();
        socket.on("welcome", (msg: string) => {
            console.log(msg);
        });
        return;
    }

    public render() {
        return (
            <div>
                <p>game container</p>
                <Switch>
                    <Route path="/game/robby" component={Robby} />
                    <Redirect to="/" />
                </Switch>
            </div>
        );
    }
}
function mapStateToProps(state: {}) {
    return {};
}

export default connect(mapStateToProps)(GameContainer);
