var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var WorkerPlugin = require('worker-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: __dirname + '/dist',
        filename: 'index_bundle.js'
    },
    plugins: [
        new HtmlWebpackPlugin(),
        new WorkerPlugin({
            // use "self" as the global object when receiving hot updates.
            globalObject: 'self' // <-- this is the default value
          })
    ],
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000
    },
};