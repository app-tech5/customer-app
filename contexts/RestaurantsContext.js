
import { createContext, useState, useEffect, useMemo } from 'react'
import { Platform } from 'react-native'
import { io } from 'socket.io-client'
import { useSelector } from 'react-redux'
import { config } from '../config'
import { getDistanceKmBetweenUserAndRestaurant } from '../utils/deliveryTime'

export const RestaurantsContext = createContext()

export const RestaurantsProvider = ({ children }) => {
  const [restaurantData, setRestaurantData] = useState([])
  const [socket, setSocket] = useState(null)
  const user = useSelector((state) => state.userReducer)

  const userLocation = useMemo(() => {
    if (user?.lat != null && user?.lng != null) {
      return { lat: user.lat, lng: user.lng }
    }
    if (user?.location?.latitude != null && user?.location?.longitude != null) {
      return { lat: user.location.latitude, lng: user.location.longitude }
    }
    return null
  }, [user])

  const restaurantDataWithDistance = useMemo(() => {
    return (restaurantData || []).map((restaurant) => ({
      ...restaurant,
      distance: getDistanceKmBetweenUserAndRestaurant(restaurant, userLocation),
    }))
  }, [restaurantData, userLocation])

  useEffect(() => {
    const url = String(config.API_BASE_URL).replace(/\/api\/?$/, '')
    const socket = io(url)
    setSocket(socket)
    socket.on('connect', () => {
      socket.emit('joinRestaurantsRoom')
    })
    socket.on('restaurant-updated', (data) => {
      setRestaurantData(prev => {
        
        if (data.restaurant.isActivated !== true) {
          return prev.filter(
            restaurant => restaurant._id !== data.restaurant._id
          )
        }
        
        const exists = prev.some(
          restaurant => restaurant._id === data.restaurant._id
        )
        
        if (exists) {
          return prev.map(
            restaurant =>
              restaurant._id === data.restaurant._id
                ? data.restaurant
                : restaurant
          )
        }
        
        return [...prev, data.restaurant]
      })
    })
    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return
    window.__GF_RESTAURANTS__ = restaurantDataWithDistance || []
    return () => {
      if (window.__GF_RESTAURANTS__ === restaurantDataWithDistance) {
        window.__GF_RESTAURANTS__ = []
      }
    }
  }, [restaurantDataWithDistance])

  return <RestaurantsContext.Provider value={{ restaurantData: restaurantDataWithDistance, setRestaurantData, socket }}>{children}</RestaurantsContext.Provider>
}
