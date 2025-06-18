import React, { useState } from "react";
import {
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
} from "@ionic/react";

interface LocationSelectorProps {
  value: string;
  onLocationChange: (location: string) => void;
  className?: string;
  placeholder?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onLocationChange,
  className = "input-item",
  placeholder = "Select your location",
}) => {
  // Common locations data
  const commonLocations = [
    // Zimbabwe
    {
      country: "Zimbabwe",
      cities: [
        "Harare",
        "Bulawayo",
        "Chitungwiza",
        "Mutare",
        "Epworth",
        "Gweru",
        "Kwekwe",
        "Kadoma",
        "Masvingo",
        "Chinhoyi",
      ],
    },
    // South Africa
    {
      country: "South Africa",
      cities: [
        "Johannesburg",
        "Cape Town",
        "Durban",
        "Pretoria",
        "Port Elizabeth",
        "Bloemfontein",
        "East London",
        "Pietermaritzburg",
        "Nelspruit",
        "Kimberley",
      ],
    },
    // Botswana
    {
      country: "Botswana",
      cities: [
        "Gaborone",
        "Francistown",
        "Molepolole",
        "Maun",
        "Mogoditshane",
        "Serowe",
        "Selibe Phikwe",
        "Kanye",
        "Mochudi",
        "Mahalapye",
      ],
    },
    // Zambia
    {
      country: "Zambia",
      cities: [
        "Lusaka",
        "Kitwe",
        "Ndola",
        "Kabwe",
        "Chingola",
        "Mufulira",
        "Luanshya",
        "Arusha",
        "Kasama",
        "Chipata",
      ],
    },
    // Other countries
    {
      country: "United States",
      cities: [
        "New York",
        "Los Angeles",
        "Chicago",
        "Houston",
        "Phoenix",
        "Philadelphia",
        "San Antonio",
        "San Diego",
        "Dallas",
        "San Jose",
      ],
    },
    {
      country: "United Kingdom",
      cities: [
        "London",
        "Birmingham",
        "Manchester",
        "Glasgow",
        "Liverpool",
        "Leeds",
        "Sheffield",
        "Edinburgh",
        "Bristol",
        "Leicester",
      ],
    },
    {
      country: "Canada",
      cities: [
        "Toronto",
        "Montreal",
        "Calgary",
        "Ottawa",
        "Edmonton",
        "Mississauga",
        "Winnipeg",
        "Vancouver",
        "Brampton",
        "Hamilton",
      ],
    },
    {
      country: "Australia",
      cities: [
        "Sydney",
        "Melbourne",
        "Brisbane",
        "Perth",
        "Adelaide",
        "Gold Coast",
        "Newcastle",
        "Canberra",
        "Sunshine Coast",
        "Wollongong",
      ],
    },
  ];

  // Flatten locations for easy searching
  const allLocations = commonLocations.flatMap((country) =>
    country.cities.map((city) => `${city}, ${country.country}`)
  );

  // Check if current location is in the predefined list
  const isLocationInList = allLocations.includes(value);
  const [isCustomLocation, setIsCustomLocation] = useState(
    !isLocationInList && !!value
  );

  return (
    <>
      <IonItem className={className}>
        <IonLabel position="stacked">Location</IonLabel>
        <IonSelect
          value={isCustomLocation ? "custom" : value}
          onIonChange={(e) => {
            const selectedValue = e.detail.value;
            if (selectedValue === "custom") {
              setIsCustomLocation(true);
              // Keep the current custom location value
            } else {
              setIsCustomLocation(false);
              onLocationChange(selectedValue);
            }
          }}
          interface="popover"
          placeholder={placeholder}
        >
          {commonLocations.map((country, countryIndex) => (
            <div key={countryIndex}>
              <IonSelectOption
                disabled
                value={`header-${country.country}`}
                style={{ fontWeight: "bold" }}
              >
                {country.country}
              </IonSelectOption>
              {country.cities.map((city, cityIndex) => (
                <IonSelectOption
                  key={`${countryIndex}-${cityIndex}`}
                  value={`${city}, ${country.country}`}
                >
                  &nbsp;&nbsp;{city}
                </IonSelectOption>
              ))}
            </div>
          ))}
          <IonSelectOption value="custom">
            {isCustomLocation ? `✏️ Other: ${value}` : "✏️ Other (Custom)"}
          </IonSelectOption>
        </IonSelect>
      </IonItem>

      {isCustomLocation && (
        <IonItem className={`${className} custom-location-input`}>
          <IonLabel position="stacked">Custom Location</IonLabel>
          <IonInput
            value={value}
            onIonInput={(e) => onLocationChange(e.detail.value!)}
            placeholder="Enter your custom location"
          />
        </IonItem>
      )}
    </>
  );
};

export default LocationSelector;
