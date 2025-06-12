import React from 'react';
import { Link } from 'react-router-dom';

const DropdownMenuItem = React.memo(({ to, label, isExternal, onClick }) => {
  const commonClasses = "block px-4 py-2 hover:bg-gray-100 text-black";
  if (isExternal) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={commonClasses} onClick={onClick}>
        {label}
      </a>
    );
  }
  return (
    <Link to={to} className={commonClasses} onClick={onClick}>
      {label}
    </Link>
  );
});

export const DropdownMenu = React.memo(({ title, buttonBgClass, items, isOpen, onToggle, closeDropdown }) => {
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeDropdown();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        className={`hover:text-blue-200 px-3 py-2 rounded transition-colors flex items-center ${buttonBgClass}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {title} <span className="ml-1">▼</span>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg z-50 min-w-48" role="menu">
          {items.map((item) => (
            <DropdownMenuItem
              key={item.to || item.label}
              to={item.to}
              label={item.label}
              isExternal={item.isExternal}
              onClick={closeDropdown}
            />
          ))}
        </div>
      )}
    </div>
  );
});