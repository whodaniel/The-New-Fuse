"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionConfigSchema = exports.VectorSearchResultSchema = exports.VectorQuerySchema = exports.VectorDocumentSchema = void 0;
// Re-export schemas from interface file for convenience
var vector_database_interface_1 = require("./interface/vector-database.interface");
Object.defineProperty(exports, "VectorDocumentSchema", { enumerable: true, get: function () { return vector_database_interface_1.VectorDocumentSchema; } });
Object.defineProperty(exports, "VectorQuerySchema", { enumerable: true, get: function () { return vector_database_interface_1.VectorQuerySchema; } });
Object.defineProperty(exports, "VectorSearchResultSchema", { enumerable: true, get: function () { return vector_database_interface_1.VectorSearchResultSchema; } });
Object.defineProperty(exports, "CollectionConfigSchema", { enumerable: true, get: function () { return vector_database_interface_1.CollectionConfigSchema; } });
//# sourceMappingURL=schemas.js.map