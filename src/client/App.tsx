import * as React from "react";
import withRoot from "./withRoot";
import Routes from "./Routes";
import store from "./store";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
export class App extends React.Component {
    render() {
        return (
            <Provider store={store}>
                <BrowserRouter>
                    <Routes />
                </BrowserRouter>
            </Provider>
        );
    }
}

export default withRoot(App);
