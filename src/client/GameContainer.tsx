import * as React from "react";
import { connect } from "react-redux";
import { Route, Switch, Redirect } from "react-router-dom";
import { RouteComponentProps } from "react-router";

import Lobby from "./lobby/Container";
import NotFound from "./NotFound";

class GameContainer extends React.Component<RouteComponentProps<any>, {}> {

    public render() {
        return (
            <div>
                <p>game container</p>
                <Switch>
                    <Route path="/game/lobby" component={Lobby} />
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
