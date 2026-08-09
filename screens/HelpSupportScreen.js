import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import i18n from '../lang/i18n'
import { colors } from '../global'
import { useSettings } from '../contexts/SettingContext'

const FAQ_KEYS = ['faq1', 'faq2', 'faq3', 'faq4']

export default function HelpSupportScreen({ navigation }) {
  const { supportEmail } = useSettings()
  const [expandedKey, setExpandedKey] = useState(null)

  useEffect(() => {
    navigation.setOptions({
      title: i18n.t('help.title'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('common.back')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  const toggleFaq = (key) => {
    setExpandedKey((current) => (current === key ? null : key))
  }

  const handleContactSupport = async () => {
    if (!supportEmail?.trim()) {
      Alert.alert(i18n.t('common.error'), i18n.t('help.contactUnavailable'))
      return
    }

    const url = `mailto:${supportEmail.trim()}?subject=${encodeURIComponent(i18n.t('help.emailSubject'))}`
    try {
      const canOpen = await Linking.canOpenURL(url)
      if (!canOpen) {
        throw new Error('Cannot open mail client')
      }
      await Linking.openURL(url)
    } catch (error) {
      console.error('Error opening email:', error)
      Alert.alert(i18n.t('common.error'), i18n.t('help.emailError'))
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="help-buoy" size={32} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>{i18n.t('help.title')}</Text>
          <Text style={styles.heroText}>{i18n.t('help.intro')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{i18n.t('help.faqSection')}</Text>

        {FAQ_KEYS.map((key) => {
          const isExpanded = expandedKey === key
          return (
            <TouchableOpacity
              key={key}
              style={styles.faqCard}
              onPress={() => toggleFaq(key)}
              activeOpacity={0.8}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{i18n.t(`help.${key}q`)}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.text.secondary}
                />
              </View>
              {isExpanded && (
                <Text style={styles.faqAnswer}>{i18n.t(`help.${key}a`)}</Text>
              )}
            </TouchableOpacity>
          )
        })}

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>{i18n.t('help.contactTitle')}</Text>
          <Text style={styles.contactDescription}>{i18n.t('help.contactDescription')}</Text>
          {supportEmail ? (
            <>
              <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
                <Ionicons name="mail-outline" size={20} color={colors.text.white} />
                <Text style={styles.contactButtonText}>{i18n.t('help.contactButton')}</Text>
              </TouchableOpacity>
              <Text style={styles.contactEmail}>{supportEmail}</Text>
            </>
          ) : (
            <Text style={styles.contactUnavailable}>{i18n.t('help.contactUnavailable')}</Text>
          )}
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
  headerButton: {
    padding: 10,
    marginLeft: 5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  faqCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 21,
    marginTop: 12,
  },
  contactCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    marginTop: 14,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  contactDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 21,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.white,
  },
  contactEmail: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 12,
  },
  contactUnavailable: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
  },
})
