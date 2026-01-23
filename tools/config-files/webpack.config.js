/**
 * This file can be edited to customize webpack configuration.
 * To reset delete this file and rerun ide build again.
 */
// @ts-check
const configs = require('./gen-webpack.config.js');
const nodeConfig = require('./gen-webpack.node.config.js');

/**
 * Expose bundled modules on window.ide.moduleName namespace, e.g.
 * window['ide']['@ide/core/lib/common/uri'].
 * Such syntax can be used by external code, for instance, for testing.
configs[0].module.rules.push({
    test: /\.js$/,
    loader: require.resolve('@ide/application-manager/lib/expose-loader')
}); */

module.exports = [
    ...configs,
    nodeConfig.config
];
