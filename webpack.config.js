const path = require('path')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

module.exports = {
    entry: './src/modules/main.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'app.bundle.js'
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
        plugins: [new TsconfigPathsPlugin()]
    },
    externals: {
        'react': 'React',
        'react-dom': 'ReactDOM'
    },
    devServer: {
        publicPath: '/dist/',
        port: 8080
    }
}