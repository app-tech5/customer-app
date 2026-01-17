import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Animated} from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import OrderItem from './restaurantDetail/OrderItem'
import {language, currency, colors}  from '../global'
import Checkout from './Checkout'
import Loader from '../screens/Loader'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import i18n from '../i18n'

const Cart = ({restaurantName, setViewCartButton, setModalVisible})=>{
    const items = useSelector((state)=>state.cartReducer).filter(item => item.restaurantName === restaurantName)
    const total = items.reduce((prev, curr)=> prev + curr.price, 0)
    const [loader, setLoader] = useState(false)
    const slideAnim = useRef(new Animated.Value(500)).current
    const dispatch = useDispatch()

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
        }).start()
    }, [])

    const closeModal = () => {
        Animated.timing(slideAnim, {
            toValue: 500,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setModalVisible(false))
    }

    // Grouper les items par ID et calculer les quantités
    const groupedItems = items.reduce((acc, item) => {
        const existingItem = acc.find(i => i.id === item.id)
        if (existingItem) {
            existingItem.quantity += 1
        } else {
            acc.push({ ...item, quantity: 1 })
        }
        return acc
    }, [])

    const formatPrice = (price) => {
        return Number(price).toLocaleString(language, {
            style: "currency",
            currency: currency
        })
    }

    const updateItemQuantity = (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            // Supprimer l'item
            dispatch({
                type: 'REMOVE_FROM_CARD',
                payload: itemId
            })
        } else {
            // Mettre à jour la quantité
            const currentQuantity = items.filter(item => item.id === itemId).length
            if (newQuantity > currentQuantity) {
                // Ajouter des items
                const itemToAdd = items.find(item => item.id === itemId)
                for (let i = currentQuantity; i < newQuantity; i++) {
                    dispatch({
                        type: 'ADD_TO_CART',
                        payload: itemToAdd
                    })
                }
            } else {
                // Supprimer des items (garder seulement newQuantity items)
                const itemsToRemove = items.filter(item => item.id === itemId).slice(newQuantity)
                itemsToRemove.forEach(() => {
                    dispatch({
                        type: 'REMOVE_FROM_CARD',
                        payload: itemId
                    })
                })
            }
        }
    }

    const removeAllItems = () => {
        items.forEach(item => {
            dispatch({
                type: 'REMOVE_FROM_CARD',
                payload: item.id
            })
        })
        closeModal()
    }

    return (
        <TouchableOpacity
            style={styles.modalContainer}
            onPress={closeModal}
            activeOpacity={1}
        >
            <Animated.View
                style={[
                    styles.modalCheckoutContainer,
                    { transform: [{ translateY: slideAnim }] }
                ]}
            >
                <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{flex: 1}}>
                    {/* Header avec nom du restaurant et bouton fermer */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Ionicons name="basket" size={24} color={colors.primary} />
                            <Text style={styles.restaurantName}>{restaurantName}</Text>
                        </View>
                        <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.grey[600]} />
                        </TouchableOpacity>
                    </View>

                    {/* Liste des items */}
                    <ScrollView
                        style={styles.itemsContainer}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.itemsContent}
                    >
                        {groupedItems.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="basket-outline" size={64} color={colors.grey[300]} />
                                <Text style={styles.emptyText}>{i18n.t('cart.empty')}</Text>
                                <Text style={styles.emptySubtext}>{i18n.t('cart.addItems')}</Text>
                            </View>
                        ) : (
                            groupedItems.map((item, index) => (
                                <View key={item.id} style={styles.itemContainer}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                        <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                                    </View>
                                    <View style={styles.quantityControls}>
                                        <TouchableOpacity
                                            onPress={() => updateItemQuantity(item.id, item.quantity - 1)}
                                            style={styles.quantityButton}
                                        >
                                            <Ionicons name="remove" size={16} color={colors.primary} />
                                        </TouchableOpacity>
                                        <Text style={styles.quantityText}>{item.quantity}</Text>
                                        <TouchableOpacity
                                            onPress={() => updateItemQuantity(item.id, item.quantity + 1)}
                                            style={styles.quantityButton}
                                        >
                                            <Ionicons name="add" size={16} color={colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    {/* Total et actions */}
                    {groupedItems.length > 0 && (
                        <View style={styles.footer}>
                            <View style={styles.totalContainer}>
                                <Text style={styles.totalLabel}>{i18n.t('cart.total')}</Text>
                                <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
                            </View>

                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    onPress={removeAllItems}
                                    style={styles.clearButton}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                                    <Text style={styles.clearButtonText}>{i18n.t('cart.clearCart')}</Text>
                                </TouchableOpacity>

                                <Checkout
                                    restaurantName={restaurantName}
                                    setLoader={setLoader}
                                    setViewCartButton={setViewCartButton}
                                    setModalVisible={setModalVisible}
                                    closeModal={closeModal}
                                />
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </TouchableOpacity>
    )
}
const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.7)"
    },
    modalCheckoutContainer: {
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        minHeight: 300,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.grey[100],
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 12,
        color: colors.text.primary,
        flex: 1,
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: colors.grey[50],
    },
    itemsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    itemsContent: {
        paddingVertical: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text.primary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.grey[50],
        borderRadius: 12,
        marginBottom: 8,
    },
    itemInfo: {
        flex: 1,
        marginRight: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text.primary,
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    quantityButton: {
        padding: 8,
        borderRadius: 16,
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        minWidth: 30,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: colors.grey[100],
        backgroundColor: colors.grey[50],
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text.primary,
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    actionButtons: {
        padding: 20,
        gap: 12,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.error,
        marginBottom: 8,
    },
    clearButtonText: {
        color: colors.error,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
})
export default Cart;