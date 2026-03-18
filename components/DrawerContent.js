import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import React, { useState } from 'react'
import { Avatar, Divider } from 'react-native-elements'
import {
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem
} from '@react-navigation/drawer'
import { api } from '../api'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MaterialIcons } from '@expo/vector-icons'
import { colors } from '../global'
import i18n from '../lang/i18n'
import { useSelector } from 'react-redux'

export default function DrawerContent(props) {

    const [_isSignedIn, _setIsSignedIn] = useState(true)
    const { name, email, image } = useSelector((state) => state.userReducer)

    const navigation = useNavigation()

    const signOutUser = () => {
        AsyncStorage.getAllKeys().then(k => AsyncStorage.multiRemove(k))
        .then(()=>{
        api.logout();
        navigation.navigate('SignIn');
    })
        .catch((err) => console.error(err))
    }
  return (
    <SafeAreaView style={styles.container}>
        <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContainer}>
            {}
            <View style={styles.header}>
                <View style={styles.profileContainer}>
                    <Avatar
                        rounded
                        avatarStyle={styles.avatar}
                        size={60}
                        source={image ? {uri: image} : {uri: "https://cdn.pixabay.com/photo/2017/02/23/13/05/avatar-2092113_960_720.png"}}/>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{name || 'Utilisateur'}</Text>
                        <Text style={styles.userEmail}>{email || 'email@example.com'}</Text>
                    </View>
                </View>
                <Divider style={styles.divider} />
            </View>

            {}
            <View style={styles.menuContainer}>
                <DrawerItemList {...props} />
            </View>
        </DrawerContentScrollView>

        {}
        <View style={styles.footer}>
            <Divider style={styles.divider} />
            <DrawerItem
                label={i18n.t('drawer.logout')}
                labelStyle={styles.logoutLabel}
                icon={({ color: _color, size }) => (
                    <MaterialIcons
                        name="logout"
                        color={colors.error}
                        size={size}
                    />
                )}
                onPress={() => signOutUser()}
                style={styles.logoutItem}
            />
        </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
        paddingBottom: 20, 
    },
    scrollContainer: {
        flexGrow: 1,
    },
    header: {
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: colors.background.primary,
    },
    profileContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    avatar: {
        borderWidth: 3,
        borderColor: colors.primary,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    userInfo: {
        marginLeft: 12,
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text.primary,
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    divider: {
        backgroundColor: colors.border.light,
        height: 1,
        marginVertical: 8,
    },
    menuContainer: {
        flex: 1,
        paddingTop: 8,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
        backgroundColor: colors.background.primary,
        paddingBottom: 30, 
        paddingTop: 10,
    },
    logoutItem: {
        backgroundColor: 'transparent',
    },
    logoutLabel: {
        color: colors.error,
        fontWeight: '500',
    },
})