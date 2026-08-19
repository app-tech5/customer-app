 
import { createContext, useState, useEffect } from 'react'
import { Platform } from 'react-native'
import { io } from 'socket.io-client'
import { config } from '../config'
import { useSelector } from 'react-redux'

export const OrdersContext = createContext()

export const OrdersProvider = ({ children }) => {
    const [orders, setOrders] = useState([])
    const user = useSelector((state) => state.userReducer)
    const [socket, setSocket] = useState(null)
    useEffect(() => {
        const url = String(config.API_BASE_URL).replace(/\/api\/?$/, '')
        const socket = io(url)
        setSocket(socket)
        socket.on('connect', () => {
            socket.emit('joinOrderRoom', user.id || user._id)
        })
        socket.on('order-updated', (data) => {
            setOrders(prev => prev.map(order => order._id === data.order._id ? data.order : order))
            
        })
        return () => {
            socket.emit('leaveOrderRoom')
            socket.disconnect()
        }
        }, [])

    useEffect(() => {
        if (Platform.OS !== 'web' || typeof window === 'undefined') return
        window.__GF_ORDERS__ = orders || []
        return () => {
            if (window.__GF_ORDERS__ === orders) window.__GF_ORDERS__ = []
        }
    }, [orders])
     
    return <OrdersContext.Provider value={{ orders, setOrders, socket }}>{children}</OrdersContext.Provider>
}