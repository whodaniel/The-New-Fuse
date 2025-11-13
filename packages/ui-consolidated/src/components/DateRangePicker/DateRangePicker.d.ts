import React from 'react';
export interface DateRangePickerProps {
    startDate?: Date;
    endDate?: Date;
    onRangeChange?: (start: Date, end: Date) => void;
    className?: string;
}
export declare const DateRangePicker: React.ForwardRefExoticComponent<DateRangePickerProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=DateRangePicker.d.ts.map