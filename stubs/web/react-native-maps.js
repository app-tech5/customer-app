const React = require('react')
const { View } = require('react-native')

const MapView = React.forwardRef(function MapView(props, ref) {
  const { children, style, ...rest } = props
  return React.createElement(View, { ref, style, ...rest, accessibilityLabel: 'MapView' }, children)
})

function Marker(props) {
  return React.createElement(View, props)
}

function Callout(props) {
  return React.createElement(View, props)
}

module.exports = {
  __esModule: true,
  default: MapView,
  MapView,
  Marker,
  Callout,
  PROVIDER_GOOGLE: 'google',
  PROVIDER_DEFAULT: 'default',
}
