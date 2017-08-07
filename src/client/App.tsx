import * as React from "react";
import { connect } from "react-redux";
import { Link, Route } from "react-router-dom";
interface Props {
    children: React.ReactNode;
}

class App extends React.Component<Props, {}> {
    public render() {
        return (
            <div>
                <h1>Navigation bar</h1>
                <li><Link to="/somewhere" >Somewhere</Link></li>
                <li><Link to="/game/robby" >Robby</Link></li>
                <li><Link to="/login" >Login</Link></li>
                <li><a href="/logout" >Logout</a></li>
                <hr />
                {this.props.children}
            </div>
        );
    }
}
function mapStateToProps(state: {}) {
    return {};
}

export default connect(mapStateToProps)(App);
