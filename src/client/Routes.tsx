import * as React from "react";
import { Switch } from "react-router";
import { Link, Route } from "react-router-dom";
import Robby from "./robby/Container";

import NotFound from "./NotFound";

export class Routes extends React.Component<{}, {}> {
    render() {
        return (
            <div>
                <h1>Tab</h1>
                <li><Link to="/robby" >Robby</Link></li>
                <li><Link to="/room" >Room</Link></li>
                <Switch>
                    <Route exact path="/robby" component={Robby} />
                    <Route component={NotFound} />
                </Switch>
            </div>
        );
    }
}
