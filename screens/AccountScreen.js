import { View, Text, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Ionicons, MaterialIcons, FontAwesome, Entypo } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { api, userInfos, updateUser, getOrders } from '../api'
import { SignInContext } from '../contexts/authContext'
import i18n, { resetLanguageAfterLogout } from '../lang/i18n'
import { colors } from '../global'
import { config } from '../config'
import { navigateToTabOrders } from '../navigation/navigationHelpers'
import Loader from './Loader'
import { RefreshControl } from 'react-native'

export default function AccountScreen({ navigation }) {
  const dispatch = useDispatch()
  const { setSignedIn } = useContext(SignInContext)
  const user = useSelector((state) => state.userReducer)
  const [userData, setUserData] = useState(null)
  const [totalOrders, setTotalOrders] = useState(0)
  const [loader, setLoader] = useState(true)
  const [error, setError] = useState(null)
  const isFirstLoad = useRef(true)
  const userRef = useRef(user)
  userRef.current = user

  const userId = user.id || user.userId

  const loadUserData = useCallback(async () => {
    if (!userId) {
      setLoader(false)
      return
    }

    const fallback = userRef.current

    try {
      if (isFirstLoad.current) {
        setLoader(true)
      }
      setError(null)

      const [userInfo, ordersData] = await Promise.all([
        userInfos(userId).catch(() => fallback),
        getOrders().catch(() => []),
      ])

      setUserData({ ...fallback, ...userInfo })
      setTotalOrders(ordersData?.length || 0)
    } catch (err) {
      console.error('Error loading user data:', err)
      setError(i18n.t('profile.loadError'))
      setUserData(fallback)
      setTotalOrders(0)
    } finally {
      setLoader(false)
      isFirstLoad.current = false
    }
  }, [userId])

  useFocusEffect(
    useCallback(() => {
      if (!userId) return
      loadUserData()
    }, [userId, loadUserData])
  )

  useEffect(() => {
    navigation.setOptions({
      title: i18n.t('profile.title'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.toggleDrawer()}
          style={{ padding: 10, marginLeft: 5 }}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('common.openMenu')}
        >
          <Ionicons name="menu" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  const handleLogout = () => {
    Alert.alert(
      i18n.t('profile.logoutConfirm'),
      i18n.t('profile.logoutMessage'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.logout()
              setSignedIn(null)
              dispatch({ type: 'CLEAR' })
              dispatch({ type: 'LOGOUT_USER' })
              await resetLanguageAfterLogout({ reloadIfNeeded: true })
            } catch (err) {
              console.error('Error during logout:', err)
              Alert.alert(i18n.t('common.error'), i18n.t('profile.logoutError'))
            }
          },
        },
      ]
    )
  }

  const handleUpdateProfile = async (field, value) => {
    try {
      const updateData = { [field]: value }
      await updateUser(updateData, user.id || user.userId)
      
      setUserData(prev => ({ ...prev, [field]: value }))

      Alert.alert(
        i18n.t('profile.updateSuccess'),
        i18n.t('profile.updateSuccessMessage')
      )
    } catch (err) {
      console.error('Error updating profile:', err)
      Alert.alert(
        i18n.t('profile.updateError'),
        i18n.t('profile.updateErrorMessage')
      )
    }
  }

  const ProfileHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: userData?.image || config.assetUrls.placeholder.profileAvatar120 }}
          style={styles.avatar}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.editAvatarButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="camera" size={16} color={colors.text.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{userData?.name || i18n.t('profile.defaultUserName')}</Text>
        <Text style={styles.userEmail}>{userData?.email || ''}</Text>
        <Text style={styles.userPhone}>{userData?.phone || ''}</Text>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Ionicons name="pencil" size={16} color={colors.primary} />
        <Text style={styles.editButtonText}>
          {i18n.t('profile.edit')}
        </Text>
      </TouchableOpacity>
    </View>
  )

  const StatsSection = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>
        {i18n.t('profile.activity')}
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
            {i18n.t('profile.totalOrders')}
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
            {i18n.t('profile.favorites')}
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
            {i18n.t('profile.rating')}
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
        {i18n.t('profile.account')}
      </Text>

      <MenuItem
        icon="receipt"
        title={i18n.t('drawer.myOrders')}
        subtitle={i18n.t('profile.viewOrderHistory')}
        onPress={() => navigateToTabOrders(navigation)}
      />

      <MenuItem
        icon="heart"
        title={i18n.t('drawer.favorites')}
        subtitle={i18n.t('profile.manageFavorites')}
        onPress={() => navigation.navigate('Favorites')}
      />

      <MenuItem
        icon="wallet-outline"
        title={i18n.t('drawer.wallet')}
        subtitle={i18n.t('profile.managePayments')}
        onPress={() => navigation.navigate('WalletFlow', {
          screen: 'Wallet',
        })}
      />

      <MenuItem
        icon="diamond-outline"
        title={i18n.t('subscription.title')}
        subtitle={i18n.t('subscription.menuSubtitle')}
        onPress={() => navigation.navigate('Subscriptions')}
      />

      <MenuItem
        icon="location"
        title={i18n.t('addresses.title')}
        subtitle={i18n.t('profile.manageAddresses')}
        onPress={() => navigation.navigate('AddressesScreen')}
      />

      <MenuItem
        icon="notifications"
        title={i18n.t('profile.notifications')}
        subtitle={i18n.t('profile.notificationSettings')}
        onPress={() => {
          
          Alert.alert(i18n.t('common.notImplemented'), i18n.t('profile.notificationsScreenMessage'))
        }}
      />

      <MenuItem
        icon="settings"
        title={i18n.t('drawer.settings')}
        subtitle={i18n.t('profile.appSettings')}
        onPress={() => navigation.navigate('Settings')}
      />

      <MenuItem
        icon="help-circle"
        title={i18n.t('profile.help')}
        subtitle={i18n.t('profile.getHelp')}
        onPress={() => navigation.navigate('HelpSupport')}
      />

      <MenuItem
        icon="information-circle"
        title={i18n.t('profile.about')}
        subtitle={i18n.t('profile.appInfo')}
        onPress={() => navigation.navigate('About')}
      />

      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color={colors.error} />
          <Text style={styles.logoutText}>
            {i18n.t('profile.logout')}
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
            {i18n.t('profile.errorTitle')}
          </Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadUserData}
          >
            <Ionicons name="refresh" size={20} color={colors.text.white} />
            <Text style={styles.retryButtonText}>
              {i18n.t('common.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loader} onRefresh={loadUserData} />}
      >
        <ProfileHeader />
        <StatsSection />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 96,
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