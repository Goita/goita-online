import * as React from "react";
import * as ReactDOM from "react-dom";

import SvgIcon from "material-ui/SvgIcon";
declare global {
    namespace NodeJS {
        interface Global {
            __MUI_SvgIcon__: any;
        }
    }
}
// Tells `material-ui-icons` to use `masterial-ui-next/SvgIcon` module
// instead of `masterial-ui/SvgIcon`.
global.__MUI_SvgIcon__ = SvgIcon;

import { AppContainer } from "react-hot-loader";
import App from "./App";

const render = (Component: any) => {
    ReactDOM.render(
        <AppContainer>
            <Component />
        </AppContainer>,
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
