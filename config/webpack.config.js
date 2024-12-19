'use strict';

const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');
const PATHS = require('./paths');

// Merge webpack configuration files
const config = (env, argv) =>
    merge(common, {
        entry: {
            //   popup: PATHS.src + '/popup.ts',
            contentScript: PATHS.src + '/contentScript.ts',
            background: PATHS.src + '/background.ts',
            inject: PATHS.src + '/inject.ts',
            injected: PATHS.src + '/injected.ts',
            sidepanel: PATHS.src + '/sidepanel.ts',
        },
        devtool: argv.mode === 'production' ? false : 'source-map',
    });

module.exports = config;
