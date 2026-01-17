import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Animated, Image} from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {language, currency, colors}  from '../global'
import Checkout from './Checkout'
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
            existingItem.totalPrice += item.price
        } else {
            acc.push({
                ...item,
                quantity: 1,
                totalPrice: item.price,
                unitPrice: item.price
            })
        }
        return acc
    }, [])

    // Calculs détaillés
    const subtotal = total
    const deliveryFee = subtotal > 25 ? 0 : 2.99 // Frais de livraison gratuits au-dessus de 25$
    const taxRate = 0.08 // 8% de taxes
    const taxAmount = subtotal * taxRate
    const finalTotal = subtotal + deliveryFee + taxAmount

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
                                    {/* Image du produit si disponible */}
                                    {item.image && (
                                        <View style={styles.itemImageContainer}>
                                            <Image
                                                source={{ uri: item.image }}
                                                style={styles.itemImage}
                                                defaultSource={require('../assets/images/category-placeholder.jpg')}
                                            />
                                        </View>
                                    )}

                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                        <View style={styles.itemPriceInfo}>
                                            <Text style={styles.unitPrice}>{formatPrice(item.unitPrice)}</Text>
                                            <Text style={styles.totalPrice}>{formatPrice(item.totalPrice)}</Text>
                                        </View>
                                        {item.specialInstructions && (
                                            <Text style={styles.specialInstructions} numberOfLines={1}>
                                                📝 {item.specialInstructions}
                                            </Text>
                                        )}
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

                                    {/* Bouton supprimer */}
                                    <TouchableOpacity
                                        onPress={() => updateItemQuantity(item.id, 0)}
                                        style={styles.removeButton}
                                    >
                                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    {/* Total détaillé et actions */}
                    {groupedItems.length > 0 && (
                        <View style={styles.footer}>
                            {/* Détail des coûts */}
                            <View style={styles.costBreakdown}>
                                <View style={styles.costRow}>
                                    <Text style={styles.costLabel}>{i18n.t('cart.subtotal')}</Text>
                                    <Text style={styles.costValue}>{formatPrice(subtotal)}</Text>
                                </View>

                                <View style={styles.costRow}>
                                    <Text style={styles.costLabel}>
                                        {i18n.t('cart.deliveryFee')}
                                        {deliveryFee === 0 && <Text style={styles.freeText}> ({i18n.t('cart.free')})</Text>}
                                    </Text>
                                    <Text style={[styles.costValue, deliveryFee === 0 && styles.freeValue]}>
                                        {deliveryFee === 0 ? i18n.t('cart.free') : formatPrice(deliveryFee)}
                                    </Text>
                                </View>

                                <View style={styles.costRow}>
                                    <Text style={styles.costLabel}>{i18n.t('cart.tax')}</Text>
                                    <Text style={styles.costValue}>{formatPrice(taxAmount)}</Text>
                                </View>

                                <View style={[styles.costRow, styles.totalRow]}>
                                    <Text style={styles.totalLabel}>{i18n.t('cart.total')}</Text>
                                    <Text style={styles.totalAmount}>{formatPrice(finalTotal)}</Text>
                                </View>
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
        backgroundColor: "rgba(0,0,0,0.7)",
        paddingBottom: 120, // Plus d'espace pour les bottom tabs et le bouton
    },
    modalCheckoutContainer: {
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%', // Encore plus réduit
        minHeight: 350, // Légèrement augmenté pour le contenu
        marginHorizontal: 15,
        marginBottom: 15,
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
    itemImageContainer: {
        marginRight: 12,
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
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
    itemPriceInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    unitPrice: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    totalPrice: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '600',
    },
    specialInstructions: {
        fontSize: 12,
        color: colors.text.secondary,
        fontStyle: 'italic',
        marginTop: 4,
    },
    removeButton: {
        padding: 8,
        marginLeft: 8,
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
    costBreakdown: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    costLabel: {
        fontSize: 16,
        color: colors.text.secondary,
    },
    costValue: {
        fontSize: 16,
        color: colors.text.primary,
        fontWeight: '500',
    },
    freeText: {
        color: colors.success,
        fontWeight: 'bold',
    },
    freeValue: {
        color: colors.success,
        fontWeight: 'bold',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: colors.grey[100],
        paddingTop: 16,
        marginTop: 8,
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