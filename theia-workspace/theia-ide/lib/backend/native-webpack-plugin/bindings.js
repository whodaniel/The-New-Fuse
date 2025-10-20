module.exports = function (jsModule) {
    switch (jsModule) {
        case 'drivelist': return require('/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/node_modules/.pnpm/drivelist@12.0.2/node_modules/drivelist/build/Release/drivelist.node');
    }
    throw new Error(`unhandled module: "${jsModule}"`);
}