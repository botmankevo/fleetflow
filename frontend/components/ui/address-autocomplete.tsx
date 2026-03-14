"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Building2 } from "lucide-react";

interface AddressSuggestion {
  description: string;
  place_id: string;
  lat?: string;
  lon?: string;
  address_details?: any;
  tags?: any;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, details?: any) => void;
  placeholder?: string;
  className?: string;
  onCityStateZip?: (city: string, state: string, zip: string) => void;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter address",
  className = "",
  onCityStateZip,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions using Mapbox Geocoding API (free tier)
  const fetchSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Using Nominatim (OpenStreetMap) as a free alternative
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          input
        )}&countrycodes=us&addressdetails=1&extratags=1&limit=5`,
        {
          headers: {
            "User-Agent": "MainTMS",
          },
        }
      );

      const data = await response.json();
      setSuggestions(
        data.map((item: any) => ({
          description: item.display_name,
          place_id: item.place_id,
          lat: item.lat,
          lon: item.lon,
          address_details: item.address,
          tags: item.extratags
        }))
      );
      setShowSuggestions(true);
    } catch (error) {
      console.error("Address autocomplete error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce address input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value && value.length >= 3) {
        fetchSuggestions(value);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = async (suggestion: any) => {
    console.log('Selection details:', suggestion);
    
    // Extract structured data
    const details = suggestion.address_details || {};
    const parts = suggestion.description.split(",").map((p: string) => p.trim());
    
    let city = details.city || details.town || details.village || details.suburb || '';
    let state = details.state || '';
    let zip = details.postcode || '';
    
    // Check for business name (amenity)
    let companyName = details.amenity || details.office || details.industrial || details.commercial || details.retail || details.warehouse || '';
    
    // Optional tags from Nominatim (extra details)
    const phone = suggestion.tags?.phone || suggestion.tags?.["contact:phone"] || suggestion.tags?.["phone:mobile"] || "";
    const website = suggestion.tags?.website || suggestion.tags?.["contact:website"] || suggestion.tags?.url || "";
    const hours = suggestion.tags?.opening_hours || suggestion.tags?.["service_times"] || "";

    // Convert state to abbreviation
    if (state) {
      const states: Record<string, string> = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
        'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
        'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
        'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
        'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
        'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
        'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
        'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
        'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
        'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
      };
      if (states[state]) state = states[state];
    }

    // Extract clean street address if possible
    const street = details.house_number && details.road 
        ? `${details.house_number} ${details.road}`
        : details.road || parts[0];

    // Set the address and notify parent of details
    // If it's a business, we pass the street address primarily, but provide the full description in details
    onChange(street || suggestion.description, { 
        title: companyName, 
        city, 
        state, 
        zip,
        phone,
        website,
        hours,
        lat: suggestion.lat,
        lon: suggestion.lon,
        full_description: suggestion.description
    });
    
    // If we picked an address but it doesn't have a company name, 
    // try to find businesses nearby to show secondary suggestions
    if (!companyName && suggestion.lat && suggestion.lon) {
      setLoading(true);
      try {
        // Search for amenities near these coordinates
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=amenity&lat=${suggestion.lat}&lon=${suggestion.lon}&addressdetails=1&extratags=1&limit=10&bounded=1&viewbox=${parseFloat(suggestion.lon)-0.001},${parseFloat(suggestion.lat)+0.001},${parseFloat(suggestion.lon)+0.001},${parseFloat(suggestion.lat)-0.001}`,
            { headers: { "User-Agent": "MainTMS" } }
        );
        const businessData = await res.json();
        
        if (businessData.length > 0) {
          setSuggestions(
            businessData.map((item: any) => ({
              description: item.display_name,
              place_id: item.place_id,
              lat: item.lat,
              lon: item.lon,
              address_details: item.address,
              tags: item.extratags
            }))
          );
          setShowSuggestions(true);
          return; // Don't close suggestions yet
        }
      } catch (err) {
        console.error("Error finding nearby businesses:", err);
      } finally {
        setLoading(false);
      }
    }

    setShowSuggestions(false);
    setSuggestions([]);

    if (onCityStateZip) {
      setTimeout(() => {
        onCityStateZip(city, state, zip);
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 3 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background ${className}`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto divide-y divide-border">
          {/* Header if showing nearby businesses */}
          {suggestions.some(s => s.address_details?.amenity || s.address_details?.office || s.address_details?.industrial) && 
           !value.includes(suggestions[0].description.split(',')[0]) && (
            <div className="px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground sticky top-0 z-10">
              Businesses at this location
            </div>
          )}
          
          {suggestions.map((suggestion, index) => {
            const isBusiness = suggestion.address_details?.amenity || suggestion.address_details?.office || 
                              suggestion.address_details?.industrial || suggestion.address_details?.commercial || 
                              suggestion.address_details?.retail || suggestion.address_details?.warehouse;
            
            return (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors ${
                  index === selectedIndex ? "bg-muted" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {isBusiness ? (
                      <Building2 className="h-4 w-4 text-primary" />
                    ) : (
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {isBusiness ? (isBusiness.charAt(0).toUpperCase() + isBusiness.slice(1)).replace(/_/g, ' ') : "Address"}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {suggestion.description}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showSuggestions && !loading && suggestions.length === 0 && value.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg px-4 py-3">
          <p className="text-sm text-muted-foreground">No addresses found</p>
        </div>
      )}
    </div>
  );
}
