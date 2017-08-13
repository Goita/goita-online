import * as React from "react";
import { Switch } from "react-router";
import { Link, Route } from "react-router-dom";
import App from "./app/Container";
import Home from "./Home";
import GameContainer from "./GameContainer";
import Login from "./components/Login";

import NotFound from "./NotFound";

export class Routes extends React.Component<{}, {}> {
    render() {
        return (
            <Switch>
                <Route exact path="/" component={Home} />
                <Route path="/game" component={App} />
                <Route path="/login" component={Login} />
                <Route component={NotFound} />
            </Switch>
        );
    }
}
