const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const sessionToken = String(Date.now());

function getLocalityFromFeature(feature) {
  if(!feature) {
    return "";
  }

  if(feature.properties && feature.properties.full_address) {
    return feature.properties.full_address;
  }

  if(feature.place_name) {
    return feature.place_name;
  }

  if(feature.name) {
    return feature.name;
  }

  return "";
}

export const getLocationSuggestions = async (query) => {
  if(!mapboxToken) {
    return [];
  }

  if(!query || query.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&types=place,locality,neighborhood,address&limit=5&session_token=${sessionToken}&access_token=${mapboxToken}`
    );
    const data = await response.json();

    return data.suggestions || [];
  } catch (error) {
    return [];
  }
};

export const getSelectedLocation = async (mapboxId) => {
  if(!mapboxToken || !mapboxId) {
    return {
      message: "Location service is not configured",
      success: false
    };
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?session_token=${sessionToken}&access_token=${mapboxToken}`
    );
    const data = await response.json();
    const feature = data.features && data.features[0];
    const coordinates = feature && feature.geometry ? feature.geometry.coordinates : [];

    return {
      message: "Location selected",
      success: true,
      locality: getLocalityFromFeature(feature),
      latitude: coordinates[1] || "",
      longitude: coordinates[0] || ""
    };
  } catch (error) {
    return {
      message: "Could not select locality",
      success: false
    };
  }
};

export const getCurrentLocality = async () => {
  if(!mapboxToken) {
    return {
      message: "Add VITE_MAPBOX_ACCESS_TOKEN in client/.env for locality autofill",
      success: false
    };
  }

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
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=neighborhood,locality,place&access_token=${mapboxToken}`
          );
          const data = await response.json();
          const feature = data.features && data.features[0];

          resolve({
            message: "Location detected",
            success: true,
            locality: getLocalityFromFeature(feature),
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
