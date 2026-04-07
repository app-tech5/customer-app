import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ImageBackground} from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../global'
import i18n from '../lang/i18n'
import { getCategories } from '../api'

export default function CategoryResults({route, navigation}) {
  const [categoryData, setCategoryData] = useState([])
  const [loader, setLoader] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cameFromOffers, setCameFromOffers] = useState(false)

  useEffect(()=>{
    const { applicableCategories, name, fromOffers, promotionName } = route.params
    
    setCameFromOffers(fromOffers === true)
    
    setLoader(true)
    setError(null)
    setCategoryData([])
    
    const loadData = async () => {
      try {
        const categories = await getCategories()
        let categoriesResult = []

        if (applicableCategories && applicableCategories.length > 0) {
          categoriesResult = categories.filter(cat => {
            const isMatch = applicableCategories.some(promoCat => {
              const match =
                cat.name === promoCat ||
                cat.name?.toLowerCase() === promoCat?.toLowerCase() ||
                cat._id === promoCat ||
                cat.id === promoCat ||
                cat === promoCat ||
                cat.name?.toLowerCase().includes(promoCat?.toLowerCase())
              return match
            })
            return isMatch
          })
          setSearchQuery(promotionName || name || `Categories (${applicableCategories.length})`)
        } else {
          categoriesResult = categories
          setSearchQuery(name || i18n.t('search.allCategories'))
        }

        setCategoryData(categoriesResult)
      } catch (err) {
        console.error('Error loading category results:', err)
        setError(i18n.t ? i18n.t('search.errorSubtitle') : 'Error loading categories')
        setCategoryData([])
      } finally {
        setLoader(false)
      }
    }

    loadData()
    
    const title = promotionName ? i18n.t('search.categoriesFor', { name: promotionName }) : (name || i18n.t('search.categories'))

    navigation.setOptions({
      title,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            
            if (cameFromOffers || promotionName) {
              navigation.navigate('Offers')
            } else {
              
              navigation.goBack()
            }
          }}
          style={{ padding: 10, marginLeft: 5 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      )
    })

  }, [route.params])
  
  const EmptyState = ({ query, isError }) => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={isError ? "alert-circle" : "search"}
        size={64}
        color={colors.grey[400]}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>
        {isError ? (i18n.t ? i18n.t('search.errorTitle') : 'Error') :
         (i18n.t ? i18n.t('search.noResultsTitle') : 'No categories found')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isError ? (query || (i18n.t ? i18n.t('search.errorSubtitle') : 'Check your connection')) :
         (i18n.t ? i18n.t('search.noResultsSubtitle') : 'Try different search terms')}
      </Text>
    </View>
  )
  
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.resultInfo}>
        <Text style={styles.resultCount}>
          {categoryData.length === 1 ? i18n.t('search.categoryFound') : i18n.t('search.categoriesFound', { count: categoryData.length })}
        </Text>
        {searchQuery && (
          <Text style={styles.resultQuery}>{i18n.t('search.forQuery', { query: searchQuery })}</Text>
        )}
      </View>
    </View>
  )

  if (loader) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="restaurant-outline" size={48} color={colors.primary} />
          <Text style={styles.loadingText}>{i18n.t('search.loadingCategories')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState query={searchQuery} isError={true} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      {categoryData.length === 0 ? (
        <EmptyState query={searchQuery} isError={false} />
      ) : (
        <FlatList
          data={categoryData}
          keyExtractor={(item, index) => String(index)}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('SearchFlow', {
                screen: 'SearchResults',
                params: {
                  categoryName: item.name,
                  name: item.name,
                  type: 'restaurant',
                  fromCategoryResults: true,
                  categoryResultsParams: route.params 
                }
              })}
              style={styles.categoryItem}
              activeOpacity={0.7}
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
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  resultInfo: {
    alignItems: 'center',
  },
  resultCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  resultQuery: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  
  listContainer: {
    padding: 16,
  },
  categoryItem: {
    flex: 1,
    margin: 8,
    maxWidth: '45%',
  },
  categoryImage: {
    width: '100%',
    height: 120,
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
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
})
