import type { Meta, StoryObj } from '@storybook/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from './Breadcrumb.js';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg'],
    },
    separator: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/products">Products</BreadcrumbItem>
        <BreadcrumbItem isCurrent>Product Name</BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

export const CustomSeparator: Story = {
  args: {
    separator: '>',
  },
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/products">Products</BreadcrumbItem>
        <BreadcrumbItem isCurrent>Product Name</BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

export const IconSeparator: Story = {
  args: {
    separator: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    ),
  },
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/products">Products</BreadcrumbItem>
        <BreadcrumbItem href="/products/categories">Categories</BreadcrumbItem>
        <BreadcrumbItem isCurrent>Product Name</BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-sm font-medium">Small</h3>
        <Breadcrumb size="sm">
          <BreadcrumbList>
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href="/products">Products</BreadcrumbItem>
            <BreadcrumbItem isCurrent>Product Name</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div>
        <h3 className="mb-2 text-sm font-medium">Default</h3>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href="/products">Products</BreadcrumbItem>
            <BreadcrumbItem isCurrent>Product Name</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div>
        <h3 className="mb-2 text-sm font-medium">Large</h3>
        <Breadcrumb size="lg">
          <BreadcrumbList>
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href="/products">Products</BreadcrumbItem>
            <BreadcrumbItem isCurrent>Product Name</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem href="/">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1 h-4 w-4"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Home
        </BreadcrumbItem>
        <BreadcrumbItem href="/products">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1 h-4 w-4"
          >
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          Products
        </BreadcrumbItem>
        <BreadcrumbItem isCurrent>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1 h-4 w-4"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          Product Name
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-sm font-medium">Default</h3>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem href="/" variant="default">Home</BreadcrumbItem>
            <BreadcrumbItem href="/products" variant="default">Products</BreadcrumbItem>
            <BreadcrumbItem isCurrent>Product Name</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div>
        <h3 className="mb-2 text-sm font-medium">Ghost</h3>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem href="/" variant="ghost">Home</BreadcrumbItem>
            <BreadcrumbItem href="/products" variant="ghost">Products</BreadcrumbItem>
            <BreadcrumbItem isCurrent>Product Name</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div>
        <h3 className="mb-2 text-sm font-medium">Link</h3>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem href="/" variant="link">Home</BreadcrumbItem>
            <BreadcrumbItem href="/products" variant="link">Products</BreadcrumbItem>
            <BreadcrumbItem isCurrent>Product Name</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  ),
};

export const Collapsed: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/products">Products</BreadcrumbItem>
        <BreadcrumbItem href="/products/categories">Categories</BreadcrumbItem>
        <BreadcrumbItem href="/products/categories/electronics">Electronics</BreadcrumbItem>
        <BreadcrumbItem href="/products/categories/electronics/computers">Computers</BreadcrumbItem>
        <BreadcrumbItem href="/products/categories/electronics/computers/laptops">Laptops</BreadcrumbItem>
        <BreadcrumbItem isCurrent>Product Name</BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};
