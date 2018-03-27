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
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
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
        ],
    },
    externals: {
        "pixi.js": "PIXI",
        react: "React",
        "react-dom": "ReactDOM",
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: "src/public",
                ignore: "index.html",
            },
            {
                from: "src/public.prod/index.html",
            },
            {
                from: "node_modules/pixi.js/dist/pixi.min.js",
                flatten: true,
            },
            {
                from: "node_modules/react{,-dom}/cjs/react{,-dom}.production.min.js",
                flatten: true,
            },
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
