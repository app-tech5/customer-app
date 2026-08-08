const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

const WEB_STUBS = {
  '@stripe/stripe-react-native': path.resolve(__dirname, 'stubs/web/stripe-react-native.js'),
  '@maplibre/maplibre-react-native': path.resolve(__dirname, 'stubs/web/maplibre-react-native.js'),
  'react-native-maps': path.resolve(__dirname, 'stubs/web/react-native-maps.js'),
}

const upstreamResolveRequest = config.resolver.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_STUBS[moduleName]) {
    return { type: 'sourceFile', filePath: WEB_STUBS[moduleName] }
  }
  if (typeof upstreamResolveRequest === 'function') {
    return upstreamResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
