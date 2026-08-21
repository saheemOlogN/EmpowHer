const postalPincodeEndpoint = "https://api.postalpincode.in/pincode";

export function formatLocationLabel(location = {}) {
  return [location.area, location.district, location.state].filter(Boolean).join(", ") + (location.pincode ? ` - ${location.pincode}` : "");
}

function cleanPincode(value = "") {
  return String(value).replace(/\D/g, "").slice(0, 6);
}

function formatPostOffice(postOffice = {}, index = 0) {
  const location = {
    pincode: cleanPincode(postOffice.Pincode),
    area: postOffice.Name || "",
    district: postOffice.District || "",
    state: postOffice.State || ""
  };
  const locality = formatLocationLabel(location);

  return {
    id: `${location.pincode}-${location.area}-${index}`,
    name: location.area || "Selected locality",
    placeFormatted: [location.district, location.state, location.pincode].filter(Boolean).join(", "),
    locality,
    location,
    latitude: null,
    longitude: null
  };
}

export const getLocationSuggestions = async (pincode) => {
  const normalizedPincode = cleanPincode(pincode);

  if(normalizedPincode.length !== 6) {
    return {
      message: "Enter a 6 digit PIN code",
      success: false,
      suggestions: []
    };
  }

  try {
    const response = await fetch(`${postalPincodeEndpoint}/${normalizedPincode}`);

    if(!response.ok) {
      return {
        message: "Could not check that PIN code right now",
        success: false,
        suggestions: []
      };
    }

    const data = await response.json();
    const result = Array.isArray(data) ? data[0] : null;
    const postOffices = Array.isArray(result?.PostOffice) ? result.PostOffice : [];

    if(result?.Status !== "Success" || postOffices.length === 0) {
      return {
        message: "No locality found for that PIN code",
        success: false,
        suggestions: []
      };
    }

    return {
      message: postOffices.length > 1 ? "Choose your locality" : "Locality found",
      success: true,
      suggestions: postOffices.map(formatPostOffice)
    };
  } catch (error) {
    return {
      message: "Network error while checking PIN code",
      success: false,
      suggestions: []
    };
  }
};

export const getSelectedLocation = async (suggestion) => {
  if(!suggestion) {
    return {
      message: "Choose a locality",
      success: false
    };
  }

  return {
    message: "Locality confirmed",
    success: true,
    locality: suggestion.locality,
    location: suggestion.location,
    latitude: null,
    longitude: null
  };
};
