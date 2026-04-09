export const paginate = (totalItems: number, currentPage: number, perPage: number): any => {
  const totalPages = Math.ceil(totalItems / perPage);
  return {
    currentPage,
    perPage,
    totalPages,
    hasMore: currentPage < totalPages
  };
};