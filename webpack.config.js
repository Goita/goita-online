var CopyWebpackPlugin = require('copy-webpack-plugin');
var webpack = require("webpack");
var path = require('path');

module.exports = {
    devServer: {
        outputPath: path.join(__dirname, 'dist/public'),
        port: 8080,
        colors: false
    },
    devtool: "source-map",
    entry: {
        app: ['./src/public/main.ts']
    },
    module: {
        rules: [{
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    configFileName: 'tsconfig.webpack.json'
                },
            },
            {
                enforce: 'pre',
                test: /\.ts$/,
                loader: 'tslint-loader'
            },
            {
                enforce: 'pre',
                test: /\.(js|tsx?)$/,
                loader: "source-map-loader"
            }
        ],
    },
    output: {
        path: path.resolve(__dirname, 'dist/public'),
        filename: 'bundle.js'
    },
    externals: {
        "pixi.js": "PIXI"
    },
    plugins: [
        new CopyWebpackPlugin([{
            from: 'src/public',
            ignore: ["*.ts", "*.scss"]
        }]),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        })
    ],
    resolve: {
        extensions: ['.ts', ".js"]
    }
}
