import React from "react";

const SearchFilter = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className="mb-4">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
      />
    </div>
  );
};

export default SearchFilter;
