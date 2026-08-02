import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, TextInput, View, Keyboard, Animated, TouchableOpacity, Dimensions, Text } from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { colors } from '../global';
import i18n from '../lang/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SearchComponent = ({clicked, searchPhrase, setSearchPhrase, setCLicked, onSubmit}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const suggestionsOpacity = useRef(new Animated.Value(0)).current;
  const suggestionsTranslateY = useRef(new Animated.Value(-10)).current;
  
  useEffect(() => {
    if (searchPhrase.trim() && showSuggestions) {
      animateSuggestions(false);
    } else if (!searchPhrase.trim() && isFocused && !showSuggestions) {
      animateSuggestions(true);
    }
  }, [searchPhrase, isFocused]);

  const animateSuggestions = (show) => {
    const toValue = show ? 1 : 0;
    const translateValue = show ? 0 : -10;

    Animated.parallel([
      Animated.timing(suggestionsOpacity, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(suggestionsTranslateY, {
        toValue: translateValue,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowSuggestions(show);
    });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setCLicked(true);
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
      friction: 8,
    }).start();
    
    setTimeout(() => {
      if (!searchPhrase.trim()) {
        animateSuggestions(true);
      }
    }, 100);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!searchPhrase.trim()) {
      setCLicked(false);
    }
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
    
    animateSuggestions(false);
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
    } else if (searchPhrase.trim()) {
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.searchContainer,
          isFocused && styles.searchContainerFocused,
          {
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="search"
            size={22}
            color={isFocused ? colors.primary : colors.grey[500]}
          />
        </View>

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

        <View style={styles.actionsContainer}>
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

          {isFocused && (
            <View style={[styles.focusIndicator, { backgroundColor: colors.primary }]} />
          )}
        </View>
      </Animated.View>

      {showSuggestions && (
        <Animated.View
          style={[
            styles.quickSuggestions,
            {
              opacity: suggestionsOpacity,
              transform: [{ translateY: suggestionsTranslateY }],
            }
          ]}
        >
          <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => {
              animateSuggestions(false);
              onSubmit?.('NEAR_ME_SPECIAL');
            }}
          >
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.suggestionText}>{i18n.t('search.nearMe')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => {
              animateSuggestions(false);
              
              onSubmit?.('TOP_RATED_SPECIAL');
            }}
          >
            <Ionicons name="star" size={16} color={colors.primary} />
            <Text style={styles.suggestionText}>{i18n.t('search.topRated')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};
export default SearchComponent;

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - 80, 
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
    paddingVertical: 8,
    minHeight: 40,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainerFocused: {
    borderColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    paddingVertical: 0, 
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

