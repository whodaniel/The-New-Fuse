"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = void 0;
const paginate = (totalItems, currentPage, perPage) => {
    const totalPages = Math.ceil(totalItems / perPage);
    return {
        currentPage,
        perPage,
        totalPages,
        hasMore: currentPage < totalPages
    };
};
exports.paginate = paginate;
