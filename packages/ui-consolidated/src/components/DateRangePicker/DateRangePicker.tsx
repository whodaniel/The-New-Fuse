import React, { forwardRef, useState } from 'react';

export interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onRangeChange?: (start: Date, end: Date) => void;
  className?: string;
}

export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  ({ startDate, endDate, onRangeChange, className = '', ...props }, ref) => {
    const [start, setStart] = useState<Date | undefined>(startDate);
    const [end, setEnd] = useState<Date | undefined>(endDate);
    
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = e.target.value ? new Date(e.target.value) : undefined;
      setStart(date);
      if (date && end && onRangeChange) {
        onRangeChange(date, end);
      }
    };
    
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = e.target.value ? new Date(e.target.value) : undefined;
      setEnd(date);
      if (start && date && onRangeChange) {
        onRangeChange(start, date);
      }
    };
    
    const formatDate = (date?: Date) => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return (
      <div 
        className={`flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4 ${className}`}
        ref={ref}
        {...props}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={formatDate(start)}
            onChange={handleStartDateChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={formatDate(end)}
            onChange={handleEndDateChange}
            min={formatDate(start)}
          />
        </div>
      </div>
    );
  }
);

DateRangePicker.displayName = 'DateRangePicker';