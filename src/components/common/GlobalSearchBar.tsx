'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Car, 
  Users, 
  User, 
  MapPin, 
  AlertTriangle,
  ArrowRight,
  Clock,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: 'vehicle' | 'driver' | 'passenger' | 'booking' | 'location' | 'alert';
  title: string;
  subtitle: string;
  metadata?: string;
  url: string;
  icon: React.ReactNode;
  priority: number;
}

interface GlobalSearchBarProps {
  className?: string;
  placeholder?: string;
  onResultSelect?: (result: SearchResult) => void;
}

const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  className = '',
  placeholder = 'Search vehicles, drivers, bookings...',
  onResultSelect
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search function that includes vehicle data
  const performSearch = async (searchQuery: string): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return [];

    setIsLoading(true);
    
    try {
      // Simulate API call - in real implementation, this would call multiple endpoints
      await new Promise(resolve => setTimeout(resolve, 200));

      const mockResults: SearchResult[] = [];

      // Vehicle search results
      const vehicleMatches = [
        {
          id: 'vehicle-1',
          type: 'vehicle' as const,
          title: 'XPR-001 • ABC-123',
          subtitle: '2023 Toyota Vios • Manila Region',
          metadata: 'Active • Driver: John Doe',
          url: '/vehicles?search=XPR-001',
          icon: <Car className="w-4 h-4 text-blue-600" />,
          priority: 1
        },
        {
          id: 'vehicle-2',
          type: 'vehicle' as const,
          title: 'XPR-045 • XYZ-789',
          subtitle: '2022 Honda City • Cebu Region',
          metadata: 'Maintenance • Due: Today',
          url: '/vehicles?search=XPR-045',
          icon: <Car className="w-4 h-4 text-amber-600" />,
          priority: 2
        }
      ].filter(v => 
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Driver search results
      const driverMatches = [
        {
          id: 'driver-1',
          type: 'driver' as const,
          title: 'John Doe',
          subtitle: 'Driver ID: D001 • Rating: 4.8',
          metadata: 'Active • XPR-001',
          url: '/drivers?search=John',
          icon: <User className="w-4 h-4 text-green-600" />,
          priority: 3
        }
      ].filter(d => 
        d.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Booking search results
      const bookingMatches = [
        {
          id: 'booking-1',
          type: 'booking' as const,
          title: 'BKG-12345',
          subtitle: 'Manila → Makati • ₱250',
          metadata: 'Active • 15 mins ago',
          url: '/bookings?search=BKG-12345',
          icon: <MapPin className="w-4 h-4 text-purple-600" />,
          priority: 4
        }
      ].filter(b => 
        b.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Alert search results
      const alertMatches = [
        {
          id: 'alert-1',
          type: 'alert' as const,
          title: 'Vehicle Maintenance Due',
          subtitle: 'XPR-045 requires scheduled maintenance',
          metadata: 'High Priority • 2 hours ago',
          url: '/alerts?vehicle=XPR-045',
          icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
          priority: 5
        }
      ].filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      );

      mockResults.push(...vehicleMatches, ...driverMatches, ...bookingMatches, ...alertMatches);
      
      // Sort by priority and relevance
      return mockResults.sort((a, b) => a.priority - b.priority);

    } catch (error) {
      console.error('Search error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query).then(setResults);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    setResults([]);
    onResultSelect?.(result);
    router.push(result.url);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTypeLabel = (type: string) => {
    const labels = {
      vehicle: 'Vehicle',
      driver: 'Driver', 
      passenger: 'Passenger',
      booking: 'Booking',
      location: 'Location',
      alert: 'Alert'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length === 0 && query.length >= 2 && !isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No results found for "{query}"
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleResultSelect(result)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {result.subtitle}
                    </div>
                    {result.metadata && (
                      <div className="text-xs text-gray-400 truncate mt-1">
                        {result.metadata}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </button>
          ))}

          {/* Quick Actions */}
          {query.length >= 2 && (
            <div className="border-t border-gray-200 p-2">
              <div className="text-xs text-gray-500 mb-2">Quick Actions</div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => router.push(`/vehicles?search=${encodeURIComponent(query)}`)}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                >
                  Search Vehicles
                </button>
                <button
                  onClick={() => router.push(`/drivers?search=${encodeURIComponent(query)}`)}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                >
                  Search Drivers
                </button>
                <button
                  onClick={() => router.push(`/bookings?search=${encodeURIComponent(query)}`)}
                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                >
                  Search Bookings
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;