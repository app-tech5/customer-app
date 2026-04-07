import { View, Text, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons, MaterialIcons, FontAwesome, Entypo, Feather } from '@expo/vector-icons'
import { useSelector, useDispatch } from 'react-redux'
import i18n from '../lang/i18n'
import { config } from '../config'
import { colors } from '../global'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function Settings({ navigation }) {
  const dispatch = useDispatch()
  const { language } = useSelector((state) => state.settings || {})

  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [locationEnabled, setLocationEnabled] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(language || 'en')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const notifications = await AsyncStorage.getItem('notificationsEnabled')
      const location = await AsyncStorage.getItem('locationEnabled')
      const marketing = await AsyncStorage.getItem('marketingEmails')

      if (notifications !== null) setNotificationsEnabled(JSON.parse(notifications))
      if (location !== null) setLocationEnabled(JSON.parse(location))
      if (marketing !== null) setMarketingEmails(JSON.parse(marketing))
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving setting:', error)
    }
  }

  const handleLanguageChange = () => {
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'Français' }
    ]

    const currentIndex = languages.findIndex(lang => lang.code === currentLanguage)
    const nextIndex = (currentIndex + 1) % languages.length
    const nextLanguage = languages[nextIndex]

    Alert.alert(
      i18n.t('settings.changeLanguage', 'Change Language'),
      i18n.t('settings.languageChangeMessage', 'Change app language to {{language}}?', { language: nextLanguage.name }),
      [
        { text: i18n.t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: i18n.t('common.confirm', 'Confirm'),
          onPress: async () => {
            try {
              await AsyncStorage.setItem('language', nextLanguage.code)
              setCurrentLanguage(nextLanguage.code)
              
              dispatch({ type: 'SET_LANGUAGE', payload: nextLanguage.code })
              
              i18n.locale = nextLanguage.code

              Alert.alert(
                i18n.t('common.success', 'Success'),
                i18n.t('settings.languageChanged', 'Language changed successfully. Please restart the app for changes to take effect.')
              )
            } catch (error) {
              console.error('Error changing language:', error)
              Alert.alert(i18n.t('common.error', 'Error'), i18n.t('settings.languageChangeError', 'Failed to change language'))
            }
          }
        }
      ]
    )
  }

  const handleLogout = () => {
    Alert.alert(
      i18n.t('settings.logoutConfirm', 'Logout'),
      i18n.t('settings.logoutMessage', 'Are you sure you want to logout?'),
      [
        { text: i18n.t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: i18n.t('settings.logout', 'Logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              
              await AsyncStorage.removeItem('userToken')
              await AsyncStorage.removeItem('userData')
              
              dispatch({ type: 'LOGOUT' })
              
              Alert.alert(
                i18n.t('settings.loggedOut', 'Logged Out'),
                i18n.t('settings.loggedOutMessage', 'You have been successfully logged out')
              )
            } catch (error) {
              console.error('Error during logout:', error)
              Alert.alert(i18n.t('common.error', 'Error'), i18n.t('settings.logoutError', 'Failed to logout'))
            }
          }
        }
      ]
    )
  }

  const SettingItem = ({ icon, iconType, title, subtitle, rightComponent, onPress, showArrow = true }) => {
    const IconComponent = iconType === 'MaterialIcons' ? MaterialIcons :
                         iconType === 'FontAwesome' ? FontAwesome :
                         iconType === 'Entypo' ? Entypo :
                         iconType === 'Feather' ? Feather : Ionicons

    return (
      <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <IconComponent name={icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
          </View>
        </View>

        <View style={styles.settingRight}>
          {rightComponent}
          {showArrow && <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />}
        </View>
      </TouchableOpacity>
    )
  }

  const SettingSection = ({ title, children }) => (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      {children}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {}
        <SettingSection title={i18n.t('settings.account', 'Account')}>
          <SettingItem
            icon="person"
            iconType="MaterialIcons"
            title={i18n.t('profile.title', 'Profile')}
            subtitle={i18n.t('settings.manageProfile', 'Manage your profile information')}
            onPress={() => navigation.navigate('EditProfile')}
          />

          <SettingItem
            icon="card"
            iconType="MaterialIcons"
            title={i18n.t('drawer.wallet', 'Wallet')}
            subtitle={i18n.t('settings.manageWallet', 'Manage payment methods and balance')}
            onPress={() => navigation.navigate('WalletFlow', {
              screen: 'Wallet',
            })}
          />
        </SettingSection>

        {}
        <SettingSection title={i18n.t('settings.preferences', 'Preferences')}>
          <SettingItem
            icon="language"
            title={i18n.t('settings.language', 'Language')}
            subtitle={currentLanguage === 'en' ? 'English' : 'Français'}
            rightComponent={
              <TouchableOpacity onPress={handleLanguageChange} style={styles.languageButton}>
                <Text style={styles.languageText}>
                  {currentLanguage === 'en' ? 'EN' : 'FR'}
                </Text>
              </TouchableOpacity>
            }
            onPress={handleLanguageChange}
            showArrow={false}
          />

          <SettingItem
            icon="notifications"
            title={i18n.t('settings.notifications', 'Notifications')}
            subtitle={i18n.t('settings.notificationSettings', 'Configure push notifications')}
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => {
                  setNotificationsEnabled(value)
                  saveSetting('notificationsEnabled', value)
                }}
                trackColor={{ false: colors.grey[300], true: colors.primary + '50' }}
                thumbColor={notificationsEnabled ? colors.primary : colors.grey[400]}
              />
            }
            onPress={() => {
              
              Alert.alert('Not implemented', 'Detailed notification settings will be implemented')
            }}
            showArrow={false}
          />

          <SettingItem
            icon="location"
            title={i18n.t('settings.location', 'Location Services')}
            subtitle={i18n.t('settings.locationDescription', 'Allow access to location for better experience')}
            rightComponent={
              <Switch
                value={locationEnabled}
                onValueChange={(value) => {
                  setLocationEnabled(value)
                  saveSetting('locationEnabled', value)
                }}
                trackColor={{ false: colors.grey[300], true: colors.primary + '50' }}
                thumbColor={locationEnabled ? colors.primary : colors.grey[400]}
              />
            }
            showArrow={false}
          />
        </SettingSection>

        {}
        <SettingSection title={i18n.t('settings.privacySecurity', 'Privacy & Security')}>
          <SettingItem
            icon="lock-closed"
            title={i18n.t('settings.privacy', 'Privacy Policy')}
            subtitle={i18n.t('settings.privacyDescription', 'Read our privacy policy')}
            onPress={() => {
              
              Alert.alert('Not implemented', 'Privacy policy screen will be implemented')
            }}
          />

          <SettingItem
            icon="document-text"
            iconType="Ionicons"
            title={i18n.t('settings.terms', 'Terms of Service')}
            subtitle={i18n.t('settings.termsDescription', 'Read our terms and conditions')}
            onPress={() => {
              
              Alert.alert('Not implemented', 'Terms of service screen will be implemented')
            }}
          />

          <SettingItem
            icon="shield-checkmark"
            title={i18n.t('settings.dataPrivacy', 'Data & Privacy')}
            subtitle={i18n.t('settings.dataPrivacyDescription', 'Manage your data and privacy settings')}
            onPress={() => {
              
              Alert.alert('Not implemented', 'Data privacy settings will be implemented')
            }}
          />
        </SettingSection>

        {}
        <SettingSection title={i18n.t('settings.communication', 'Communication')}>
          <SettingItem
            icon="mail"
            title={i18n.t('settings.marketingEmails', 'Marketing Emails')}
            subtitle={i18n.t('settings.marketingEmailsDescription', 'Receive emails about offers and promotions')}
            rightComponent={
              <Switch
                value={marketingEmails}
                onValueChange={(value) => {
                  setMarketingEmails(value)
                  saveSetting('marketingEmails', value)
                }}
                trackColor={{ false: colors.grey[300], true: colors.primary + '50' }}
                thumbColor={marketingEmails ? colors.primary : colors.grey[400]}
              />
            }
            showArrow={false}
          />
        </SettingSection>

        {}
        <SettingSection title={i18n.t('profile.help', 'Help & Support')}>
          <SettingItem
            icon="help-circle"
            title={i18n.t('settings.help', 'Help Center')}
            subtitle={i18n.t('settings.helpDescription', 'Find answers to common questions')}
            onPress={() => {
              
              Alert.alert('Not implemented', 'Help center will be implemented')
            }}
          />

          <SettingItem
            icon="chatbubble-ellipses"
            title={i18n.t('settings.contactSupport', 'Contact Support')}
            subtitle={i18n.t('settings.contactSupportDescription', 'Get help from our support team')}
            onPress={() => {
              
              Alert.alert('Not implemented', 'Contact support will be implemented')
            }}
          />

          <SettingItem
            icon="star"
            title={i18n.t('settings.rateApp', 'Rate the App')}
            subtitle={i18n.t('settings.rateAppDescription', 'Rate us on the app store')}
            onPress={() => {
              
              Alert.alert('Not implemented', 'App rating will be implemented')
            }}
          />
        </SettingSection>

        {}
        <SettingSection title={i18n.t('profile.about', 'About')}>
          <SettingItem
            icon="information-circle"
            title={i18n.t('settings.aboutApp', 'About Good Food')}
            subtitle={`${i18n.t('settings.version', 'Version')} ${config.VERSION}`}
            onPress={() => {
              Alert.alert(
                i18n.t('profile.about', 'About'),
                `${i18n.t('app.name', 'Good Food')}\n${i18n.t('settings.version', 'Version')} ${config.VERSION}\n\n${i18n.t('settings.aboutDescription', 'Your favorite food delivery app')}`
              )
            }}
          />

          <SettingItem
            icon="logo-github"
            iconType="Ionicons"
            title={i18n.t('settings.openSource', 'Open Source')}
            subtitle={i18n.t('settings.openSourceDescription', 'View our open source code')}
            onPress={() => {
              
              Alert.alert('Not implemented', 'GitHub link will be implemented')
            }}
          />
        </SettingSection>

        {}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color={colors.error} />
            <Text style={styles.logoutText}>
              {i18n.t('drawer.logout', 'Logout')}
            </Text>
          </TouchableOpacity>
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
  section: {
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.white,
    textTransform: 'uppercase',
  },
  logoutSection: {
    margin: 20,
    marginTop: 0,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
})
