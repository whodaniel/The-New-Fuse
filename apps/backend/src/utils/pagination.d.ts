export declare const paginate: (totalItems: number, currentPage: number, perPage: number) => {
    currentPage: number;
    perPage: number;
    totalPages: number;
    hasMore: boolean;
};
