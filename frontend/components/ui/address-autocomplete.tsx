"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface AddressSuggestion {
  description: string;
  place_id: string;
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
  // Note: In production, you'd use Google Places API with your API key
  const fetchSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Using Nominatim (OpenStreetMap) as a free alternative
      // In production, replace with Google Places API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          input
        )}&countrycodes=us&limit=5`,
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
      if (value) {
        fetchSuggestions(value);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = async (suggestion: AddressSuggestion) => {
    // First set the full address
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    // Extract city, state, zip from the description
    // OpenStreetMap format: "Address, City, State Zip, Country"
    const parts = suggestion.description.split(",").map((p) => p.trim());
    
    console.log('Address parts:', parts);
    
    let city = '';
    let state = '';
    let zip = '';
    
    if (parts.length >= 2) {
      // Look for state pattern (2 uppercase letters followed by optional zip)
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        // Check for "STATE ZIP" or "STATE" pattern
        const stateMatch = part.match(/\b([A-Z]{2})\s*(\d{5})?/);
        if (stateMatch) {
          state = stateMatch[1];
          zip = stateMatch[2] || '';
          // City is usually the part before state
          if (i > 0) {
            city = parts[i - 1];
          }
          break;
        }
      }
    }
    
    console.log('=== ADDRESS AUTOCOMPLETE CALLBACK ===');
    console.log('Extracted:', { city, state, zip });
    console.log('=====================================');
    
    // Always call the callback with whatever we found
    if (onCityStateZip) {
      // Use setTimeout to ensure state updates don't conflict
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
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0 ${
                index === selectedIndex ? "bg-muted" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm">{suggestion.description}</span>
              </div>
            </button>
          ))}
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
