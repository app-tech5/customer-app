import React, { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

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
        width: 30px;
        height: 30px;
        border-radius: 15px;
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.15);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .map-marker.active {
        border-color: #111827;
        box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.15), 0 2px 8px rgba(0, 0, 0, 0.22);
      }

      .map-marker-dot {
        width: 12px;
        height: 12px;
        border-radius: 6px;
        background: #000000;
      }

      .map-marker-icon {
        color: #111827;
        font-size: 14px;
        line-height: 1;
      }

      .map-marker-icon.restaurant {
        color: #111827;
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

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

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

      const getMarkerIcon = (isActive, entityType = 'restaurant') =>
        L.divIcon({
          className: 'map-marker-wrapper',
          html:
            '<div class="map-marker' +
            (isActive ? ' active' : '') +
            '"><span class="map-marker-icon ' +
            (entityType === 'delivery' ? 'delivery' : entityType === 'customer' ? 'customer' : 'restaurant') +
            '"><i class="fa-solid ' +
            (entityType === 'delivery' ? 'fa-motorcycle' : entityType === 'customer' ? 'fa-user' : 'fa-utensils') +
            '"></i></span></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

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
        }
      };

      const syncMarkers = (payload) => {
        markerLayer.clearLayers();
        routeLayer.clearLayers();

        let deliveryPoint = null;
        let customerPoint = null;

        (payload.restaurants || []).forEach((restaurant) => {
          if (restaurant?.entityType === 'delivery') {
            deliveryPoint = { latitude: restaurant.latitude, longitude: restaurant.longitude };
          }
          if (restaurant?.entityType === 'customer') {
            customerPoint = { latitude: restaurant.latitude, longitude: restaurant.longitude };
          }

          const marker = L.marker(
            [restaurant.latitude, restaurant.longitude],
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
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: 'MARKER_PRESS',
                  payload: { originalIndex: restaurant.originalIndex },
                })
              );
            }
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
      };

      const setRegion = (region, animated = true) => {
        if (!region) return;

        const bounds = regionToBounds(region);
        if (!bounds || !bounds.isValid()) return;

        const fitOpts = { padding: [20, 20], maxZoom: 18 };

        if (animated && map.flyToBounds) {
          map.flyToBounds(bounds, { ...fitOpts, duration: 0.5 });
          return;
        }

        map.fitBounds(bounds, fitOpts);
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

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
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
  const [mapReady, setMapReady] = useState(false)

  const injectMapMessage = useCallback((message) => {
    if (!webViewRef.current || !mapReady) {
      return
    }

    const escapedMessage = JSON.stringify(message).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    webViewRef.current.injectJavaScript(`
      if (window.__updateMap) {
        window.__updateMap(JSON.parse('${escapedMessage}'));
      }
      true;
    `)
  }, [mapReady])

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
    try {
      const data = JSON.parse(event.nativeEvent.data)

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

  return (
    <WebView
      testID={testID}
      accessibilityLabel={testID}
      ref={webViewRef}
      originWhitelist={['*']}
      source={{ html: createOpenStreetMapHtml(initialRegion) }}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      mixedContentMode="always"
      style={StyleSheet.absoluteFill}
    />
  )
}
