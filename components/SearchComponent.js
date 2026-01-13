import React, { useState, useRef } from "react";
import { StyleSheet, TextInput, View, Keyboard, Animated, TouchableOpacity, Dimensions } from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { colors } from '../global';
import i18n from '../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SearchComponent = ({clicked, searchPhrase, setSearchPhrase, setCLicked, onSubmit}) => {
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    setCLicked(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      })
    ]).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!searchPhrase.trim()) {
      setCLicked(false);
    }
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(borderAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      })
    ]).start();
  };

  const handleClear = () => {
    setSearchPhrase("");
    if (!isFocused) {
      Keyboard.dismiss();
      setCLicked(false);
    }
  };

  const handleSubmit = () => {
    if (searchPhrase.trim() && onSubmit) {
      onSubmit(searchPhrase.trim());
      Keyboard.dismiss();
    }
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border.medium, colors.primary],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.searchContainer,
          {
            transform: [{ scale: scaleAnim }],
            borderColor: borderColor,
          }
        ]}
      >
        {/* Icône de recherche */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="search"
            size={22}
            color={isFocused ? colors.primary : colors.grey[500]}
          />
        </View>

        {/* Champ de saisie */}
        <TextInput
          style={styles.input}
          placeholder={i18n.t('home.searchPlaceholder')}
          placeholderTextColor={colors.grey[400]}
          value={searchPhrase}
          onChangeText={setSearchPhrase}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={colors.primary}
          maxLength={50}
        />

        {/* Actions à droite */}
        <View style={styles.actionsContainer}>
          {/* Bouton clear si il y a du texte */}
          {searchPhrase.length > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="clear"
                size={20}
                color={colors.grey[500]}
              />
            </TouchableOpacity>
          )}

          {/* Indicateur de focus */}
          {isFocused && (
            <View style={[styles.focusIndicator, { backgroundColor: colors.primary }]} />
          )}
        </View>
      </Animated.View>

      {/* Suggestions rapides (quand vide et focus) */}
      {isFocused && !searchPhrase.trim() && (
        <Animated.View
          style={styles.quickSuggestions}
          entering={Animated.fadeInDown.duration(200)}
          exiting={Animated.fadeOutUp.duration(150)}
        >
          <TouchableOpacity style={styles.suggestionItem}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.suggestionText}>Near me</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionItem}>
            <Ionicons name="star" size={16} color={colors.primary} />
            <Text style={styles.suggestionText}>Top rated</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};
export default SearchComponent;


const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - 80, // Largeur adaptative
    position: 'relative',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border.medium,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    paddingVertical: 0, // Évite le padding double
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
    marginLeft: 4,
  },
  focusIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: 8,
  },
  quickSuggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
});














































   















































































