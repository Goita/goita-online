import * as path from "path";
import * as webpack from "webpack";
import * as CopyWebpackPlugin from "copy-webpack-plugin";
import { CheckerPlugin } from "awesome-typescript-loader";
import * as WriteFilePlugin from "write-file-webpack-plugin";
// var commonsPlugin = new webpack.optimize.CommonsChunkPlugin("common.js");

const config: webpack.Configuration = {
    entry: ["react-hot-loader/patch", "webpack-hot-middleware/client", "./src/client/index.tsx"],
    output: {
        path: path.resolve(__dirname, "public"),
        filename: "bundle.js",
        publicPath: "/",
        pathinfo: true,
    },
    devtool: "source-map",
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,

                // option #1 use babel

                use: [
                    "babel-loader",
                    "awesome-typescript-loader?useBabel=true&configFileName=tsconfig.webpack.json&useCache=true",
                ],

                // option #2 ts-loader

                // loaders: ["react-hot-loader/webpack", "awesome-typescript-loader?configFileName=tsconfig.webpack.json"],
            },
            {
                enforce: "pre",
                test: /\.(ts|tsx)$/,
                loader: "tslint-loader",
                include: path.join(__dirname, "src/client"),
                exclude: path.join(__dirname, "src/server"),
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader",
            },
        ],
    },
    externals: {
        "pixi.js": "PIXI",
        // react: "React",
        // "react-dom": "ReactDOM",
    },
    plugins: [
        new CheckerPlugin(),
        new CopyWebpackPlugin(
            [
                {
                    from: "src/public",
                    to: path.resolve(__dirname, "public"),
                },
                {
                    from: "node_modules/pixi.js/dist/pixi.js",
                },
                {
                    from: "node_modules/pixi.js/dist/pixi.js.map",
                },
            ],
            { debug: "warning" },
        ),
        // NamedModulesPlugin to make it easier to see which dependencies are being patched.
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new WriteFilePlugin(),
    ],
};

export default config;
