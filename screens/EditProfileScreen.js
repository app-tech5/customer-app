import { View, Text, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Ionicons, MaterialIcons, Entypo, FontAwesome } from '@expo/vector-icons'
import { useSelector, useDispatch } from 'react-redux'
import { userInfos, updateUser, uploadPublicFile } from '../api'
import i18n from '../lang/i18n'
import { colors } from '../global'
import { config, PUBLIC_UPLOAD_FOLDERS } from '../config'
import { pickImageFromLibrary, pickImageFromCamera } from '../utils/pickImage'
import Loader from './Loader'

export default function EditProfileScreen({ navigation }) {
  const user = useSelector((state) => state.userReducer)
  const dispatch = useDispatch()

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    image: ''
  })

  const [originalData, setOriginalData] = useState({})
  const [loader, setLoader] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState(null)

  const userDataRef = useRef(userData)
  const originalDataRef = useRef(originalData)
  const userRef = useRef(user)
  userDataRef.current = userData
  originalDataRef.current = originalData
  userRef.current = user

  const userId = user.id || user.userId

  const loadUserData = useCallback(async () => {
    try {
      setLoader(true)
      setError(null)
      
      let data
      const fallback = userRef.current

      try {
        data = await userInfos(userId)
      } catch (apiError) {
        console.warn('API error, using Redux store data:', apiError)
        data = fallback
      }

      const userInfo = {
        name: data.name || fallback.name || '',
        email: data.email || fallback.email || '',
        phone: data.phone || fallback.phone || '',
        address: data.address || fallback.address || '',
        image: data.image || fallback.image || '',
      }

      setUserData(userInfo)
      setOriginalData(userInfo)
    } catch (err) {
      console.error('Error loading user data:', err)
      setError(i18n.t('profile.loadError', 'Error loading profile'))
    } finally {
      setLoader(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadUserData()
    }
  }, [userId, loadUserData])

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = useCallback((data) => {
    const { name, email, phone } = data

    if (!String(name || '').trim()) {
      Alert.alert(i18n.t('common.error', 'Error'), i18n.t('profile.nameRequired', 'Name is required'))
      return false
    }

    if (!String(email || '').trim()) {
      Alert.alert(i18n.t('common.error', 'Error'), i18n.t('profile.emailRequired', 'Email is required'))
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert(i18n.t('common.error', 'Error'), i18n.t('profile.invalidEmail', 'Invalid email format'))
      return false
    }

    if (!String(phone || '').trim()) {
      Alert.alert(i18n.t('common.error', 'Error'), i18n.t('profile.phoneRequired', 'Phone number is required'))
      return false
    }

    return true
  }, [])

  const handleSave = useCallback(async () => {
    const currentUserData = userDataRef.current
    const currentOriginal = originalDataRef.current

    if (JSON.stringify(currentUserData) === JSON.stringify(currentOriginal)) {
      Alert.alert(i18n.t('common.info', 'Info'), i18n.t('profile.noChanges', 'No changes to save'))
      return
    }

    if (!validateForm(currentUserData)) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      if (!userId) {
        throw new Error('User ID not found')
      }
      
      const updateData = {}
      const dataToSave = { ...currentUserData }

      if (
        dataToSave.image?.startsWith('file://') ||
        dataToSave.image?.startsWith('content://')
      ) {
        dataToSave.image = await uploadPublicFile(
          {
            uri: dataToSave.image,
            mimeType: 'image/jpeg',
            fileName: 'upload.jpg',
          },
          PUBLIC_UPLOAD_FOLDERS.AVATARS
        )
        setUserData(dataToSave)
      }

      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] !== currentOriginal[key]) {
          updateData[key] = dataToSave[key]
        }
      })

      await updateUser(updateData, userId)
      
      dispatch({ type: 'UPDATE_USER', payload: dataToSave })
      
      const saved = { ...dataToSave }
      setOriginalData(saved)
      originalDataRef.current = saved

      Alert.alert(
        i18n.t('profile.updateSuccess', 'Success'),
        i18n.t('profile.updateSuccessMessage', 'Profile updated successfully'),
        [
          {
            text: i18n.t('common.ok', 'OK'),
            onPress: () => navigation.goBack()
          }
        ]
      )
    } catch (err) {
      console.error('Error updating profile:', err)
      Alert.alert(
        i18n.t('profile.updateError', 'Error'),
        i18n.t('profile.updateErrorMessage', 'Failed to update profile. Please try again.')
      )
    } finally {
      setSaving(false)
    }
  }, [userId, dispatch, navigation, validateForm])

  const handleGoBack = useCallback(() => {
    const hasChanges =
      JSON.stringify(userDataRef.current) !== JSON.stringify(originalDataRef.current)

    if (hasChanges) {
      Alert.alert(
        i18n.t('profile.unsavedChanges', 'Unsaved Changes'),
        i18n.t('profile.unsavedChangesMessage', 'You have unsaved changes. Do you want to save them before leaving?'),
        [
          {
            text: i18n.t('common.cancel', 'Cancel'),
            style: 'cancel'
          },
          {
            text: i18n.t('profile.discard', 'Discard'),
            style: 'destructive',
            onPress: () => navigation.goBack()
          },
          {
            text: i18n.t('common.save', 'Save'),
            onPress: handleSave
          }
        ]
      )
    } else {
      navigation.goBack()
    }
  }, [navigation, handleSave])

  useEffect(() => {
    navigation.setOptions({
      title: i18n.t('profile.edit', 'Edit Profile'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleGoBack}
          style={{ padding: 10, marginLeft: 5 }}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('common.goBack')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          style={{ padding: 10, marginRight: 5 }}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('profile.saveChanges')}
          disabled={saving}
        >
          <Ionicons name="checkmark" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    })
  }, [navigation, handleSave, handleGoBack, saving])

  const processPickedImage = async (asset) => {
    if (!asset) return

    setUserData((prev) => ({ ...prev, image: asset.uri }))
    setUploadingAvatar(true)

    try {
      const url = await uploadPublicFile(asset, PUBLIC_UPLOAD_FOLDERS.AVATARS)
      setUserData((prev) => ({ ...prev, image: url }))
    } catch (err) {
      console.error('Photo upload error:', err)
      setUserData((prev) => ({ ...prev, image: originalData.image }))
      Alert.alert(
        i18n.t('profile.updateError', 'Error'),
        i18n.t('profile.uploadError', 'Failed to upload photo. Please try again.')
      )
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handlePickFromCamera = async () => {
    try {
      const asset = await pickImageFromCamera()
      await processPickedImage(asset)
    } catch (err) {
      console.error('Camera error:', err)
      Alert.alert(
        i18n.t('common.error', 'Error'),
        err.message || i18n.t('profile.uploadError', 'Failed to upload photo. Please try again.')
      )
    }
  }

  const handlePickFromGallery = async () => {
    try {
      const asset = await pickImageFromLibrary()
      await processPickedImage(asset)
    } catch (err) {
      console.error('Gallery error:', err)
      Alert.alert(
        i18n.t('common.error', 'Error'),
        err.message || i18n.t('profile.uploadError', 'Failed to upload photo. Please try again.')
      )
    }
  }

  const handleAvatarChange = () => {
    if (uploadingAvatar) return

    Alert.alert(
      i18n.t('profile.changePhoto', 'Change Photo'),
      i18n.t('profile.changePhotoMessage', 'Choose how you want to change your profile photo'),
      [
        {
          text: i18n.t('profile.takePhoto', 'Take Photo'),
          onPress: handlePickFromCamera,
        },
        {
          text: i18n.t('profile.chooseFromGallery', 'Choose from Gallery'),
          onPress: handlePickFromGallery,
        },
        {
          text: i18n.t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
      ]
    )
  }

  if (loader) return <Loader />

  if (error && !userData.name) {
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: userData.image || config.assetUrls.placeholder.profileAvatar120 }}
                style={styles.avatar}
                resizeMode="cover"
              />
              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color={colors.text.white} />
                </View>
              )}
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={handleAvatarChange}
                disabled={uploadingAvatar}
              >
                <Ionicons name="camera" size={16} color={colors.text.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHint}>
              {i18n.t('profile.tapToChangePhoto', 'Tap to change profile photo')}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <ProfileFormField
              icon="person"
              iconType="MaterialIcons"
              label={i18n.t('profile.name', 'Name')}
              value={userData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder={i18n.t('profile.namePlaceholder', 'Enter your full name')}
            />

            <ProfileFormField
              icon="email"
              iconType="Entypo"
              label={i18n.t('profile.email', 'Email')}
              value={userData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder={i18n.t('profile.emailPlaceholder', 'Enter your email address')}
              keyboardType="email-address"
            />

            <ProfileFormField
              icon="phone"
              iconType="Entypo"
              label={i18n.t('profile.phone', 'Phone')}
              value={userData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder={i18n.t('profile.phonePlaceholder', 'Enter your phone number')}
              keyboardType="phone-pad"
            />

            <ProfileFormField
              icon="location"
              label={i18n.t('profile.address', 'Address')}
              value={userData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              placeholder={i18n.t('profile.addressPlaceholder', 'Enter your delivery address')}
            />
          </View>

          {JSON.stringify(userData) !== JSON.stringify(originalData) && (
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader size="small" color={colors.text.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={colors.text.white} />
                    <Text style={styles.saveButtonText}>
                      {i18n.t('profile.saveChanges', 'Save Changes')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: colors.background.primary,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
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
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
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
  avatarHint: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formField: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputDisabled: {
    backgroundColor: colors.grey[100],
    borderColor: colors.border.light,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  textInputDisabled: {
    color: colors.text.secondary,
  },
  saveButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.white,
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

function ProfileFormField({
  icon,
  iconType,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  editable = true,
}) {
  const IconComponent =
    iconType === 'MaterialIcons' ? MaterialIcons :
    iconType === 'Entypo' ? Entypo :
    iconType === 'FontAwesome' ? FontAwesome : Ionicons

  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputContainer, !editable && styles.inputDisabled]}>
        <View style={styles.inputIcon}>
          <IconComponent
            name={icon}
            size={20}
            color={editable ? colors.primary : colors.text.secondary}
          />
        </View>
        <TextInput
          style={[styles.textInput, !editable && styles.textInputDisabled]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.secondary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={editable}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          autoCorrect={false}
        />
      </View>
    </View>
  )
}

