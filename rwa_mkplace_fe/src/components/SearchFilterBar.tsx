import { useState } from 'react';
import { HiSearch, HiFilter, HiX, HiChevronDown } from 'react-icons/hi';

interface SearchFilterBarProps {
  onSearchChange: (query: string) => void;
  onSortChange: (sort: string) => void;
  onPriceRangeChange: (min: number, max: number) => void;
  searchQuery: string;
  sortBy: string;
}

export const SearchFilterBar = ({
  onSearchChange,
  onSortChange,
  onPriceRangeChange,
  searchQuery,
  sortBy
}: SearchFilterBarProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'trending', label: 'Trending' },
    { value: 'popular', label: 'Most Popular' }
  ];

  const handlePriceRangeSubmit = () => {
    onPriceRangeChange(priceRange.min, priceRange.max);
    setShowFilters(false);
  };

  return (
    <div className="bg-base-200/50 backdrop-blur-sm border border-base-200/50 rounded-xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="relative">
            <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral w-5 h-5" />
            <input
              type="text"
              placeholder="Search assets by name, category, or description..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input input-bordered w-full pl-12 pr-4 bg-base-100/50 border-base-200/50 focus:border-primary text-base-content placeholder-neutral/60"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral hover:text-base-content"
              >
                <HiX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-outline gap-2 min-w-[180px]">
            <HiChevronDown className="w-4 h-4" />
            {sortOptions.find(option => option.value === sortBy)?.label || 'Sort By'}
          </label>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 border border-base-200/50 rounded-box w-52 mt-2">
            {sortOptions.map((option) => (
              <li key={option.value}>
                <button
                  onClick={() => onSortChange(option.value)}
                  className={`${sortBy === option.value ? 'bg-primary/10 text-primary' : ''}`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn gap-2 ${showFilters ? 'btn-primary' : 'btn-outline'}`}
        >
          <HiFilter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-6 pt-6 border-t border-base-200/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Price Range */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Price Range (XRP)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                  className="input input-bordered input-sm flex-1 bg-base-100/50"
                />
                <span className="self-center text-neutral">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                  className="input input-bordered input-sm flex-1 bg-base-100/50"
                />
              </div>
            </div>

            {/* Asset Type */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Asset Type</span>
              </label>
              <select className="select select-bordered select-sm w-full bg-base-100/50">
                <option value="">All Types</option>
                <option value="collectibles">Collectibles</option>
                <option value="real-estate">Real Estate</option>
                <option value="commodities">Commodities</option>
                <option value="art">Art & Culture</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Status</span>
              </label>
              <div className="flex gap-2">
                <label className="label cursor-pointer gap-2">
                  <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" />
                  <span className="label-text text-sm">Trending</span>
                </label>
                <label className="label cursor-pointer gap-2">
                  <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" />
                  <span className="label-text text-sm">New</span>
                </label>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handlePriceRangeSubmit}
              className="btn btn-primary btn-sm"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setPriceRange({ min: 0, max: 100000 });
                onPriceRangeChange(0, 100000);
                setShowFilters(false);
              }}
              className="btn btn-outline btn-sm"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};