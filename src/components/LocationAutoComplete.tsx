import React, { useState, useEffect, useRef } from "react";
import { IonItem, IonLabel, IonInput, IonList, IonIcon } from "@ionic/react";
import { locationOutline, checkmarkOutline } from "ionicons/icons";
import "./LocationAutoComplete.css";

interface LocationSuggestion {
  name: string;
  country: string;
  id: string;
}

interface LocationAutoCompleteProps {
  value: string;
  onLocationChange: (location: string) => void;
  className?: string;
  placeholder?: string;
}

// Comprehensive list of locations including Zimbabwe cities and major world cities
const LOCATIONS: LocationSuggestion[] = [
  // Zimbabwe cities
  { id: "harare-zw", name: "Harare", country: "Zimbabwe" },
  { id: "bulawayo-zw", name: "Bulawayo", country: "Zimbabwe" },
  { id: "chitungwiza-zw", name: "Chitungwiza", country: "Zimbabwe" },
  { id: "mutare-zw", name: "Mutare", country: "Zimbabwe" },
  { id: "gweru-zw", name: "Gweru", country: "Zimbabwe" },
  { id: "kwekwe-zw", name: "Kwekwe", country: "Zimbabwe" },
  { id: "kadoma-zw", name: "Kadoma", country: "Zimbabwe" },
  { id: "masvingo-zw", name: "Masvingo", country: "Zimbabwe" },
  { id: "chinhoyi-zw", name: "Chinhoyi", country: "Zimbabwe" },
  { id: "marondera-zw", name: "Marondera", country: "Zimbabwe" },
  { id: "norton-zw", name: "Norton", country: "Zimbabwe" },
  { id: "ruwa-zw", name: "Ruwa", country: "Zimbabwe" },

  // Major African cities
  { id: "johannesburg-za", name: "Johannesburg", country: "South Africa" },
  { id: "cape-town-za", name: "Cape Town", country: "South Africa" },
  { id: "durban-za", name: "Durban", country: "South Africa" },
  { id: "nairobi-ke", name: "Nairobi", country: "Kenya" },
  { id: "lagos-ng", name: "Lagos", country: "Nigeria" },
  { id: "cairo-eg", name: "Cairo", country: "Egypt" },
  { id: "casablanca-ma", name: "Casablanca", country: "Morocco" },
  { id: "addis-ababa-et", name: "Addis Ababa", country: "Ethiopia" },
  { id: "accra-gh", name: "Accra", country: "Ghana" },
  { id: "dar-es-salaam-tz", name: "Dar es Salaam", country: "Tanzania" },

  // Major world cities
  { id: "new-york-us", name: "New York", country: "United States" },
  { id: "london-uk", name: "London", country: "United Kingdom" },
  { id: "paris-fr", name: "Paris", country: "France" },
  { id: "tokyo-jp", name: "Tokyo", country: "Japan" },
  { id: "beijing-cn", name: "Beijing", country: "China" },
  { id: "mumbai-in", name: "Mumbai", country: "India" },
  { id: "delhi-in", name: "Delhi", country: "India" },
  { id: "sao-paulo-br", name: "São Paulo", country: "Brazil" },
  { id: "mexico-city-mx", name: "Mexico City", country: "Mexico" },
  { id: "sydney-au", name: "Sydney", country: "Australia" },
  { id: "toronto-ca", name: "Toronto", country: "Canada" },
  { id: "berlin-de", name: "Berlin", country: "Germany" },
  { id: "moscow-ru", name: "Moscow", country: "Russia" },
  { id: "dubai-ae", name: "Dubai", country: "United Arab Emirates" },
  { id: "singapore-sg", name: "Singapore", country: "Singapore" },
  { id: "hong-kong-hk", name: "Hong Kong", country: "Hong Kong" },
];

const LocationAutoComplete: React.FC<LocationAutoCompleteProps> = ({
  value,
  onLocationChange,
  className = "input-item",
  placeholder = "Search for your location",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLIonListElement>(null);

  // Search function for predefined locations
  const searchLocations = (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filteredLocations = LOCATIONS.filter((location) => {
      const searchTerm = query.toLowerCase();
      return (
        location.name.toLowerCase().includes(searchTerm) ||
        location.country.toLowerCase().includes(searchTerm) ||
        `${location.name}, ${location.country}`
          .toLowerCase()
          .includes(searchTerm)
      );
    }).slice(0, 8); // Limit to 8 results

    setSuggestions(filteredLocations);
    setShowSuggestions(filteredLocations.length > 0);
    setSelectedIndex(-1);
  };

  // Handle input change with debouncing
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for search
    debounceRef.current = setTimeout(() => {
      searchLocations(newValue);
    }, 200); // 200ms debounce
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    const formattedLocation = `${suggestion.name}, ${suggestion.country}`;
    setInputValue(formattedLocation);
    onLocationChange(formattedLocation);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Handle manual input completion
  const handleInputBlur = () => {
    // Small delay to allow suggestion clicks
    setTimeout(() => {
      if (inputValue !== value) {
        onLocationChange(inputValue);
      }
      setShowSuggestions(false);
    }, 150);
  };

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Show initial suggestions when focused
  const handleInputFocus = () => {
    if (inputValue.length >= 2) {
      searchLocations(inputValue);
    }
  };

  return (
    <div className="location-autocomplete-container">
      <IonItem className={className}>
        <IonIcon icon={locationOutline} slot="start" color="medium" />
        <IonLabel position="stacked">Location</IonLabel>
        <IonInput
          value={inputValue}
          onIonInput={(e) => handleInputChange(e.detail.value!)}
          onIonBlur={handleInputBlur}
          onIonFocus={handleInputFocus}
          placeholder={placeholder}
        />
      </IonItem>

      {showSuggestions && suggestions.length > 0 && (
        <IonList ref={suggestionsRef} className="location-suggestions">
          {suggestions.map((suggestion, index) => (
            <IonItem
              key={suggestion.id}
              button
              className={`suggestion-item ${
                index === selectedIndex ? "selected" : ""
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <IonIcon icon={locationOutline} slot="start" color="medium" />
              <IonLabel>
                <p className="suggestion-text">
                  {suggestion.name}, {suggestion.country}
                </p>
              </IonLabel>
              {index === selectedIndex && (
                <IonIcon icon={checkmarkOutline} slot="end" color="primary" />
              )}
            </IonItem>
          ))}
        </IonList>
      )}
    </div>
  );
};

export default LocationAutoComplete;
