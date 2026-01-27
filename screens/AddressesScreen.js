import { View, Text, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons'
import { useSelector } from 'react-redux'
import i18n from '../i18n'
import { colors } from '../global'

export default function AddressesScreen({ navigation }) {
  const user = useSelector((state) => state.userReducer)
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAddresses()

    navigation.setOptions({
      title: i18n.t('addresses.title', 'Addresses'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, marginLeft: 5 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleAddAddress}
          style={{ padding: 10, marginRight: 5 }}
          accessibilityRole="button"
          accessibilityLabel="Add address"
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  const loadAddresses = () => {
    try {
      setLoading(true)

      // Utiliser les données utilisateur locales depuis Redux/AsyncStorage
      let addressesData = []

      // If user has an address in their profile (user.address du modèle User)
      if (user.address && user.address.trim()) {
        // Try to parse the address if it contains structured data
        let addressParts = user.address.split(',')
        let address = user.address
        let city = ''
        let postalCode = ''
        let country = 'France' // Default country

        if (addressParts.length >= 2) {
          address = addressParts[0].trim()
          city = addressParts[1].trim()

          if (addressParts.length >= 3) {
            postalCode = addressParts[2].trim()
          }
        }

        addressesData.push({
          id: 'user_default',
          type: 'home',
          name: 'My Address',
          address: address,
          city: city,
          postalCode: postalCode,
          country: country,
          isDefault: true,
          coordinates: user.location ? {
            lat: user.location.latitude,
            lng: user.location.longitude
          } : null
        })
      }

      // Mock additional addresses
      const mockAddresses = [
        {
          id: '1',
          type: 'work',
          name: 'Work',
          address: '456 Business Avenue, Floor 15',
          city: 'Paris',
          postalCode: '75002',
          country: 'France',
          isDefault: !user.address || !user.address.trim(),
          coordinates: { lat: 48.8584, lng: 2.2945 }
        }
      ]

      addressesData = [...addressesData, ...mockAddresses]

      setAddresses(addressesData)
    } catch (error) {
      console.error('Error loading addresses:', error)
      Alert.alert(i18n.t('common.error', 'Error'), i18n.t('addresses.loadError', 'Failed to load addresses'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddAddress = () => {
    // TODO: Navigate to add/edit address screen
    Alert.alert('Not implemented', 'Add address screen will be implemented')
  }

  const handleEditAddress = (address) => {
    // TODO: Navigate to edit address screen with address data
    Alert.alert('Not implemented', 'Edit address screen will be implemented', [
      { text: i18n.t('common.cancel', 'Cancel') },
      {
        text: i18n.t('common.edit', 'Edit'),
        onPress: () => {
          // navigation.navigate('EditAddress', { address })
        }
      }
    ])
  }

  const handleDeleteAddress = (address) => {
    Alert.alert(
      i18n.t('addresses.deleteConfirm', 'Delete Address'),
      i18n.t('addresses.deleteMessage', 'Are you sure you want to delete this address?'),
      [
        { text: i18n.t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Call delete API
              // await deleteUserAddress(user.id || user.userId, address.id)

              // Remove from local state
              setAddresses(prev => prev.filter(addr => addr.id !== address.id))

              Alert.alert(
                i18n.t('common.success', 'Success'),
                i18n.t('addresses.deleted', 'Address deleted successfully')
              )
            } catch (error) {
              console.error('Error deleting address:', error)
              Alert.alert(i18n.t('common.error', 'Error'), i18n.t('addresses.deleteError', 'Failed to delete address'))
            }
          }
        }
      ]
    )
  }

  const handleSetDefaultAddress = async (address) => {
    try {
      // TODO: Call set default API
      // await setDefaultAddress(user.id || user.userId, address.id)

      // Update local state
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr.id === address.id
      })))

      Alert.alert(
        i18n.t('common.success', 'Success'),
        i18n.t('addresses.setDefault', 'Address set as default successfully')
      )
    } catch (error) {
      console.error('Error setting default address:', error)
      Alert.alert(i18n.t('common.error', 'Error'), i18n.t('addresses.setDefaultError', 'Failed to set default address'))
    }
  }

  const getAddressTypeIcon = (type) => {
    switch (type) {
      case 'home':
        return 'home'
      case 'work':
        return 'briefcase'
      case 'other':
        return 'location'
      default:
        return 'location'
    }
  }

  const AddressItem = ({ address, index }) => (
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
              {address.name}
            </Text>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>
                  {i18n.t('addresses.default', 'Default')}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.addressText}>
            {address.address}
          </Text>
          <Text style={styles.addressText}>
            {address.city}, {address.postalCode}
          </Text>
          <Text style={styles.addressText}>
            {address.country}
          </Text>
        </View>
      </View>

      <View style={styles.addressActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditAddress(address)}
        >
          <Ionicons name="pencil" size={20} color={colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteAddress(address)}
        >
          <Ionicons name="trash" size={20} color={colors.error} />
        </TouchableOpacity>

        {!address.isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefaultAddress(address)}
          >
            <Ionicons name="star" size={20} color={colors.warning} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {i18n.t('common.loading', 'Loading...')}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.headerText}>
            {i18n.t('addresses.description', 'Manage your delivery addresses for faster ordering')}
          </Text>
        </View>

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={80} color={colors.text.secondary} />
            <Text style={styles.emptyStateTitle}>
              {i18n.t('addresses.noAddresses', 'No addresses yet')}
            </Text>
          <Text style={styles.emptyStateText}>
            {user.address && user.address.trim()
              ? i18n.t('addresses.addressFromProfile', 'Your profile address will be automatically added as your first delivery address')
              : i18n.t('addresses.addFirstAddress', 'Add your first delivery address to get started')
            }
          </Text>

            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={handleAddAddress}
            >
              <Ionicons name="add" size={20} color={colors.text.white} />
              <Text style={styles.addFirstButtonText}>
                {i18n.t('addresses.addAddress', 'Add Address')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.addressesContainer}>
            <FlatList
              data={addresses}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => <AddressItem address={item} index={index} />}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />

            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={handleAddAddress}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={styles.addMoreButtonText}>
                {i18n.t('addresses.addNewAddress', 'Add New Address')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipsHeader}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.tipsTitle}>
              {i18n.t('addresses.tips', 'Tips')}
            </Text>
          </View>

          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>
              • {i18n.t('addresses.tip1', 'Set a default address for faster checkout')}
            </Text>
            <Text style={styles.tipItem}>
              • {i18n.t('addresses.tip2', 'Add work and home addresses for convenience')}
            </Text>
            <Text style={styles.tipItem}>
              • {i18n.t('addresses.tip3', 'Keep addresses up to date for accurate delivery')}
            </Text>
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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
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
