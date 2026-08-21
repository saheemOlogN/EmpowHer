const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const mapboxEndpoint = "https://api.mapbox.com/geocoding/v5/mapbox.places";

function buildMapboxParams(params = {}) {
  const searchParams = new URLSearchParams({
    country: "IN",
    types: "place,locality,neighborhood",
    access_token: mapboxToken,
    ...params
  });

  return searchParams.toString();
}

function formatMapboxFeature(feature) {
  const coordinates = feature.center || feature.geometry?.coordinates || [];
  const placeName = feature.place_name || feature.text || "Selected locality";

  return {
    id: feature.id || placeName,
    name: placeName,
    placeFormatted: "",
    locality: placeName,
    latitude: coordinates[1] || "",
    longitude: coordinates[0] || ""
  };
}

function hasCoordinates({ latitude, longitude } = {}) {
  return latitude !== undefined && latitude !== null && latitude !== "" && longitude !== undefined && longitude !== null && longitude !== "";
}

function buildProximity({ latitude, longitude } = {}) {
  return hasCoordinates({ latitude, longitude }) ? `${longitude},${latitude}` : undefined;
}

export const getLocationSuggestions = async (query, coordinates = {}) => {
  if(!query || query.length < 3 || !mapboxToken) {
    return [];
  }

  try {
    const params = {
      autocomplete: "true",
      limit: "5"
    };
    const proximity = buildProximity(coordinates);

    if(proximity) {
      params.proximity = proximity;
    }

    const response = await fetch(`${mapboxEndpoint}/${encodeURIComponent(query)}.json?${buildMapboxParams(params)}`);
    const data = await response.json();

    return (data.features || []).map(formatMapboxFeature);
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

  if(!mapboxToken) {
    return {
      message: "Mapbox token is missing. Please type locality manually.",
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
            `${mapboxEndpoint}/${longitude},${latitude}.json?${buildMapboxParams()}`
          );
          const data = await response.json();
          const feature = (data.features || [])[0];
          const locality = feature ? formatMapboxFeature(feature).locality : "";

          resolve({
            message: "Location detected",
            success: true,
            locality: locality || "Detected location",
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
