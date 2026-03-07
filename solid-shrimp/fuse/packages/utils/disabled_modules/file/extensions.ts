
var __importDefault = (this && this.__importDefault) || function (mod): any {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
export {}
exports.getExtensionPaths = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getExtensionPaths(extensionNames): any {
    const extensionsDir = path_1.default.join(__dirname, "..", "..", "extensions");
    if (!fs_1.default.existsSync(extensionsDir)) {
        console.warn("Extensions directory does not exist");
        return [];
    }
    const allExtensions = fs_1.default.readdirSync(extensionsDir);
    return extensionNames
        .filter((name) => allExtensions.includes(name))
        .map((dir) => path_1.default.join(extensionsDir, dir))
        .filter((fullPath) => {
        if (fs_1.default.existsSync(fullPath)) {
            return true;
        }
        else {
            console.warn(`Extension directory ${fullPath} does not exist`);
            return false;
        }
    });
}
exports.getExtensionPaths = getExtensionPaths;
//# sourceMappingURL=extensions.js.mapexport {};
