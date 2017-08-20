import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router } from "react-router";
import store from "./store";
import { Provider } from "react-redux";
import createBrowserHistory from "history/createBrowserHistory";
import { Routes } from "./Routes";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import lightBaseTheme from "material-ui/styles/baseThemes/lightBaseTheme";
import getMuiTheme from "material-ui/styles/getMuiTheme";
const lightMuiTheme = getMuiTheme(lightBaseTheme);

const history = createBrowserHistory();

ReactDOM.render(
    <Provider store={store}>
        <Router history={history}>
            <MuiThemeProvider muiTheme={lightMuiTheme}>
                <Routes />
            </MuiThemeProvider>
        </Router>
    </Provider>
    , document.getElementById("react"),
);
