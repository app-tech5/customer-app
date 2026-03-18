import {
  View, Text, FlatList, ScrollView,
  ImageBackground, StyleSheet, Dimensions, TouchableOpacity
} from 'react-native'
import React, { useState, useEffect } from 'react'
import SearchComponent from '../components/SearchComponent'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Menu } from '../components/home/HomeHeader'
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons'
import { colors } from '../global'
import i18n from '../lang/i18n'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getCategories } from '../api'

const SCREEN_WIDTH = Dimensions.get('window').width

export default function SearchScreen({ navigation }) {
  const [clicked, setCLicked] = useState(false)
  const [searchPhrase, setSearchPhrase] = useState("")
  const [activeTab, setActiveTab] = useState('restaurants')
  const [recentSearches, setRecentSearches] = useState([])
  const [trendingSearches, setTrendingSearches] = useState([
    'Pizza', 'Burger', 'Sushi', 'Italian', 'Chinese', 'Fast Food'
  ])
  const [categories, setCategories] = useState([])
  
  useEffect(() => {
    loadRecentSearches()
    loadCategories()
  }, [])

  const loadRecentSearches = async () => {
    try {
      const searches = await AsyncStorage.getItem('recentSearches')
      if (searches) {
        setRecentSearches(JSON.parse(searches))
      }
    } catch (error) {
      console.error('Error loading recent searches:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const realCategories = await getCategories()
      setCategories(realCategories)
    } catch (error) {
      console.error('Error loading categories:', error)
      
      setCategories([])
    }
  }

  const saveRecentSearch = async (search) => {
    try {
      const updatedSearches = [search, ...recentSearches.filter(s => s !== search)].slice(0, 10)
      setRecentSearches(updatedSearches)
      await AsyncStorage.setItem('recentSearches', JSON.stringify(updatedSearches))
    } catch (error) {
      console.error('Error saving recent search:', error)
    }
  }

  const clearRecentSearches = async () => {
    setRecentSearches([])
    await AsyncStorage.removeItem('recentSearches')
  }

  const performSearch = (query, type = activeTab) => {
    if (!query.trim()) return
    
    const specialQueries = ['TOP_RATED_SPECIAL', 'NEAR_ME_SPECIAL', 'FAVORITES_SPECIAL']
    if (!specialQueries.includes(query)) {
      saveRecentSearch(query)
    }
    
    if (type === 'restaurants') {
      navigation.navigate("SearchResults", { name: query, type: 'restaurant' })
    } else if (type === 'dishes') {
      navigation.navigate("SearchResults", { name: query, type: 'dish' })
    } else {
      navigation.navigate("SearchResults", { name: query })
    }
  }

  const QuickActionButton = ({ icon, title, onPress, color = colors.primary }) => (
    <TouchableOpacity style={[styles.quickAction, { borderColor: color }]} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        {icon}
      </View>
      <Text style={[styles.quickActionText, { color }]}>{title}</Text>
    </TouchableOpacity>
  )

  const SearchHistoryItem = ({ text, onPress, onDelete }) => (
    <TouchableOpacity style={styles.historyItem} onPress={onPress}>
      <View style={styles.historyLeft}>
        <Ionicons name="time-outline" size={20} color={colors.grey[500]} />
        <Text style={styles.historyText}>{text}</Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Ionicons name="close" size={20} color={colors.grey[400]} />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      {}
      <View style={styles.header}>
        <Menu navigation={navigation} />
        <SearchComponent
          searchPhrase={searchPhrase}
          setSearchPhrase={setSearchPhrase}
          clicked={clicked}
          setCLicked={setCLicked}
          onSubmit={(query) => performSearch(query)}
        />
      </View>

      {}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {}
        {clicked && (
          <View style={styles.searchingIndicator}>
            <Text style={styles.searchingText}>
              {searchPhrase ? `${i18n.t('search.searching')} "${searchPhrase}"...` : i18n.t('search.typeToSearch')}
            </Text>
          </View>
        )}

          {}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'restaurants' && styles.activeTab]}
              onPress={() => setActiveTab('restaurants')}
            >
              <Ionicons
                name="restaurant-outline"
                size={20}
                color={activeTab === 'restaurants' ? colors.primary : colors.grey[500]}
              />
              <Text style={[styles.tabText, activeTab === 'restaurants' && styles.activeTabText]}>
                {i18n.t('search.restaurants')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'dishes' && styles.activeTab]}
              onPress={() => setActiveTab('dishes')}
            >
              <MaterialIcons
                name="restaurant-menu"
                size={20}
                color={activeTab === 'dishes' ? colors.primary : colors.grey[500]}
              />
              <Text style={[styles.tabText, activeTab === 'dishes' && styles.activeTabText]}>
                {i18n.t('search.dishes')}
              </Text>
            </TouchableOpacity>
          </View>

          {}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>{i18n.t('search.quickActions')}</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionButton
                icon={<Ionicons name="location" size={24} color="white" />}
                title={i18n.t('search.nearMe')}
                onPress={() => performSearch('NEAR_ME_SPECIAL')}
              />
              <QuickActionButton
                icon={<FontAwesome name="star" size={24} color="white" />}
                title={i18n.t('search.topRated')}
                onPress={() => performSearch('TOP_RATED_SPECIAL')}
              />
              <QuickActionButton
                icon={<MaterialIcons name="local-offer" size={24} color="white" />}
                title={i18n.t('search.offers')}
                onPress={() => navigation.navigate('Offers')}
                color={colors.success}
              />
              <QuickActionButton
                icon={<Ionicons name="heart" size={24} color="white" />}
                title={i18n.t('search.favorites')}
                onPress={() => performSearch('FAVORITES_SPECIAL')}
                color={colors.error}
              />
            </View>
          </View>

          {}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{i18n.t('search.recentSearches')}</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>{i18n.t('common.clearAll')}</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((search, index) => (
                <SearchHistoryItem
                  key={index}
                  text={search}
                  onPress={() => performSearch(search)}
                  onDelete={() => {
                    const updated = recentSearches.filter(s => s !== search)
                    setRecentSearches(updated)
                    AsyncStorage.setItem('recentSearches', JSON.stringify(updated))
                  }}
                />
              ))}
            </View>
          )}

          {}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('search.trendingSearches')}</Text>
            <View style={styles.trendingContainer}>
              {trendingSearches.map((trend, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.trendTag}
                  onPress={() => performSearch(trend)}
                >
                  <Text style={styles.trendText}>{trend}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('search.browseByCategory')}</Text>
            <FlatList
              data={categories.slice(0, 6)} 
              keyExtractor={(item, index) => String(index)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => performSearch(item.name, 'category')}
                  style={styles.categoryItem}
                >
                  <ImageBackground
                    style={styles.categoryImage}
                    imageStyle={{ borderRadius: 12 }}
                    source={{ uri: item.image }}
                  >
                    <View style={styles.categoryOverlay}>
                      <Text style={styles.categoryText}>{item.name}</Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
              horizontal
              contentContainerStyle={styles.categoriesList}
            />
          </View>

        </ScrollView>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  searchingIndicator: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchingText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
  },
  
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: colors.grey[100],
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.background.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.grey[500],
    marginLeft: 8,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  
  quickActionsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickAction: {
    width: (SCREEN_WIDTH - 48) / 2,
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colors.background.primary,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  clearText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
  },
  deleteButton: {
    padding: 4,
  },
  
  trendingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  trendTag: {
    backgroundColor: colors.grey[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  trendText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  
  categoriesList: {
    paddingRight: 16,
  },
  categoryItem: {
    marginRight: 12,
  },
  categoryImage: {
    width: 120,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})