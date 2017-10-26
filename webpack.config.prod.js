var path = require("path");
var webpack = require("webpack");
var CopyWebpackPlugin = require("copy-webpack-plugin");
// var commonsPlugin = new webpack.optimize.CommonsChunkPlugin("common.js");

module.exports = {
    entry: {
        main: "./src/client/index.tsx",
    },
    output: {
        path: path.resolve(__dirname, "dist/public"),
        filename: "bundle.js",
    },
    devtool: "source-map",
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx", ".css"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader",
                options: {
                    configFileName: "tsconfig.webpack.json",
                },
            },
            {
                enforce: "pre",
                test: /\.(ts|tsx)$/,
                loader: "tslint-loader",
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
        // "react": "React",
        // "react-dom": "ReactDOM"
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: "src/public",
            },
            {
                from: "node_modules/pixi.js/dist/pixi.js",
            },
            // {
            //     from: "node_modules/react/cjs/react.development.js"
            // },
            // {
            //     from: "node_modules/react-dom/cjs/react-dom.development.js",
            //     to: ""
            // }
        ]),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
            },
            sourceMap: true,
            include: /\.min\.js$/,
        }),
    ],
};
