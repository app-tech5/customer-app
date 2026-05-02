 
import { createContext, useState, useEffect } from 'react'
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
     
    return <OrdersContext.Provider value={{ orders, setOrders, socket }}>{children}</OrdersContext.Provider>
}