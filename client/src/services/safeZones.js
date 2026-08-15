const cache = new Map();

const typeLabels = {
  police: "Police",
  hospital: "Hospital",
  pharmacy: "Pharmacy"
};

export async function getNearbySafeZones(latitude, longitude) {
  if(!latitude || !longitude) {
    return [];
  }

  const key = `${Number(latitude).toFixed(3)},${Number(longitude).toFixed(3)}`;

  if(cache.has(key)) {
    return cache.get(key);
  }

  const query = `
    [out:json][timeout:8];
    (
      node["amenity"~"police|hospital|pharmacy"](around:2000,${latitude},${longitude});
      way["amenity"~"police|hospital|pharmacy"](around:2000,${latitude},${longitude});
    );
    out center 30;
  `;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      signal: controller.signal
    });
    const data = await response.json();
    const zones = (data.elements || []).map((item) => {
      const latitudeValue = item.lat || item.center?.lat;
      const longitudeValue = item.lon || item.center?.lon;
      const type = item.tags?.amenity || "safe";

      return {
        id: item.id,
        name: item.tags?.name || typeLabels[type] || "Safe zone",
        type,
        latitude: latitudeValue,
        longitude: longitudeValue
      };
    }).filter((item) => item.latitude && item.longitude);

    cache.set(key, zones);
    return zones;
  } catch (error) {
    return [];
  } finally {
    window.clearTimeout(timeout);
  }
}
