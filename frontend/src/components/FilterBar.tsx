import React, { useState, useEffect } from 'react';

interface FilterBarProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  totalItems: number;
  onAddClick?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  sortBy, 
  onSortChange, 
  status, 
  onStatusChange, 
  category,
  onCategoryChange,
  onSearchChange,
  totalItems, 
  onAddClick 
}) => {
  const [searchInput, setSearchInput] = useState('');

  // Debounce search input by 300ms
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, onSearchChange]);

  return (
    <div className="bg-gray-800 text-white p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      
      {/* Search Input & Total Item Count */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        <h2 className="text-lg font-bold hidden sm:block whitespace-nowrap">
          {totalItems} Suggestions
        </h2>
        <input
          type="text"
          placeholder="🔍 Search feedback..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full md:w-56 rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Dropdown Filters & Add Action */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
        
        {/* Category Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-300">Category:</span>
          <select 
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="rounded-lg border border-gray-600 bg-gray-700 px-2.5 py-1.5 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Categories</option>
            <option value="1">UI/UX</option>
            <option value="2">Performance</option>
            <option value="3">Security</option>
            <option value="4">Mobile</option>
            <option value="5">Integrations</option>
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-300">Status:</span>
          <select 
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-lg border border-gray-600 bg-gray-700 px-2.5 py-1.5 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All</option>
            <option value="Under Review">Under Review</option>
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-300">Sort by:</span>
          <select 
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-lg border border-gray-600 bg-gray-700 px-2.5 py-1.5 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="most_voted">Top Voted</option>
            <option value="newest">Newest</option>
            <option value="recently_updated">Recently Updated</option>
            <option value="least_voted">Least Voted</option>
          </select>
        </div>

        {/* Add Feedback Button */}
        <button 
          onClick={onAddClick}
          className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 shadow-sm whitespace-nowrap ml-1"
        >
          + Add Feedback
        </button>
      </div>
    </div>
  );
};