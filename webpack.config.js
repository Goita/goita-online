var CopyWebpackPlugin = require("copy-webpack-plugin");
// var commonsPlugin = new webpack.optimize.CommonsChunkPlugin("common.js");
// var webpack = require("webpack");
var path = require("path");

module.exports = {
    entry: "./src/client/index.tsx",
    output: {
        path: path.resolve(__dirname, "dist/public"),
        filename: "bundle.js"
    },
    devtool: "source-map",
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    module: {
        rules: [{
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader",
                options: {
                    configFileName: "tsconfig.webpack.json"
                },
            },
            {
                enforce: "pre",
                test: /\.(ts|tsx)$/,
                loader: "tslint-loader"
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ],
    },
    // externals: {
    //     "pixi.js": "PIXI"
    // },
    plugins: [
        new CopyWebpackPlugin([{
            from: "src/public",
            ignore: ["*.scss"]
        }])
    ]
}
