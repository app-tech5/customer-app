import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import React, {useState, useEffect, useRef} from 'react'
import { useSelector } from 'react-redux'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { colors, language, currency } from '../../global'
import i18n from '../../lang/i18n'
import CartModal from '../CartModal'

export default function ViewCart({ navigation: _navigation, route, params, deliverySettings: _deliverySettings, restaurant: restaurantProp }) {
    const {restaurant} = route?route.params:params
    const finalRestaurant = restaurantProp || restaurant
    const [modalVisible, setModalVisible] = useState(false)
    const [viewCartButton, setViewCartButton] = useState(true)
    const slideAnim = useRef(new Animated.Value(100)).current
    
    const items = useSelector((state)=>state.cartReducer).filter(item => item.restaurantName === restaurant.name)
    const total = items.reduce((prev, curr)=> prev + (curr.totalPrice || curr.price), 0)
    const itemCount = items.length
    
    useEffect(() => {
        if (total && viewCartButton) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start()
        } else {
            Animated.timing(slideAnim, {
                toValue: 100,
                duration: 300,
                useNativeDriver: true,
            }).start()
        }
    }, [total, viewCartButton])
    
    const formatPrice = (price) => {
        return Number(price).toLocaleString(language, {
            style: "currency",
            currency: currency
        })
    }
    
    const formatItemCount = (count) => {
        const itemText = i18n.t('cart.item', { count })
        return `${count} ${itemText}${count > 1 ? i18n.t('cart.itemsSuffix') : ''}`
    }

    return (
        <>
            <CartModal
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                restaurantName={finalRestaurant.name}
                setViewCartButton={setViewCartButton}
                restaurant={finalRestaurant}
            />

            {total && viewCartButton ? (
                <Animated.View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 999,
                        transform: [{ translateY: slideAnim }]
                    }}
                >
                    <View style={styles.container}>
                        <LinearGradient
                            colors={[colors.primary, colors.success]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradient}
                        >
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => setModalVisible(true)}
                                activeOpacity={0.9}
                            >
                                {}
                                <View style={styles.itemBadge}>
                                    <Text style={styles.itemCount}>{itemCount}</Text>
                                </View>

                                {}
                                <View style={styles.iconContainer}>
                                    <Ionicons name="basket" size={24} color="white" />
                                </View>

                                {}
                                <View style={styles.textContainer}>
                                    <Text style={styles.titleText}>{i18n.t('cart.viewCart')}</Text>
                                    <Text style={styles.subtitleText}>
                                        {formatItemCount(itemCount)}
                                    </Text>
                                </View>

                                {}
                                <View style={styles.priceContainer}>
                                    <Text style={styles.priceText}>{formatPrice(total)}</Text>
                                    <Ionicons name="chevron-forward" size={20} color="white" />
                                </View>
                            </TouchableOpacity>
                        </LinearGradient>

                        {}
                        <View style={styles.shadow} />
                    </View>
                </Animated.View>
            ) : null}
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
    },
    gradient: {
        borderRadius: 16,
        elevation: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
    },
    itemBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FF4757',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    itemCount: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    iconContainer: {
        marginRight: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 8,
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    titleText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    subtitleText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    priceText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 4,
    },
    shadow: {
        position: 'absolute',
        bottom: -4,
        left: 16,
        right: 16,
        height: 8,
        backgroundColor: 'rgba(255, 107, 53, 0.2)',
        borderRadius: 8,
        blurRadius: 10,
    },
})
 