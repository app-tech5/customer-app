import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '../lang/i18n'
import { colors } from '../global'
import SearchBar from '../components/home/SearchBar'
import { geocodeAddress } from '../utils/geocodeAddress'
import { updateUser } from '../api'
import Loader from './Loader'

export default function EditAddressScreen({ navigation, route }) {
  const user = useSelector((state) => state.userReducer)
  const dispatch = useDispatch()
  const isEdit = route?.params?.mode === 'edit'
  const [address, setAddress] = useState(route?.params?.initialAddress || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? i18n.t('addresses.editAddress') : i18n.t('addresses.addAddress'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, marginLeft: 5 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
    })
  }, [navigation, isEdit])

  const handleSave = async () => {
    const normalizedAddress =
      typeof address === 'string' ? address.trim() : (address?.description || '').trim()

    if (!normalizedAddress) {
      Alert.alert(i18n.t('common.error'), i18n.t('addresses.addressRequired'))
      return
    }

    const userId = user.id || user.userId
    if (!userId) {
      Alert.alert(i18n.t('common.error'), i18n.t('addresses.updateError'))
      return
    }

    setSaving(true)
    try {
      let lat = Number(user.location?.latitude)
      let lng = Number(user.location?.longitude)

      const geocoded = await geocodeAddress(normalizedAddress)
      if (geocoded) {
        lat = geocoded.lat
        lng = geocoded.lng
      }

      const updateData = {
        address: normalizedAddress,
        location: {
          latitude: Number.isFinite(lat) ? lat : 0,
          longitude: Number.isFinite(lng) ? lng : 0,
        },
      }

      const updatedUser = await updateUser(updateData, userId)

      const location = updatedUser.location ?? updateData.location
      const latitude = Number(location?.latitude) || 0
      const longitude = Number(location?.longitude) || 0
      const payload = {
        address: updatedUser.address ?? normalizedAddress,
        location: { latitude, longitude },
        lat: latitude,
        lng: longitude,
      }

      dispatch({ type: 'UPDATE_USER', payload })

      await AsyncStorage.setItem(
        'userData',
        JSON.stringify({ ...user, ...updatedUser, ...payload, userId })
      )

      Alert.alert(i18n.t('common.success'), i18n.t('addresses.updated'), [
        { text: i18n.t('common.ok'), onPress: () => navigation.goBack() },
      ])
    } catch (error) {
      console.error('Error updating address:', error)
      Alert.alert(i18n.t('common.error'), i18n.t('addresses.updateError'))
    } finally {
      setSaving(false)
    }
  }

  if (saving) {
    return <Loader />
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.label}>{i18n.t('profile.address')}</Text>
        <SearchBar
          style={{
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.border.light,
            borderBottomWidth: 1,
          }}
          initialValue={route?.params?.initialAddress || ''}
          setAddress={setAddress}
        />

        <TouchableOpacity onPress={handleSave}>
          <LinearGradient colors={['#948E99', '#2E1437']} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>{i18n.t('common.save')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 40,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
})
