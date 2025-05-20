import React from 'react';
import Select, { components, GroupBase, OptionProps } from 'react-select'; // Import OptionProps
import { cn } from '../../lib/utils.js'; // Added .js
import { SelectProps, SelectOption } from './types.js'; // Assuming types.ts exports SelectOption

export const CustomOption = (props: OptionProps<SelectOption, boolean, GroupBase<SelectOption>>) => { // Use OptionProps and SelectOption
  const { isSelected, label, innerProps, innerRef } = props;
  return (
    <div
      ref={innerRef}
      {...innerProps}
      className={cn(
        'px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground',
        isSelected ? 'bg-primary text-primary-foreground' : ''
      )}
    >
      {label}
    </div>
  );
};


const ConsolidatedSelect: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  isMulti = false,
  isDisabled = false,
  isLoading = false,
  isClearable = false,
  className,
  menuIsOpen, // Added menuIsOpen prop
  onMenuOpen, // Added onMenuOpen prop
  onMenuClose, // Added onMenuClose prop
}) => {
  return (
    <Select<SelectOption, boolean, GroupBase<SelectOption>> // Specify type arguments for Select
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isMulti={isMulti}
      isDisabled={isDisabled}
      isLoading={isLoading}
      isClearable={isClearable}
      className={cn('w-full', className)}
      classNamePrefix="react-select"
      menuIsOpen={menuIsOpen} // Pass down menuIsOpen
      onMenuOpen={onMenuOpen} // Pass down onMenuOpen
      onMenuClose={onMenuClose} // Pass down onMenuClose
      components={{ Option: CustomOption }} // Use custom Option component
      styles={{
        control: (provided) => ({
          ...provided,
          borderColor: 'gray',
          '&:hover': {
            borderColor: 'blue',
          },
        }),
        menu: (provided) => ({
          ...provided,
          zIndex: 9999,
        }),
      }}
      // Map options explicitly if needed, though react-select handles it internally
      // options={options.map((option: SelectOption) => ({ // Add type SelectOption here if mapping manually
      //   value: option.value,
      //   label: option.label,
      // }))}
    />
  );
};

export default ConsolidatedSelect;