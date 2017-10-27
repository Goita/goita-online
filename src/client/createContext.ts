import { create } from "jss";
import preset from "jss-preset-default";
import { SheetsRegistry } from "react-jss/lib/jss";
import { createMuiTheme } from "material-ui-next/styles";
import { indigo, pink } from "material-ui-next/colors";
import createGenerateClassName from "material-ui-next/styles/createGenerateClassName";

const theme = createMuiTheme({
    palette: {
        primary: indigo,
        secondary: pink,
    },
});

// Configure JSS
const jss = create(preset());
jss.options.createGenerateClassName = createGenerateClassName;

export const sheetsManager = new Map();

export default function createContext() {
    return {
        jss,
        theme,
        // This is needed in order to deduplicate the injection of CSS in the page.
        sheetsManager,
        // This is needed in order to inject the critical CSS.
        sheetsRegistry: new SheetsRegistry(),
    };
}
