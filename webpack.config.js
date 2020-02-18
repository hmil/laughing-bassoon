const path = require('path')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const webpack = require('webpack');

module.exports = {
    entry: {
        app: './src/modules/main.ts',
    },
    // mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.worker\.[tj]s$/,
                use: {
                    loader: 'worker-loader',
                    options: { publicPath: '/dist/' }
                },
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        plugins: [
            new TsconfigPathsPlugin()
        ]
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },
    externals: {

        'esprima': 'esprima', // https://github.com/nodeca/js-yaml/issues/230
    },
    devServer: {
        publicPath: '/dist/',
        port: 8080
    }
}