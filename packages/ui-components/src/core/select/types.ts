import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  isDisabled?: boolean;
}

export interface SelectProps {
  className?: string;
  placeholder?: string;
  options?: SelectOption[];
  value?: SelectOption | SelectOption[] | null;
  onChange?: (value: SelectOption | SelectOption[] | null) => void;
  isMulti?: boolean;
  isSearchable?: boolean;
  isClearable?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  menuIsOpen?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}