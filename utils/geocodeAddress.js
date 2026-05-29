const OPENSTREETMAP_NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export async function geocodeAddress(address) {
  const query = typeof address === 'string' ? address.trim() : ''
  if (!query) return null

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
    })

    const response = await fetch(`${OPENSTREETMAP_NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': 'good-food-customer-app/1.0',
      },
    })

    if (!response.ok) return null

    const data = await response.json()
    const first = Array.isArray(data) ? data[0] : null
    if (!first) return null

    const lat = Number(first.lat)
    const lng = Number(first.lon)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

    return {
      lat,
      lng,
      description: first.display_name || query,
    }
  } catch (error) {
    return null
  }
}
