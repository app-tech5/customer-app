const React = require('react')
const { View } = require('react-native')

function passthrough(name) {
  const Comp = React.forwardRef(function Stub(props, ref) {
    const { children, style, ...rest } = props
    return React.createElement(View, { ref, style, ...rest, accessibilityLabel: name }, children)
  })
  Comp.displayName = name
  return Comp
}

const Map = passthrough('MapLibreMap')
const Camera = passthrough('MapLibreCamera')
const Marker = passthrough('MapLibreMarker')
const Callout = passthrough('MapLibreCallout')
const Layer = passthrough('MapLibreLayer')
const GeoJSONSource = passthrough('MapLibreGeoJSONSource')

module.exports = {
  Map,
  Camera,
  Marker,
  Callout,
  Layer,
  GeoJSONSource,
  default: Map,
}
