var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');

module.exports = {
    devServer: {
        outputPath: path.join(__dirname, 'lib/public'),
        port: 8080,
        colors: false
    },
    devtool: "source-map",
    entry: {
        app: ['./src/public/app.ts']
    },
    module: {
        rules: [
            // {
            //     test: /\.json$/,
            //     include: path.join(__dirname, 'node_modules', 'pixi.js'),
            //     loader: 'json-loader',
            // },
            {
                test: /\.ts$/,
                loader: 'ts-loader'
            },
            {
                enforce: 'pre',
                test: /\.ts$/,
                loader: 'tslint-loader'
            },
            // {
            //     enforce: "post",
            //     test: /\.js$/,
            //     loader: 'transform-loader?brfs',
            //     include: path.join(__dirname, 'node_modules', 'pixi.js'),
            // },
            {
                enforce: 'pre',
                test: /\.(js|tsx?)$/,
                loader: "source-map-loader"
            }
        ],
    },
    output: {
        path: path.resolve(__dirname, 'lib/public'),
        filename: 'bundle.js'
    },
    externals: {
        "pixi.js": "PIXI"
    },
    plugins: [
        new CopyWebpackPlugin([{ from: 'src/public' }])
    ],
    resolve: {
        extensions: ['.ts', ".js"]
    }
}
