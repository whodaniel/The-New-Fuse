import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from './Pagination.js';

const meta: Meta<typeof Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    count: { control: 'number' },
    page: { control: 'number' },
    siblingCount: { control: 'number' },
    boundaryCount: { control: 'number' },
    showControls: { control: 'boolean' },
    showFirstLast: { control: 'boolean' },
    variant: {
      control: { type: 'select' },
      options: ['default', 'outline', 'ghost'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    
    return (
      <Pagination
        count={10}
        page={page}
        onPageChange={setPage}
      />
    );
  },
};

export const WithFirstLast: Story = {
  render: () => {
    const [page, setPage] = useState(5);
    
    return (
      <Pagination
        count={10}
        page={page}
        onPageChange={setPage}
        showFirstLast
      />
    );
  },
};

export const CustomSiblingAndBoundary: Story = {
  render: () => {
    const [page, setPage] = useState(5);
    
    return (
      <Pagination
        count={20}
        page={page}
        onPageChange={setPage}
        siblingCount={2}
        boundaryCount={2}
      />
    );
  },
};

export const Variants: Story = {
  render: () => {
    const [page1, setPage1] = useState(5);
    const [page2, setPage2] = useState(5);
    const [page3, setPage3] = useState(5);
    
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="mb-2 text-sm font-medium">Default</h3>
          <Pagination
            count={10}
            page={page1}
            onPageChange={setPage1}
            variant="default"
          />
        </div>
        
        <div>
          <h3 className="mb-2 text-sm font-medium">Outline</h3>
          <Pagination
            count={10}
            page={page2}
            onPageChange={setPage2}
            variant="outline"
          />
        </div>
        
        <div>
          <h3 className="mb-2 text-sm font-medium">Ghost</h3>
          <Pagination
            count={10}
            page={page3}
            onPageChange={setPage3}
            variant="ghost"
          />
        </div>
      </div>
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const [page1, setPage1] = useState(5);
    const [page2, setPage2] = useState(5);
    const [page3, setPage3] = useState(5);
    
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="mb-2 text-sm font-medium">Small</h3>
          <Pagination
            count={10}
            page={page1}
            onPageChange={setPage1}
            size="sm"
          />
        </div>
        
        <div>
          <h3 className="mb-2 text-sm font-medium">Default</h3>
          <Pagination
            count={10}
            page={page2}
            onPageChange={setPage2}
            size="default"
          />
        </div>
        
        <div>
          <h3 className="mb-2 text-sm font-medium">Large</h3>
          <Pagination
            count={10}
            page={page3}
            onPageChange={setPage3}
            size="lg"
          />
        </div>
      </div>
    );
  },
};

export const LargeNumberOfPages: Story = {
  render: () => {
    const [page, setPage] = useState(50);
    
    return (
      <Pagination
        count={100}
        page={page}
        onPageChange={setPage}
        showFirstLast
      />
    );
  },
};

export const WithoutControls: Story = {
  render: () => {
    const [page, setPage] = useState(5);
    
    return (
      <Pagination
        count={10}
        page={page}
        onPageChange={setPage}
        showControls={false}
      />
    );
  },
};

export const ControlledPagination: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const totalItems = 100;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div>
            <label htmlFor="itemsPerPage" className="mr-2 text-sm font-medium">
              Items per page:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                const newItemsPerPage = Number(e.target.value);
                setItemsPerPage(newItemsPerPage);
                setPage(1); // Reset to first page when changing items per page
              }}
              className="rounded-md border p-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <div className="text-sm">
            Showing {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, totalItems)} of {totalItems} items
          </div>
        </div>
        
        <Pagination
          count={totalPages}
          page={page}
          onPageChange={setPage}
          showFirstLast
        />
      </div>
    );
  },
};
