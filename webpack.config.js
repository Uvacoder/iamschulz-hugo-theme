const path = require('path');
const WebpackAssetsManifest = require('webpack-assets-manifest');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");

module.exports = env => {
    return {
        mode: env.mode,
        entry: {
            index: './helpers/entry/script.js',
        },
        output: {
            path: path.resolve(__dirname, 'static/bundle'),
            //filename: 'js/bundle.[chunkhash].js',
            filename: 'js/bundle.js',
            //chunkFilename: 'js/[name].[chunkhash].js',
            chunkFilename: 'js/[name].js',
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules)/,
                    use: {
                        loader: 'babel-loader',
                    },
                }, {
                    test: /\.worker\.js$/,
                    use: { loader: 'worker-loader' },
                }, {
                    test: /\.(scss|sass|css)$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        { loader: 'css-loader', options: { url: false, sourceMap: (env.mode === 'development') } },
                        {
                            loader: 'sass-loader',
                            options: { sourceMap: (env.mode === 'development') },
                        },
                    ],
                },
            ],
        },
        plugins: [
            new CleanWebpackPlugin(),
            new MiniCssExtractPlugin({
                filename: 'css/styles.css',
                chunkFilename: 'css/[name].css',
            }),
            new BundleAnalyzerPlugin({
                analyzerMode: env.stats ? 'static' : 'disabled',
                openAnalyzer: env.stats,
                reportFilename: 'report/index.html',
            }),
            new WebpackAssetsManifest({
                output: 'assetManifest.json',
            }),
            new FixStyleOnlyEntriesPlugin(),
        ],
    }
};
