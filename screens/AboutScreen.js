import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import React, { useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import i18n from '../lang/i18n'
import { colors } from '../global'
import { config } from '../config'

export default function AboutScreen({ navigation }) {
  useEffect(() => {
    navigation.setOptions({
      title: i18n.t('about.title'),
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Ionicons name="restaurant" size={36} color={colors.primary} />
          </View>
          <Text style={styles.appName}>{i18n.t('app.name')}</Text>
          <Text style={styles.tagline}>{i18n.t('about.tagline')}</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionLabel}>
              {i18n.t('about.versionLabel')} {config.VERSION}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{i18n.t('about.descriptionTitle')}</Text>
          <Text style={styles.cardText}>{i18n.t('about.description')}</Text>
        </View>

        <View style={styles.card}>
          <InfoRow icon="fast-food-outline" label={i18n.t('about.featureOrders')} />
          <InfoRow icon="location-outline" label={i18n.t('about.featureTracking')} />
          <InfoRow icon="wallet-outline" label={i18n.t('about.featurePayments')} />
        </View>

        <Text style={styles.footer}>{i18n.t('about.footer')}</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function InfoRow({ icon, label }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
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
    padding: 28,
    marginBottom: 20,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  versionBadge: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  versionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  footer: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
})
