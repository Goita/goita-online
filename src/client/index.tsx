import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router } from "react-router";
import store from "./store";
import { Provider } from "react-redux";
import createBrowserHistory from "history/createBrowserHistory";
import { Routes } from "./Routes";

const history = createBrowserHistory();

ReactDOM.render(
    <Provider store={store}>
        <Router history={history}>
            <Routes />
        </Router>
    </Provider>
    , document.getElementById("react"),
);
