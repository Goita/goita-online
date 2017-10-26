import * as React from "react";
import * as ReactDOM from "react-dom";
import store from "./store";
import { Provider } from "react-redux";
import { AppContainer } from "react-hot-loader";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

const render = (Component: any) => {
    ReactDOM.render(
        <Provider store={store}>
            <AppContainer>
                <BrowserRouter>
                    <Component />
                </BrowserRouter>
            </AppContainer>
        </Provider>,
        document.getElementById("react"),
    );
};

render(App);

// Hot Module Replacement API
if (module.hot) {
    module.hot.accept("./App", () => {
        render(require<{ default: typeof App }>("./App").default);
    });
}
