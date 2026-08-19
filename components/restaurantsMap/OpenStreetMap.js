import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { config } from '../../config'

const isWeb = Platform.OS === 'web'

/**
 * Build the Leaflet tileLayer JS snippet based on MAP_PROVIDER env var.
 * Supported: 'osm' (default, free) | 'maptiler' | 'mapbox' | 'google'
 */
function buildTileLayerSnippet() {
  const provider = (config.MAP_PROVIDER || 'osm').toLowerCase()
  switch (provider) {
    case 'maptiler': {
      const key = config.MAPTILER_API_KEY || ''
      return `L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}', {
        maxZoom: 20,
        crossOrigin: true,
        attribution: '\\u00a9 <a href="https://www.maptiler.com/">MapTiler</a> \\u00a9 OpenStreetMap',
      }).addTo(map);`
    }
    case 'mapbox': {
      const token = config.MAPBOX_ACCESS_TOKEN || ''
      return `L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${token}', {
        maxZoom: 22,
        tileSize: 512,
        zoomOffset: -1,
        attribution: '\\u00a9 <a href="https://www.mapbox.com/about/maps/">Mapbox</a> \\u00a9 OpenStreetMap',
      }).addTo(map);`
    }
    case 'google': {
      const key = config.GOOGLE_MAPS_API_KEY || ''
      const keyParam = key ? \`&key=\${key}\` : ''
      return \`L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}\${keyParam}', {
        maxZoom: 20,
        subdomains: ['0', '1', '2', '3'],
        attribution: '\\u00a9 Google',
      }).addTo(map);\`
    }
    default: // 'osm' — free, no key
      return `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '\\u00a9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);`
  }
}

const TILE_LAYER_SNIPPET = buildTileLayerSnippet()

const createOpenStreetMapHtml = (initialRegion) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
    />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #f5f5f5;
      }

      .leaflet-control-attribution {
        font-size: 10px;
      }

      .map-marker-wrapper {
        background: transparent;
        border: none;
      }

      .map-marker {
        width: 36px;
        height: 36px;
        border-radius: 18px;
        background: #ffffff;
        border: 2px solid rgba(0, 0, 0, 0.12);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .map-marker.active {
        width: 46px;
        height: 46px;
        border-radius: 23px;
        background: #111827;
        border: 3px solid #ffffff;
        box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.18), 0 4px 14px rgba(0, 0, 0, 0.28);
      }

      .map-marker-icon {
        color: #111827;
        font-size: 15px;
        line-height: 1;
      }

      .map-marker.active .map-marker-icon {
        color: #ffffff;
        font-size: 17px;
      }

      .map-marker-icon.restaurant {
        color: inherit;
      }

      .user-marker {
        width: 18px;
        height: 18px;
        border-radius: 9px;
        background: #4caf50;
        border: 3px solid #ffffff;
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.3);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const postToHost = (payload) => {
        const msg = typeof payload === 'string' ? payload : JSON.stringify(payload);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(msg);
        } else if (window.parent && window.parent !== window) {
          window.parent.postMessage(msg, '*');
        }
      };

      const initialRegion = ${JSON.stringify(initialRegion)};

      const regionToBounds = (region) => {
        if (!region || typeof region.latitude !== 'number' || typeof region.longitude !== 'number') {
          return null;
        }
        const latD = Math.max(Number(region.latitudeDelta) || 0.01, 0.0005);
        const lngD = Math.max(
          Number(region.longitudeDelta) || latD,
          0.0005
        );
        const south = region.latitude - latD / 2;
        const north = region.latitude + latD / 2;
        const west = region.longitude - lngD / 2;
        const east = region.longitude + lngD / 2;
        return L.latLngBounds(
          L.latLng(south, west),
          L.latLng(north, east)
        );
      };

      const map = L.map('map', {
        zoomControl: false,
        preferCanvas: true,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      ${TILE_LAYER_SNIPPET}

      const markerLayer = L.layerGroup().addTo(map);
      const routeLayer = L.layerGroup().addTo(map);
      let userMarker = null;
      let routeRequestId = 0;

      const initialBounds = regionToBounds(initialRegion);
      if (initialBounds && initialBounds.isValid()) {
        map.fitBounds(initialBounds, { padding: [20, 20], maxZoom: 18 });
      } else {
        map.setView(
          [initialRegion.latitude || 0, initialRegion.longitude || 0],
          14
        );
      }

      const escapeHtml = (value) =>
        String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

      const getMarkerIcon = (isActive, entityType = 'restaurant') => {
        const size = isActive ? 46 : 36;
        const anchor = size / 2;
        return L.divIcon({
          className: 'map-marker-wrapper',
          html:
            '<div class="map-marker' +
            (isActive ? ' active' : '') +
            '"><span class="map-marker-icon ' +
            (entityType === 'delivery' ? 'delivery' : entityType === 'customer' ? 'customer' : 'restaurant') +
            '"><i class="fa-solid ' +
            (entityType === 'delivery' ? 'fa-motorcycle' : entityType === 'customer' ? 'fa-user' : 'fa-utensils') +
            '"></i></span></div>',
          iconSize: [size, size],
          iconAnchor: [anchor, anchor],
        });
      };

      const estimateEtaMinutesFromDistance = (distanceKm) => {
        const avgSpeedKmh = 25;
        const baseMinutes = (distanceKm / avgSpeedKmh) * 60;
        return Math.max(1, Math.round(baseMinutes + 2));
      };

      const drawRouteBetween = async (fromPoint, toPoint) => {
        routeLayer.clearLayers();
        if (!fromPoint || !toPoint) return;

        routeRequestId += 1;
        const requestId = routeRequestId;

        try {
          const url =
            'https://router.project-osrm.org/route/v1/driving/' +
            fromPoint.longitude +
            ',' +
            fromPoint.latitude +
            ';' +
            toPoint.longitude +
            ',' +
            toPoint.latitude +
            '?overview=full&geometries=geojson';

          const response = await fetch(url);
          const data = await response.json();

          if (requestId !== routeRequestId) return;

          const coordinates = data?.routes?.[0]?.geometry?.coordinates;
          if (!Array.isArray(coordinates) || !coordinates.length) return;

          const latLngs = coordinates.map((coord) => [coord[1], coord[0]]);
          L.polyline(latLngs, {
            color: '#0f172a',
            weight: 9,
            opacity: 0.2,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(routeLayer);

          L.polyline(latLngs, {
            color: '#2563eb',
            weight: 5,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(routeLayer);

          L.polyline(latLngs, {
            color: '#93c5fd',
            weight: 2,
            opacity: 0.95,
            dashArray: '2, 10',
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(routeLayer);
        } catch (_error) {
          // Fallback silencieux: pas de tracé si OSRM indisponible.
        }
      };

      const syncMarkers = (payload) => {
        markerLayer.clearLayers();
        routeLayer.clearLayers();

        let deliveryPoint = null;
        let customerPoint = null;

        (payload.restaurants || []).forEach((restaurant) => {
          const lat = Number(restaurant?.latitude);
          const lng = Number(restaurant?.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return;
          }

          if (restaurant?.entityType === 'delivery') {
            deliveryPoint = { latitude: lat, longitude: lng };
          }
          if (restaurant?.entityType === 'customer') {
            customerPoint = { latitude: lat, longitude: lng };
          }

          const marker = L.marker(
            [lat, lng],
            {
              icon: getMarkerIcon(
                restaurant.originalIndex === payload.focusedOriginalIndex,
                restaurant.entityType
              ),
              zIndexOffset: restaurant.originalIndex === payload.focusedOriginalIndex ? 1000 : 1,
            }
          );

          marker.bindPopup(
            '<strong>' +
              escapeHtml(restaurant.name || 'Restaurant') +
              '</strong><br />' +
              escapeHtml(
                restaurant.distance !== null && restaurant.distance !== undefined
                  ? restaurant.distance.toFixed(1) +
                    ' km · ETA ~' +
                    estimateEtaMinutesFromDistance(restaurant.distance) +
                    ' min'
                  : 'Distance inconnue'
              )
          );

          marker.on('click', () => {
            postToHost({
              type: 'MARKER_PRESS',
              payload: { originalIndex: restaurant.originalIndex },
            });
          });

          marker.addTo(markerLayer);
        });

        drawRouteBetween(deliveryPoint, customerPoint);

        if (payload.userLocation && payload.userLocation.lat && payload.userLocation.lng) {
          if (userMarker) {
            map.removeLayer(userMarker);
          }

          userMarker = L.marker(
            [payload.userLocation.lat, payload.userLocation.lng],
            {
              icon: L.divIcon({
                className: 'map-marker-wrapper',
                html: '<div class="user-marker"></div>',
                iconSize: [18, 18],
                iconAnchor: [9, 9],
              }),
            }
          ).addTo(map);
        }

        // Leaflet in iframe often needs a resize after first paint on web.
        setTimeout(() => map.invalidateSize(), 50);
      };

      const setRegion = (region, animated = true) => {
        if (!region || typeof region.latitude !== 'number' || typeof region.longitude !== 'number') {
          return;
        }
        if (!Number.isFinite(region.latitude) || !Number.isFinite(region.longitude)) {
          return;
        }

        const zoom = Math.max(
          3,
          Math.min(
            18,
            Math.round(Math.log2(360 / Math.max(Number(region.latitudeDelta) || 0.01, 0.0005)))
          )
        );

        if (animated && map.flyTo) {
          map.flyTo([region.latitude, region.longitude], zoom, { duration: 0.45 });
          return;
        }

        map.setView([region.latitude, region.longitude], zoom);
      };

      window.__updateMap = (message) => {
        if (!message || !message.type) return;

        if (message.type === 'SYNC_MAP') {
          syncMarkers(message.payload || {});
          return;
        }

        if (message.type === 'ANIMATE_TO_REGION') {
          setRegion(message.payload, true);
        }
      };

      postToHost({ type: 'MAP_READY' });
      setTimeout(() => map.invalidateSize(), 100);
    </script>
  </body>
</html>`

export default function OpenStreetMap({
  initialRegion,
  targetRegion,
  restaurants,
  focusedOriginalIndex,
  userLocation,
  onMarkerPress,
  testID,
}) {
  const webViewRef = useRef(null)
  const iframeRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const mapHtml = useMemo(
    () => createOpenStreetMapHtml(initialRegion),
    [initialRegion]
  )

  const handleHostMessage = useCallback((raw) => {
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (!data || typeof data !== 'object') return

      if (data.type === 'MAP_READY') {
        setMapReady(true)
        return
      }

      if (data.type === 'MARKER_PRESS') {
        onMarkerPress?.(data.payload?.originalIndex)
      }
    } catch (error) {
      console.warn('Erreur message carte OSM:', error)
    }
  }, [onMarkerPress])

  const injectMapMessage = useCallback((message) => {
    if (!mapReady) return

    if (isWeb) {
      const win = iframeRef.current?.contentWindow
      if (win?.__updateMap) {
        win.__updateMap(message)
      }
      return
    }

    if (!webViewRef.current) return

    const escapedMessage = JSON.stringify(message).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    webViewRef.current.injectJavaScript(`
      if (window.__updateMap) {
        window.__updateMap(JSON.parse('${escapedMessage}'));
      }
      true;
    `)
  }, [mapReady])

  useEffect(() => {
    if (!isWeb) return undefined

    const onWindowMessage = (event) => {
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) {
        return
      }
      handleHostMessage(event.data)
    }

    window.addEventListener('message', onWindowMessage)
    return () => window.removeEventListener('message', onWindowMessage)
  }, [handleHostMessage])

  useEffect(() => {
    injectMapMessage({
      type: 'SYNC_MAP',
      payload: {
        restaurants,
        focusedOriginalIndex,
        userLocation,
      },
    })
  }, [focusedOriginalIndex, injectMapMessage, restaurants, userLocation])

  useEffect(() => {
    injectMapMessage({
      type: 'ANIMATE_TO_REGION',
      payload: targetRegion,
    })
  }, [injectMapMessage, targetRegion])

  const handleMessage = useCallback((event) => {
    handleHostMessage(event.nativeEvent.data)
  }, [handleHostMessage])

  if (isWeb) {
    return (
      <View style={StyleSheet.absoluteFill} testID={testID} accessibilityLabel={testID}>
        <iframe
          ref={iframeRef}
          title="Google Maps"
          srcDoc={mapHtml}
          style={{
            border: 'none',
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            background: '#e8eaed',
          }}
        />
      </View>
    )
  }

  return (
    <WebView
      testID={testID}
      accessibilityLabel={testID}
      ref={webViewRef}
      originWhitelist={['*']}
      source={{ html: mapHtml }}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      mixedContentMode="always"
      style={StyleSheet.absoluteFill}
    />
  )
}
