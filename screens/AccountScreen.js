import { View, Text, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons, MaterialIcons, FontAwesome, Entypo } from '@expo/vector-icons'
import { useSelector } from 'react-redux'
import { userInfos, updateUser, getOrders } from '../api'
import i18n from '../i18n'
import { colors } from '../global'
import Loader from './Loader'

export default function AccountScreen({ navigation }) {
  const user = useSelector((state) => state.userReducer)
  const [userData, setUserData] = useState(null)
  const [totalOrders, setTotalOrders] = useState(0)
  const [loader, setLoader] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadUserData()

    // Configurer le header avec le menu hamburger
    navigation.setOptions({
      title: i18n.t('profile.title', 'Profile'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.toggleDrawer()}
          style={{ padding: 10, marginLeft: 5 }}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  const loadUserData = async () => {
    try {
      setLoader(true)
      setError(null)

      // Charger les informations utilisateur et les commandes en parallèle
      const [userInfo, ordersData] = await Promise.all([
        userInfos(user.id || user.userId).catch(() => user), // Fallback to Redux store
        getOrders().catch(() => []) // Fallback to empty array
      ])

      setUserData(userInfo)
      setTotalOrders(ordersData?.length || 0)
    } catch (err) {
      console.error('Error loading user data:', err)
      setError(i18n.t('profile.loadError', 'Error loading profile'))
      // Utiliser les données du Redux store comme fallback
      setUserData(user)
      setTotalOrders(0)
    } finally {
      setLoader(false)
    }
  }

  const handleUpdateProfile = async (field, value) => {
    try {
      const updateData = { [field]: value }
      await updateUser(updateData, user.id || user.userId)

      // Mettre à jour les données locales
      setUserData(prev => ({ ...prev, [field]: value }))

      Alert.alert(
        i18n.t('profile.updateSuccess', 'Success'),
        i18n.t('profile.updateSuccessMessage', 'Profile updated successfully')
      )
    } catch (err) {
      console.error('Error updating profile:', err)
      Alert.alert(
        i18n.t('profile.updateError', 'Error'),
        i18n.t('profile.updateErrorMessage', 'Failed to update profile')
      )
    }
  }

  const ProfileHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: userData?.image || 'https://via.placeholder.com/120x120' }}
          style={styles.avatar}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.editAvatarButton}
          onPress={() => {
            // TODO: Implement image picker
            Alert.alert('Not implemented', 'Avatar change will be implemented')
          }}
        >
          <Ionicons name="camera" size={16} color={colors.text.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{userData?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{userData?.email || ''}</Text>
        <Text style={styles.userPhone}>{userData?.phone || ''}</Text>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Ionicons name="pencil" size={16} color={colors.primary} />
        <Text style={styles.editButtonText}>
          {i18n.t('profile.edit', 'Edit Profile')}
        </Text>
      </TouchableOpacity>
    </View>
  )

  const StatsSection = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>
        {i18n.t('profile.activity', 'Activity')}
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Ionicons name="receipt" size={24} color={colors.primary} />
          </View>
          <Text style={styles.statNumber}>
            {totalOrders}
          </Text>
          <Text style={styles.statLabel}>
            {i18n.t('profile.totalOrders', 'Total Orders')}
          </Text>
        </View>

        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Ionicons name="heart" size={24} color={colors.error} />
          </View>
          <Text style={styles.statNumber}>
            {userData?.favorites?.length || 0}
          </Text>
          <Text style={styles.statLabel}>
            {i18n.t('profile.favorites', 'Favorites')}
          </Text>
        </View>

        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Ionicons name="star" size={24} color={colors.accent} />
          </View>
          <Text style={styles.statNumber}>
            {userData?.ratings?.asCustomer?.toFixed(1) || '0.0'}
          </Text>
          <Text style={styles.statLabel}>
            {i18n.t('profile.rating', 'Rating')}
          </Text>
        </View>
      </View>
    </View>
  )

  const MenuItem = ({ icon, iconType, title, subtitle, onPress, showArrow = true }) => {
    const IconComponent = iconType === 'MaterialIcons' ? MaterialIcons :
                         iconType === 'FontAwesome' ? FontAwesome :
                         iconType === 'Entypo' ? Entypo : Ionicons

    return (
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIcon}>
            <IconComponent name={icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>{title}</Text>
            {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        {showArrow && <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />}
      </TouchableOpacity>
    )
  }

  const MenuSection = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.sectionTitle}>
        {i18n.t('profile.account', 'Account')}
      </Text>

      <MenuItem
        icon="receipt"
        title={i18n.t('drawer.myOrders', 'My Orders')}
        subtitle={i18n.t('profile.viewOrderHistory', 'View your order history')}
        onPress={() => navigation.navigate('Orders')}
      />

      <MenuItem
        icon="heart"
        title={i18n.t('drawer.favorites', 'Favorites')}
        subtitle={i18n.t('profile.manageFavorites', 'Manage your favorite restaurants')}
        onPress={() => {
          // TODO: Navigate to favorites screen
          Alert.alert('Not implemented', 'Favorites screen will be implemented')
        }}
      />

      <MenuItem
        icon="card"
        iconType="MaterialIcons"
        title={i18n.t('drawer.wallet', 'Wallet')}
        subtitle={i18n.t('profile.managePayments', 'Manage payment methods')}
        onPress={() => navigation.navigate('WalletScreen')}
      />

      <MenuItem
        icon="location"
        title={i18n.t('addresses.title', 'Addresses')}
        subtitle={i18n.t('profile.manageAddresses', 'Manage delivery addresses')}
        onPress={() => navigation.navigate('AddressesScreen')}
      />

      <MenuItem
        icon="notifications"
        title={i18n.t('profile.notifications', 'Notifications')}
        subtitle={i18n.t('profile.notificationSettings', 'Configure notifications')}
        onPress={() => {
          // TODO: Navigate to notifications settings
          Alert.alert('Not implemented', 'Notifications screen will be implemented')
        }}
      />

      <MenuItem
        icon="settings"
        title={i18n.t('drawer.settings', 'Settings')}
        subtitle={i18n.t('profile.appSettings', 'App preferences and settings')}
        onPress={() => navigation.navigate('Settings')}
      />

      <MenuItem
        icon="help-circle"
        title={i18n.t('profile.help', 'Help & Support')}
        subtitle={i18n.t('profile.getHelp', 'Get help and contact support')}
        onPress={() => {
          // TODO: Navigate to help screen
          Alert.alert('Not implemented', 'Help screen will be implemented')
        }}
      />

      <MenuItem
        icon="information-circle"
        title={i18n.t('profile.about', 'About')}
        subtitle={i18n.t('profile.appInfo', 'App version and information')}
        onPress={() => {
          // TODO: Navigate to about screen
          Alert.alert(
            i18n.t('profile.about', 'About'),
            `${i18n.t('app.name', 'Good Food')}\n${i18n.t('settings.version', 'Version')} ${i18n.t('app.version', '1.0.0')}`
          )
        }}
      />

      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              i18n.t('settings.logoutConfirm', 'Logout'),
              i18n.t('profile.logoutMessage', 'Are you sure you want to logout?'),
              [
                { text: i18n.t('common.cancel', 'Cancel'), style: 'cancel' },
                {
                  text: i18n.t('drawer.logout', 'Logout'),
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implement logout
                    Alert.alert('Not implemented', 'Logout functionality will be implemented')
                  }
                }
              ]
            )
          }}
        >
          <Ionicons name="log-out" size={20} color={colors.error} />
          <Text style={styles.logoutText}>
            {i18n.t('drawer.logout', 'Logout')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loader) return <Loader />

  if (error && !userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={80} color={colors.error} />
          <Text style={styles.errorTitle}>
            {i18n.t('profile.errorTitle', 'Unable to load profile')}
          </Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadUserData}
          >
            <Ionicons name="refresh" size={20} color={colors.text.white} />
            <Text style={styles.retryButtonText}>
              {i18n.t('common.retry', 'Retry')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ProfileHeader />

        {/* Statistics */}
        <StatsSection />

        {/* Menu Items */}
        <MenuSection />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  headerContainer: {
    backgroundColor: colors.background.primary,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  statsContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuContainer: {
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  logoutContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
})