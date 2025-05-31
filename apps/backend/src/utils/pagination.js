export const paginate = (totalItems, currentPage, perPage) => {
    const totalPages = Math.ceil(totalItems / perPage);
    return {
        currentPage,
        perPage,
        totalPages,
        hasMore: currentPage < totalPages
    };
};
