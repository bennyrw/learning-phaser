const path = require('path');

module.exports = {
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    // https://webpack.js.org/configuration/dev-server/
    devServer: {
        contentBase: path.resolve(__dirname, 'public'),
        publicPath: '/dist/',
        port: 8080,
        //open: true
    },
};