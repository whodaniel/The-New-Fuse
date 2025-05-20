import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils.js';

/**
 * Pagination variants using class-variance-authority
 */
export const paginationVariants = cva(
  'flex flex-wrap items-center gap-1',
  {
    variants: {
      variant: {
        default: '',
        outline: '',
        ghost: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Pagination item variants using class-variance-authority
 */
export const paginationItemVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-transparent hover:bg-muted',
        outline: 'border border-input bg-transparent hover:bg-muted hover:text-muted-foreground',
        ghost: 'hover:bg-muted hover:text-muted-foreground',
      },
      size: {
        default: 'h-9 w-9',
        sm: 'h-7 w-7',
        lg: 'h-11 w-11',
      },
      isActive: {
        true: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'outline',
        isActive: true,
        className: 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
      },
      {
        variant: 'ghost',
        isActive: true,
        className: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
      isActive: false,
    },
  }
);

/**
 * Pagination component props
 */
export interface PaginationProps
  extends React.HTMLAttributes<HTMLElement> {
  /**
   * Total number of pages
   */
  count: number;
  /**
   * Current page
   * @default 1
   */
  page?: number;
  /**
   * Callback when page changes
   */
  onPageChange?: (page: number) => void;
  /**
   * Number of pages to show before and after the current page
   * @default 1
   */
  siblingCount?: number;
  /**
   * Number of pages to show at the beginning and end
   * @default 1
   */
  boundaryCount?: number;
  /**
   * Whether to show the previous and next buttons
   * @default true
   */
  showControls?: boolean;
  /**
   * Whether to show the first and last buttons
   * @default false
   */
  showFirstLast?: boolean;
  /**
   * Size of the pagination items
   */
  size?: 'default' | 'sm' | 'lg';
  /**
   * Variant of the pagination items
   */
  variant?: 'default' | 'ghost' | 'outline';
}

/**
 * Pagination item component props
 */
export interface PaginationItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof paginationItemVariants> {
  /**
   * Whether this is the current/active page
   * @default false
   */
  isActive?: boolean;
}

/**
 * Pagination context
 */
type PaginationContextValue = {
  count: number;
  page: number;
  onPageChange: (page: number) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
};

const PaginationContext = React.createContext<PaginationContextValue | undefined>(undefined);

const usePagination = () => {
  const context = React.useContext(PaginationContext);
  if (!context) {
    throw new Error('Pagination components must be used within a Pagination component');
  }
  return context;
};

/**
 * Generate pagination range
 */
const generatePaginationRange = (
  count: number,
  page: number,
  siblingCount: number,
  boundaryCount: number
): (number | 'ellipsis')[] => {
  const range: (number | 'ellipsis')[] = [];
  
  // Add first page(s)
  for (let i = 1; i <= Math.min(boundaryCount, count); i++) {
    range.push(i);
  }
  
  // Add ellipsis if needed
  const startEllipsis = Math.max(boundaryCount + 1, page - siblingCount);
  if (startEllipsis > boundaryCount + 1) {
    range.push('ellipsis');
  }
  
  // Add sibling pages
  const startSibling = Math.max(boundaryCount + 1, page - siblingCount);
  const endSibling = Math.min(count - boundaryCount, page + siblingCount);
  for (let i = startSibling; i <= endSibling; i++) {
    if (!range.includes(i)) {
      range.push(i);
    }
  }
  
  // Add ellipsis if needed
  const endEllipsis = Math.min(count - boundaryCount, page + siblingCount + 1);
  if (endEllipsis < count - boundaryCount + 1) {
    range.push('ellipsis');
  }
  
  // Add last page(s)
  for (let i = Math.max(count - boundaryCount + 1, endSibling + 1); i <= count; i++) {
    if (!range.includes(i)) {
      range.push(i);
    }
  }
  
  return range;
};

/**
 * Pagination component for navigating through pages
 *
 * @example
 * // Basic usage
 * <Pagination count={10} page={1} onPageChange={(page) => console.log(page)} />
 *
 * // With custom sibling and boundary count
 * <Pagination count={20} page={5} siblingCount={2} boundaryCount={2} />
 *
 * // With first and last buttons
 * <Pagination count={10} page={5} showFirstLast />
 *
 * // With different variant
 * <Pagination count={10} page={5} variant="outline" />
 *
 * // With different size
 * <Pagination count={10} page={5} size="lg" />
 */
const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({
    className,
    variant,
    count,
    page = 1,
    onPageChange,
    siblingCount = 1,
    boundaryCount = 1,
    showControls = true,
    showFirstLast = false,
    size,
    ...props
  }, ref) => {
    const handlePageChange = React.useCallback((newPage: number) => {
      if (newPage < 1 || newPage > count) return;
      onPageChange?.(newPage);
    }, [count, onPageChange]);
    
    const range = generatePaginationRange(count, page, siblingCount, boundaryCount);
    
    return (
      <PaginationContext.Provider
        value={{
          count,
          page,
          onPageChange: handlePageChange,
          variant,
          size,
        }}
      >
        <nav
          ref={ref}
          role="navigation"
          aria-label="pagination"
          className={cn(paginationVariants({ variant }), className)}
          {...props}
        >
          {showFirstLast && (
            <PaginationItem
              variant={variant}
              size={size}
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              aria-label="Go to first page"
            >
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
                <polyline points="11 17 6 12 11 7"></polyline>
                <polyline points="18 17 13 12 18 7"></polyline>
              </svg>
            </PaginationItem>
          )}
          
          {showControls && (
            <PaginationItem
              variant={variant}
              size={size}
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              aria-label="Go to previous page"
            >
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
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </PaginationItem>
          )}
          
          {range.map((item, index) => (
            <React.Fragment key={index}>
              {item === 'ellipsis' ? (
                <span className="flex h-9 w-9 items-center justify-center text-sm">...</span>
              ) : (
                <PaginationItem
                  variant={variant}
                  size={size}
                  isActive={item === page}
                  onClick={() => handlePageChange(item)}
                  aria-label={`Go to page ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                >
                  {item}
                </PaginationItem>
              )}
            </React.Fragment>
          ))}
          
          {showControls && (
            <PaginationItem
              variant={variant}
              size={size}
              onClick={() => handlePageChange(page + 1)}
              disabled={page === count}
              aria-label="Go to next page"
            >
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
            </PaginationItem>
          )}
          
          {showFirstLast && (
            <PaginationItem
              variant={variant}
              size={size}
              onClick={() => handlePageChange(count)}
              disabled={page === count}
              aria-label="Go to last page"
            >
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
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
            </PaginationItem>
          )}
        </nav>
      </PaginationContext.Provider>
    );
  }
);

Pagination.displayName = 'Pagination';

/**
 * Pagination item component for displaying a pagination item
 */
const PaginationItem = React.forwardRef<HTMLButtonElement, PaginationItemProps>(
  ({
    className,
    variant,
    size,
    isActive,
    children,
    ...props
  }, ref) => {
    const { variant: contextVariant, size: contextSize } = usePagination();
    
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          paginationItemVariants({
            variant: variant || contextVariant,
            size: size || contextSize,
            isActive,
          }),
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

PaginationItem.displayName = 'PaginationItem';

export { Pagination, PaginationItem };
