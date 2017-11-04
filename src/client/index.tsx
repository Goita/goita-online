import * as React from "react";
import * as ReactDOM from "react-dom";
import { AppContainer as ReactHotLoaderContainer } from "react-hot-loader";
import App from "./App";

const render = (Component: any) => {
    ReactDOM.render(
        <ReactHotLoaderContainer>
            <Component />
        </ReactHotLoaderContainer>,
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
