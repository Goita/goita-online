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
        filename: "bundle.js"
    },
    devtool: "source-map",
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx", ".css"]
    },
    module: {
        rules: [{
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader",
                options: {
                    configFileName: "tsconfig.webpack.json"
                },
            }, {
                test: /\.css$/,
                exclude: /node_modules/,
                loader: "typed-css-modules-loader?searchDir=src",
                enforce: "pre",
            },
            {
                test: /\.css$/,
                loaders: ["style-loader", "css-loader?modules&importLoaders=1&localIdentName=[path]___[name]__[local]___[hash:base64:5],typed-css-modules-loader"]
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
    externals: {
        "pixi.js": "PIXI",
        "react": "React",
        "react-dom": "ReactDOM"
    },
    plugins: [
        new CopyWebpackPlugin([{
                from: "src/public",
                ignore: ["*.scss"]
            },
            {
                from: "node_modules/pixi.js/dist/pixi.js"
            },
            {
                from: "node_modules/react/dist/react.js"
            },
            {
                from: "node_modules/react-dom/dist/react-dom.js"
            }
        ]),
        new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            sourceMap: true,
            include: /\.min\.js$/,
        })
    ]
}
