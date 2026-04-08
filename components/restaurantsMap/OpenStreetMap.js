import React, { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import { getZoomLevel } from '../../utils'

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
        background: #000000;
      }

      .map-marker-dot {
        width: 12px;
        height: 12px;
        border-radius: 6px;
        background: #000000;
      }

      .map-marker.active .map-marker-dot {
        background: #ffffff;
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
      const map = L.map('map', {
        zoomControl: false,
        preferCanvas: true,
      }).setView(
        [initialRegion.latitude, initialRegion.longitude],
        ${getZoomLevel(initialRegion.latitudeDelta)}
      );

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const markerLayer = L.layerGroup().addTo(map);
      let userMarker = null;

      const escapeHtml = (value) =>
        String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

      const getMarkerIcon = (isActive) =>
        L.divIcon({
          className: 'map-marker-wrapper',
          html:
            '<div class="map-marker' +
            (isActive ? ' active' : '') +
            '"><div class="map-marker-dot"></div></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

      const syncMarkers = (payload) => {
        markerLayer.clearLayers();

        (payload.restaurants || []).forEach((restaurant) => {
          const marker = L.marker(
            [restaurant.latitude, restaurant.longitude],
            {
              icon: getMarkerIcon(restaurant.originalIndex === payload.focusedOriginalIndex),
              zIndexOffset: restaurant.originalIndex === payload.focusedOriginalIndex ? 1000 : 1,
            }
          );

          marker.bindPopup(
            '<strong>' +
              escapeHtml(restaurant.name || 'Restaurant') +
              '</strong><br />' +
              escapeHtml(
                restaurant.distance !== null && restaurant.distance !== undefined
                  ? restaurant.distance.toFixed(1) + ' km'
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

        const zoom = Math.max(
          3,
          Math.min(18, Math.round(Math.log2(360 / Math.max(region.latitudeDelta || 0.005, 0.0005))))
        );

        if (animated) {
          map.flyTo([region.latitude, region.longitude], zoom, { duration: 0.5 });
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
