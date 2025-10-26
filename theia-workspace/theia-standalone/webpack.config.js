/**
 * This file can be edited to customize webpack configuration.
 * To reset delete this file and rerun theia build again.
 */
// @ts-check
const path = require('path');
const webpack = require('webpack');
const configs = require('./gen-webpack.config.js');
const nodeConfig = require('./gen-webpack.node.config.js');

/**
 * Expose bundled modules on window.theia.moduleName namespace, e.g.
 * window['theia']['@theia/core/lib/common/uri'].
 * Such syntax can be used by external code, for instance, for testing.
configs[0].module.rules.push({
    test: /\.js$/,
    loader: require.resolve('@theia/application-manager/lib/expose-loader')
}); */

// Fix duplicate @injectable decorator issue by ensuring single inversify instance
// Apply to all webpack configs (main bundle, secondary window, etc.)
const inversifyPath = path.resolve(__dirname, 'node_modules/@theia/core/shared/inversify');
const theiaInversifyPath = path.resolve(__dirname, 'node_modules/@theia/core/shared/inversify');

for (const config of configs) {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['inversify'] = inversifyPath;
    config.resolve.alias['@theia/core/shared/inversify'] = theiaInversifyPath;

    // Ensure single instance via optimization
    config.optimization = config.optimization || {};
    config.optimization.runtimeChunk = 'single';
    config.optimization.splitChunks = config.optimization.splitChunks || {};
    config.optimization.splitChunks.cacheGroups = config.optimization.splitChunks.cacheGroups || {};
    config.optimization.splitChunks.cacheGroups.inversify = {
        test: /[\\/]node_modules[\\/]inversify[\\/]/,
        name: 'inversify',
        chunks: 'all',
        priority: 20,
        enforce: true
    };

    // Add plugins to handle missing native modules
    config.plugins = config.plugins || [];
    config.plugins.push(
        new webpack.IgnorePlugin({
            checkResource(resource) {
                const optionalModules = [
                    'cpu-features',
                    'keytar',
                    '@vscode/windows-ca-certs',
                    '@vscode/windows-registry'
                ];
                return optionalModules.some(mod => resource.includes(mod));
            }
        })
    );
}

// Configure the node config to handle missing native modules
if (nodeConfig.config) {
    nodeConfig.config.plugins = nodeConfig.config.plugins || [];
    nodeConfig.config.plugins.push(
        new webpack.IgnorePlugin({
            checkResource(resource) {
                const optionalModules = [
                    'cpu-features',
                    'keytar',
                    '@vscode/windows-ca-certs',
                    '@vscode/windows-registry'
                ];
                return optionalModules.some(mod => resource.includes(mod));
            }
        })
    );

    // Mark native modules as external
    nodeConfig.config.externals = nodeConfig.config.externals || {};
    Object.assign(nodeConfig.config.externals, {
        'node-pty': 'commonjs node-pty',
        'cpu-features': 'commonjs cpu-features',
        'keytar': 'commonjs keytar',
        'find-git-repositories': 'commonjs find-git-repositories',
        '@vscode/ripgrep': 'commonjs @vscode/ripgrep'
    });
}

module.exports = [
    ...configs,
    nodeConfig.config
];
