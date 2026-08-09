import { View, Text, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useSelector, useDispatch } from 'react-redux'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '../lang/i18n'
import { colors } from '../global'
import { getUserAddresses, updateUser } from '../api'

export default function AddressesScreen({ navigation }) {
  const user = useSelector((state) => state.userReducer)
  const dispatch = useDispatch()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)

  const userId = user.id || user.userId

  useFocusEffect(
    useCallback(() => {
      loadAddresses()
    }, [userId, user.address, user.location])
  )

  React.useEffect(() => {
    navigation.setOptions({
      title: i18n.t('addresses.title'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, marginLeft: 5 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleAddAddress}
          style={{ padding: 10, marginRight: 5 }}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  const loadAddresses = async () => {
    try {
      setLoading(true)

      if (userId) {
        const data = await getUserAddresses(userId)
        setAddresses(Array.isArray(data) ? data : [])
        return
      }

      setAddresses([])
    } catch (error) {
      console.error('Error loading addresses:', error)
      Alert.alert(i18n.t('common.error'), i18n.t('addresses.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddAddress = () => {
    navigation.navigate('EditAddress', {
      mode: 'add',
      initialAddress: '',
    })
  }

  const handleEditAddress = (address) => {
    if (address.id !== 'user_default') {
      return
    }

    navigation.navigate('EditAddress', {
      mode: 'edit',
      initialAddress: address.address || user.address || '',
    })
  }

  const handleDeleteAddress = (address) => {
    if (address.id !== 'user_default') {
      return
    }

    Alert.alert(
      i18n.t('addresses.deleteConfirm'),
      i18n.t('addresses.deleteMessage'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedUser = await updateUser(
                { address: '', location: { latitude: 0, longitude: 0 } },
                userId
              )

              const payload = {
                address: '',
                location: { latitude: 0, longitude: 0 },
                lat: 0,
                lng: 0,
              }

              dispatch({ type: 'UPDATE_USER', payload })

              await AsyncStorage.setItem(
                'userData',
                JSON.stringify({ ...user, ...updatedUser, ...payload, userId })
              )

              setAddresses([])
              Alert.alert(i18n.t('common.success'), i18n.t('addresses.deleted'))
            } catch (error) {
              console.error('Error deleting address:', error)
              Alert.alert(i18n.t('common.error'), i18n.t('addresses.deleteError'))
            }
          },
        },
      ]
    )
  }

  const getAddressTypeIcon = (type) => {
    switch (type) {
      case 'home':
        return 'home'
      case 'work':
        return 'briefcase'
      default:
        return 'location'
    }
  }

  const AddressItem = ({ address }) => (
    <View style={[styles.addressItem, address.isDefault && styles.defaultAddress]}>
      <View style={styles.addressLeft}>
        <View style={[styles.addressIcon, address.isDefault && styles.defaultAddressIcon]}>
          <Ionicons
            name={getAddressTypeIcon(address.type)}
            size={20}
            color={address.isDefault ? colors.text.white : colors.primary}
          />
        </View>

        <View style={styles.addressInfo}>
          <View style={styles.addressHeader}>
            <Text style={[styles.addressName, address.isDefault && styles.defaultAddressText]}>
              {address.name || i18n.t('addresses.default')}
            </Text>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>{i18n.t('addresses.default')}</Text>
              </View>
            )}
          </View>

          <Text style={styles.addressText}>{address.address}</Text>
          {address.city ? (
            <Text style={styles.addressText}>
              {address.city}
              {address.postalCode ? `, ${address.postalCode}` : ''}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.addressActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEditAddress(address)}>
          <Ionicons name="pencil" size={20} color={colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteAddress(address)}>
          <Ionicons name="trash" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{i18n.t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerText}>{i18n.t('addresses.description')}</Text>
        </View>

        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={80} color={colors.text.secondary} />
            <Text style={styles.emptyStateTitle}>{i18n.t('addresses.noAddresses')}</Text>
            <Text style={styles.emptyStateText}>{i18n.t('addresses.addFirstAddress')}</Text>

            <TouchableOpacity style={styles.addFirstButton} onPress={handleAddAddress}>
              <Ionicons name="add" size={20} color={colors.text.white} />
              <Text style={styles.addFirstButtonText}>{i18n.t('addresses.addAddress')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.addressesContainer}>
            <FlatList
              data={addresses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <AddressItem address={item} />}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />

            <TouchableOpacity style={styles.addMoreButton} onPress={handleAddAddress}>
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={styles.addMoreButtonText}>{i18n.t('addresses.addNewAddress')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tipsContainer}>
          <View style={styles.tipsHeader}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.tipsTitle}>{i18n.t('addresses.tips')}</Text>
          </View>

          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• {i18n.t('addresses.tip1')}</Text>
            <Text style={styles.tipItem}>• {i18n.t('addresses.tip2')}</Text>
            <Text style={styles.tipItem}>• {i18n.t('addresses.tip3')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  headerInfo: {
    backgroundColor: colors.background.primary,
    padding: 20,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.white,
    marginLeft: 8,
  },
  addressesContainer: {
    backgroundColor: colors.background.primary,
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 12,
  },
  defaultAddress: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  addressLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  defaultAddressIcon: {
    backgroundColor: colors.primary,
  },
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 8,
  },
  defaultAddressText: {
    color: colors.primary,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.white,
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    marginTop: 16,
  },
  addMoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  tipsContainer: {
    backgroundColor: colors.background.primary,
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  itemSeparator: {
    height: 8,
  },
})
