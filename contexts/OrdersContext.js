 
import { createContext, useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { config } from '../config'

export const OrdersContext = createContext()

export const OrdersProvider = ({ children }) => {
    const [orders, setOrders] = useState([])
    useEffect(() => {
        const url = String(config.API_BASE_URL).replace(/\/api\/?$/, '')
        const socket = io(url)
        socket.on('connect', () => {
            socket.emit('joinOrderRoom')
        })
        socket.on('order-updated', (data) => {
            setOrders(prev => prev.map(order => order._id === data.order._id ? data.order : order))
            
        })
        return () => {
            socket.emit('leaveOrderRoom')
            socket.disconnect()
        }
    }, [])
     
    return <OrdersContext.Provider value={{ orders, setOrders }}>{children}</OrdersContext.Provider>
}