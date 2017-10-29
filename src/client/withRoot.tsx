import * as React from "react";
import JssProvider from "react-jss/lib/JssProvider";
import { withStyles, MuiThemeProvider, Theme } from "material-ui/styles";
import * as recompose from "recompose";
import createContext from "./createContext";

// Apply some reset
const styles = (theme: Theme) => ({
    "@global": {
        html: {
            background: theme.palette.background.default,
            WebkitFontSmoothing: "antialiased", // Antialiasing.
            MozOsxFontSmoothing: "grayscale", // Antialiasing.
        },
        body: {
            margin: 0,
        },
    },
});

const context = createContext();

function withRoot(BaseComponent: any) {
    class WithRoot extends React.Component<any, any> {
        public componentDidMount() {
            // Remove the server-side injected CSS.
            const jssStyles = document.querySelector("#jss-server-side");
            if (jssStyles && jssStyles.parentNode) {
                jssStyles.parentNode.removeChild(jssStyles);
            }
        }

        public render() {
            return (
                <JssProvider registry={context.sheetsRegistry} jss={context.jss}>
                    <MuiThemeProvider theme={context.theme} sheetsManager={context.sheetsManager}>
                        <BaseComponent />
                    </MuiThemeProvider>
                </JssProvider>
            );
        }
    }

    if (process.env.NODE_ENV !== "production") {
        (WithRoot as any).displayName = recompose.wrapDisplayName(BaseComponent, "withRoot");
    }

    return WithRoot;
}

export default withRoot;
