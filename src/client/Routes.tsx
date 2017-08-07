import * as React from "react";
import { Switch } from "react-router";
import { Link, Route } from "react-router-dom";
import App from "./App";
import Home from "./Home";
import GameContainer from "./GameContainer";
import Login from "./login/Container";

import NotFound from "./NotFound";

export class Routes extends React.Component<{}, {}> {
    render() {
        return (
            <App>
                <Switch>
                    <Route exact path="/" component={Home} />
                    <Route path="/game" component={GameContainer} />
                    <Route path="/login" component={Login} />
                    <Route component={NotFound} />
                </Switch>
            </App>
        );
    }
}
