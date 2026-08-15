function formatPhotonFeature(feature) {
  const props = feature.properties || {};
  const coordinates = feature.geometry?.coordinates || [];
  const parts = [props.name, props.city, props.state, props.country].filter(Boolean);

  return {
    id: `${props.osm_type || "osm"}-${props.osm_id || parts.join("-")}`,
    name: props.name || props.city || "Selected locality",
    placeFormatted: parts.slice(1).join(", "),
    locality: parts.join(", "),
    latitude: coordinates[1] || "",
    longitude: coordinates[0] || ""
  };
}

export const getLocationSuggestions = async (query) => {
  if(!query || query.length < 3) {
    return [];
  }

  try {
    const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();

    return (data.features || []).map(formatPhotonFeature);
  } catch (error) {
    return [];
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
    message: "Location selected",
    success: true,
    locality: suggestion.locality || suggestion.name,
    latitude: suggestion.latitude,
    longitude: suggestion.longitude
  };
};

export const getCurrentLocality = async () => {
  if(!navigator.geolocation) {
    return {
      message: "Location is not supported in this browser",
      success: false
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&email=demo@empowher.local`,
            {
              headers: {
                "Accept": "application/json"
              }
            }
          );
          const data = await response.json();
          const address = data.address || {};
          const locality = [
            address.neighbourhood || address.suburb || address.city_district || address.city || address.town || address.village,
            address.state,
            address.country
          ].filter(Boolean).join(", ");

          resolve({
            message: "Location detected",
            success: true,
            locality: locality || data.display_name || "Detected location",
            latitude,
            longitude
          });
        } catch (error) {
          resolve({
            message: "Could not find locality. Please type it manually.",
            success: false
          });
        }
      },
      () => {
        resolve({
          message: "Location permission denied. Please type locality manually.",
          success: false
        });
      }
    );
  });
};
