import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView, StatusBar } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigation, useRoute } from '@react-navigation/native'
import { language, currency, colors } from '../global'
import Checkout from '../components/Checkout'
import { Ionicons } from '@expo/vector-icons'
import i18n from '../lang/i18n'
import { getRestaurantDeliverySettings } from '../api'
import { useDeliverySettings } from '../contexts/DeliverySettingsContext'

const CartDetailsScreen = () => {
    const route = useRoute()
    const navigation = useNavigation()
    const { restaurantName, restaurant } = route.params || {}

    const items = useSelector((state) => state.cartReducer).filter(item => item.restaurantName === restaurantName)
    const total = items.reduce((prev, curr) => prev + (curr.totalPrice || curr.price), 0)
    const [loader, setLoader] = useState(false)
    const dispatch = useDispatch()
    const { calculateTotal } = useDeliverySettings()
    const [deliverySetting, setDeliverySetting] = useState(null)

    useEffect(() => {
        const restaurantId = restaurant?.restaurantId || restaurant?.id || restaurant?._id
        if (!restaurantId) {
            setDeliverySetting(null)
            return undefined
        }
        let cancelled = false
        setDeliverySetting(null)
        ;(async () => {
            try {
                const doc = await getRestaurantDeliverySettings(restaurantId)
                if (!cancelled) setDeliverySetting(doc)
            } catch (error) {
                console.warn('Could not load restaurant delivery settings:', error)
            }
        })()
        return () => { cancelled = true }
    }, [restaurant])

    useEffect(() => {
        
        navigation.setOptions({
            title: restaurantName || i18n.t('cart.title'),
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
            ),
        })
    }, [navigation, restaurantName])
    
    const groupedItems = items.reduce((acc, item) => {
        
        const itemPrice = item.totalPrice || item.price

        const existingItem = acc.find(i => i.id === item.id)
        if (existingItem) {
            existingItem.quantity += 1
            existingItem.totalPrice += itemPrice
        } else {
            acc.push({
                ...item,
                quantity: 1,
                totalPrice: itemPrice,
                unitPrice: itemPrice
            })
        }
        return acc
    }, [])
    
    const distance = restaurant?.distance > 0 ? restaurant.distance : null
    const totals = calculateTotal(deliverySetting, total, restaurant?.taxRate, distance) || {
        subtotal: total,
        deliveryFee: 2.99,
        taxAmount: total * 0.08,
        total: total + 2.99 + (total * 0.08),
        isFreeDelivery: false
    }

    const formatPrice = (price) => {
        return Number(price).toLocaleString(language, {
            style: "currency",
            currency: currency
        })
    }

    const updateItemQuantity = async (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            
            const itemsToRemove = items.filter(item => item.id === itemId)
            for (const item of itemsToRemove) {
                dispatch({
                    type: 'REMOVE_FROM_CARD',
                    payload: itemId
                })
                
                try {
                    const { removeFromCart } = await import('../api')
                    await removeFromCart(itemId)
                } catch (error) {
                    console.error('Error syncing remove from cart:', error)
                }
            }
        } else {
            
            const currentQuantity = items.filter(item => item.id === itemId).length
            if (newQuantity > currentQuantity) {
                
                const itemToAdd = items.find(item => item.id === itemId)
                if (itemToAdd) {
                    for (let i = currentQuantity; i < newQuantity; i++) {
                        
                        const newItemId = itemToAdd.id || `item_${Date.now()}_${Math.random()}`;
                        const newItem = {
                            ...itemToAdd,
                            id: newItemId,
                            uniqueKey: `${newItemId}_${Date.now()}_${Math.random()}`
                        }

                        dispatch({
                            type: 'ADD_TO_CART',
                            payload: newItem
                        })
                        
                        try {
                            const { addToCart } = await import('../api')
                            await addToCart(newItem)
                        } catch (error) {
                            console.error('Error syncing add to cart:', error)
                        }
                    }
                }
            } else {
                
                const itemsToRemove = items.filter(item => item.id === itemId).slice(newQuantity)
                for (const item of itemsToRemove) {
                    dispatch({
                        type: 'REMOVE_FROM_CARD',
                        payload: itemId
                    })
                    
                    try {
                        const { removeFromCart } = await import('../api')
                        await removeFromCart(itemId)
                    } catch (error) {
                        console.error('Error syncing remove from cart:', error)
                    }
                }
            }
        }
    }

    const removeAllItems = async () => {
        
        dispatch({
            type: 'CLEAR_RESTAURANT',
            payload: restaurantName
        })
        
        try {
            const { clearRestaurantFromCart } = await import('../api')
            await clearRestaurantFromCart(restaurantName)
        } catch (error) {
            console.error('Error syncing clear restaurant:', error)
        }

        navigation.goBack()
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {}
                <View style={styles.restaurantHeader}>
                    <View style={styles.restaurantInfo}>
                        <Ionicons name="restaurant" size={24} color={colors.primary} />
                        <Text style={styles.restaurantTitle}>{restaurantName}</Text>
                    </View>
                    {restaurant?.description && (
                        <Text style={styles.restaurantDescription} numberOfLines={2}>
                            {restaurant.description}
                        </Text>
                    )}
                </View>

                {}
                <View style={styles.itemsSection}>
                    <Text style={styles.sectionTitle}>{i18n.t('cart.items')}</Text>

                    {groupedItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="basket-outline" size={80} color={colors.grey[300]} />
                            <Text style={styles.emptyText}>{i18n.t('cart.empty')}</Text>
                            <Text style={styles.emptySubtext}>{i18n.t('cart.addItems')}</Text>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.backToMenuButton}
                            >
                                <Text style={styles.backToMenuText}>{i18n.t('cart.backToMenu')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        groupedItems.map((item, index) => (
                            <View key={item.id} style={styles.itemContainer}>
                                {}
                                {item.image && (
                                    <View style={styles.itemImageContainer}>
                                        <Image
                                            source={{ uri: item.image }}
                                            style={styles.itemImage}
                                            defaultSource={require('../assets/images/category-placeholder.jpg')}
                                        />
                                    </View>
                                )}

                                <View style={styles.itemContent}>
                                    <View style={styles.itemHeader}>
                                        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                        <TouchableOpacity
                                            onPress={() => updateItemQuantity(item.id, 0)}
                                            style={styles.removeButton}
                                        >
                                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.itemDetails}>
                                        <View style={styles.itemPriceInfo}>
                                            <Text style={styles.unitPrice}>{formatPrice(item.unitPrice)} {i18n.t('cart.each')}</Text>
                                            <Text style={styles.totalPrice}>{formatPrice(item.totalPrice)}</Text>
                                        </View>

                                        {item.specialInstructions && (
                                            <View style={styles.specialInstructionsContainer}>
                                                <Ionicons name="document-text-outline" size={16} color={colors.text.secondary} />
                                                <Text style={styles.specialInstructions} numberOfLines={2}>
                                                    {item.specialInstructions}
                                                </Text>
                                            </View>
                                        )}

                                        {item.variants && item.variants.length > 0 && (
                                            <View style={styles.variantsContainer}>
                                                <Text style={styles.variantsLabel}>{i18n.t('cart.options')}:</Text>
                                                {item.variants.map((variant, vIndex) => (
                                                    <Text key={vIndex} style={styles.variantText}>
                                                        • {variant.name}: {formatPrice(variant.price)}
                                                    </Text>
                                                ))}
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.quantityControls}>
                                        <TouchableOpacity
                                            onPress={() => updateItemQuantity(item.id, item.quantity - 1)}
                                            style={styles.quantityButton}
                                        >
                                            <Ionicons name="remove" size={18} color={colors.primary} />
                                        </TouchableOpacity>
                                        <Text style={styles.quantityText}>{item.quantity}</Text>
                                        <TouchableOpacity
                                            onPress={() => updateItemQuantity(item.id, item.quantity + 1)}
                                            style={styles.quantityButton}
                                        >
                                            <Ionicons name="add" size={18} color={colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {}
                {groupedItems.length > 0 && (
                    <View style={styles.summarySection}>
                        <Text style={styles.sectionTitle}>{i18n.t('cart.orderSummary')}</Text>

                        <View style={styles.summaryCard}>
                            <View style={styles.costBreakdown}>
                                <View style={styles.costRow}>
                                    <Text style={styles.costLabel}>{i18n.t('cart.subtotal')}</Text>
                                    <Text style={styles.costValue}>{formatPrice(totals.subtotal)}</Text>
                                </View>

                                <View style={styles.costRow}>
                                    <Text style={styles.costLabel}>
                                        {i18n.t('cart.deliveryFee')}
                                        {totals.deliveryFee === 0 && <Text style={styles.freeText}> ({i18n.t('cart.free')})</Text>}
                                    </Text>
                                    <Text style={[styles.costValue, totals.deliveryFee === 0 && styles.freeValue]}>
                                        {totals.deliveryFee === 0 ? i18n.t('cart.free') : formatPrice(totals.deliveryFee)}
                                    </Text>
                                </View>

                                <View style={styles.costRow}>
                                    <Text style={styles.costLabel}>{i18n.t('cart.tax')}</Text>
                                    <Text style={styles.costValue}>{formatPrice(totals.taxAmount)}</Text>
                                </View>

                                <View style={[styles.costRow, styles.totalRow]}>
                                    <Text style={styles.totalLabel}>{i18n.t('cart.total')}</Text>
                                    <Text style={styles.totalAmount}>{formatPrice(totals.total)}</Text>
                                </View>
                            </View>
                        </View>

                        {}
                        {restaurant && (
                            <View style={styles.deliveryInfo}>
                                <View style={styles.deliveryRow}>
                                    <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
                                    <Text style={styles.deliveryText}>
                                        {i18n.t('cart.deliveryTime')}: {restaurant.deliveryTime || '30-45 min'}
                                    </Text>
                                </View>
                                <View style={styles.deliveryRow}>
                                    <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                                    <Text style={styles.deliveryText}>
                                        {i18n.t('cart.deliveryFee')}: {totals.deliveryFee === 0 ? i18n.t('cart.free') : formatPrice(totals.deliveryFee)}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {}
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
                                setViewCartButton={() => {}}
                                setModalVisible={() => {}}
                                closeModal={() => navigation.goBack()}
                                deliverySetting={deliverySetting}
                                restaurant={restaurant}
                                isFullScreen={true}
                            />
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.grey[50],
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    headerButton: {
        padding: 8,
        marginLeft: 8,
    },
    restaurantHeader: {
        backgroundColor: 'white',
        padding: 20,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.grey[100],
    },
    restaurantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    restaurantTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginLeft: 12,
        flex: 1,
    },
    restaurantDescription: {
        fontSize: 14,
        color: colors.text.secondary,
        marginLeft: 36,
    },
    itemsSection: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text.primary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 16,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    backToMenuButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: colors.primary,
        borderRadius: 8,
    },
    backToMenuText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    itemContainer: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: colors.grey[50],
        borderRadius: 12,
        marginBottom: 12,
    },
    itemImageContainer: {
        marginRight: 16,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    itemContent: {
        flex: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '500',
        color: colors.text.primary,
        flex: 1,
        marginRight: 12,
    },
    removeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'white',
    },
    itemDetails: {
        marginBottom: 12,
    },
    itemPriceInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    unitPrice: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    totalPrice: {
        fontSize: 18,
        color: colors.primary,
        fontWeight: '600',
    },
    specialInstructionsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    specialInstructions: {
        fontSize: 14,
        color: colors.text.secondary,
        fontStyle: 'italic',
        marginLeft: 8,
        flex: 1,
    },
    variantsContainer: {
        marginTop: 8,
    },
    variantsLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text.primary,
        marginBottom: 4,
    },
    variantText: {
        fontSize: 13,
        color: colors.text.secondary,
        marginLeft: 8,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 25,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignSelf: 'flex-start',
    },
    quantityButton: {
        padding: 8,
        borderRadius: 20,
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        minWidth: 30,
        textAlign: 'center',
        marginHorizontal: 12,
    },
    summarySection: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
    },
    costBreakdown: {
        marginBottom: 16,
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
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
        borderTopWidth: 2,
        borderTopColor: colors.grey[200],
        paddingTop: 16,
        marginTop: 16,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text.primary,
    },
    totalAmount: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.primary,
    },
    deliveryInfo: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    deliveryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    deliveryText: {
        fontSize: 14,
        color: colors.text.secondary,
        marginLeft: 12,
    },
    actionButtons: {
        gap: 12,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.error,
    },
    clearButtonText: {
        color: colors.error,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
})

export default CartDetailsScreen