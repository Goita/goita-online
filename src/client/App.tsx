import * as React from "react";
import withRoot from "./withRoot";

export class App extends React.Component {
    render() {
        return (
            <div className="App">
                <div className="App-header">
                    <h2>Welcome to React aaabbb</h2>
                </div>
                <p className={""}>
                    To get started, edit <code>src/App.js</code> and save to reload.
                </p>
            </div>
        );
    }
}

export default withRoot(App);
