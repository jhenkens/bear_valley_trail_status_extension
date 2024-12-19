'use strict';

const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const PATHS = require('./paths');

// used in the module rules and in the stats exlude list
const IMAGE_TYPES = /\.(png|jpe?g|gif|svg)$/i;

// To re-use webpack configuration across templates,
// CLI maintains a common webpack configuration file - `webpack.common.js`.
// Whenever user creates an extension, CLI adds `webpack.common.js` file
// in template's `config` folder
const common = {
    output: {
        // the build folder to output bundles and assets in.
        path: PATHS.build,
        // the filename template for entry chunks
        filename: '[name].js',
    },
    stats: {
        all: false,
        errors: true,
        builtAt: true,
        assets: true,
        excludeAssets: [IMAGE_TYPES],
    },
    module: {
        rules: [
            // Check for TypeScript files
            {
                test: /\.ts$/,
                use: ['ts-loader'],
            },
            // Help webpack in understanding CSS files imported in .js files
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.(scss)$/,
                use: [
                    {
                        loader: 'style-loader', // inject CSS to page
                    },
                    {
                        loader: 'css-loader', // translates CSS into CommonJS modules
                    },
                    {
                        loader: 'postcss-loader', // Run post css actions
                        options: {
                            postcssOptions: {
                                plugins: function () {
                                    // post css plugins, can be exported to postcss.config.js
                                    return [
                                        require('precss'),
                                        require('autoprefixer'),
                                    ];
                                },
                            },
                        },
                    },
                    {
                        loader: 'sass-loader', // compiles Sass to CSS
                    },
                ],
            },
            {
                test: /\.woff2?$/,
                type: 'asset/resource',
            },
            // Check for images imported in .js files and
            {
                test: IMAGE_TYPES,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: 'images',
                            name: '[name].[ext]',
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        // Help webpack resolve these extensions in order
        extensions: ['.ts', '.js'],
    },
    plugins: [
        // Copy static assets from `public` folder to `build` folder
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: '**/*',
                    context: 'public',
                },
            ],
        }),
        // Extract CSS into separate files
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
    ],
};

module.exports = common;
