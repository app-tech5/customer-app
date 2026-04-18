// créer un context pour les orders

import { createContext, useState } from 'react'

export const OrdersContext = createContext()

export const OrdersProvider = ({ children }) => {
    const [orders, setOrders] = useState([])
     
    return <OrdersContext.Provider value={{ orders, setOrders }}>{children}</OrdersContext.Provider>
}