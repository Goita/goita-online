import * as React from "react";
import { Link, Route, Switch } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Lobby from "./lobby/Container";
import Room from "./room/Container";

import NotFound from "./NotFound";

export default class Routes extends React.Component {
    render() {
        return (
            <Switch>
                <Route exact path="/" component={Home} />
                <Route path="/lobby" component={Lobby} />
                <Route path="/room/:no" component={Room} />
                <Route path="/login" component={Login} />
                <Route component={NotFound} />
            </Switch>
        );
    }
}
