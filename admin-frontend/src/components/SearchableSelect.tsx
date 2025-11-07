import React, { useState, useEffect, useRef } from 'react';

interface Option {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (searchTerm: string) => Promise<Option[]>;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  className?: string;
  noOptionsMessage?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Select an option...",
  disabled = false,
  error = false,
  required = false,
  className = "",
  noOptionsMessage = "No options found"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial options when component mounts
  useEffect(() => {
    loadOptions('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Find selected option when value changes
  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find(opt => opt.value === value);
      setSelectedOption(option || null);
    } else {
      setSelectedOption(null);
    }
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadOptions = async (search: string) => {
    try {
      setLoading(true);
      const results = await onSearch(search);
      setOptions(results);
    } catch (error) {
      console.error('Error loading options:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    loadOptions(term);
  };

  const handleOptionSelect = (option: Option) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (!options.length) {
      loadOptions('');
    }
  };

  const handleClear = () => {
    setSelectedOption(null);
    onChange('');
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const displayValue = isOpen ? searchTerm : (selectedOption?.label || '');

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          autoComplete="off"
        />
        
        {/* Clear button */}
        {selectedOption && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <i className="ri-close-line"></i>
          </button>
        )}
        
        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <i className={`ri-arrow-${isOpen ? 'up' : 'down'}-s-line`}></i>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2 text-center text-gray-500">
              {noOptionsMessage}
            </div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionSelect(option)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  option.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                {option.subtitle && (
                  <div className="text-sm text-gray-500">{option.subtitle}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
