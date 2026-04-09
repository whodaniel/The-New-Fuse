export interface InventoryBrand {
  id: string;
  name: string;
  slug: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  slug: string;
}

export interface InventoryVendor {
  id: string;
  name: string;
  slug: string;
}

export interface InventoryPagination {
  length: number;
  size: number;
  page: number;
  lastPage: number;
  startIndex: number;
  endIndex: number;
}

export interface InventoryTag {
  id: string;
  title: string;
  slug: string;
}