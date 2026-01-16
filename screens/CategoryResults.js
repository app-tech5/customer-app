import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ImageBackground} from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../global'
import i18n from '../i18n'
import { getCategories } from '../api'


export default function CategoryResults({route, navigation}) {
  const [categoryData, setCategoryData] = useState([])
  const [loader, setLoader] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cameFromOffers, setCameFromOffers] = useState(false)

  useEffect(()=>{
    const { applicableCategories, name, fromOffers, promotionName } = route.params

    // Vérifier si on vient de l'écran Offers
    setCameFromOffers(fromOffers === true)

    // Réinitialiser les états
    setLoader(true)
    setError(null)
    setCategoryData([])

    // Fonction de chargement des données
    const loadData = async () => {
      try {
        // Récupérer les catégories depuis la base de données
        const categories = await getCategories()

        console.log('🎯 CategoryResults - Loading data from DB:', {
          applicableCategories,
          promotionName,
          name,
          totalCategories: categories.length
        })

        console.log('📋 Sample categories from DB:', categories.slice(0, 5).map(c => ({ name: c.name, _id: c._id })))
        console.log('🔍 All category names from DB:', categories.map(c => c.name))

        let categoriesResult = []

        if (applicableCategories && applicableCategories.length > 0) {
          console.log('🔍 Filtering categories with:', applicableCategories)

          // Filtrer les catégories applicables à la promotion
          categoriesResult = categories.filter(cat => {
            const isMatch = applicableCategories.some(promoCat => {
              // Essayer différentes correspondances avec les données de la DB
              const match =
                cat.name === promoCat ||
                cat.name?.toLowerCase() === promoCat?.toLowerCase() ||
                cat._id === promoCat ||
                cat.id === promoCat ||
                cat === promoCat ||
                // Correspondance partielle
                cat.name?.toLowerCase().includes(promoCat?.toLowerCase())

              if (match) console.log('✅ Match found:', cat.name, 'with', promoCat)
              return match
            })
            return isMatch
          })

          console.log('🎯 Filtered result:', categoriesResult.length, 'categories')
          setSearchQuery(promotionName || name || `Categories (${applicableCategories.length})`)
        } else {
          console.log('📂 No filter, showing all categories')
          // Si pas de filtre, afficher toutes les catégories
          categoriesResult = categories
          setSearchQuery(name || 'All Categories')
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

    // Définir le titre
    const title = promotionName ? `Categories for ${promotionName}` : (name || 'Categories')

    console.log('🎯 CategoryResults - Navigation setup:', { cameFromOffers, promotionName, name })

    // Ajouter arrow back standard au header
    navigation.setOptions({
      title,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, marginLeft: 5 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      )
    })

  }, [route.params])

  // Composant pour l'état vide
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

  // Header avec info de recherche
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.resultInfo}>
        <Text style={styles.resultCount}>
          {categoryData.length} categor{categoryData.length > 1 ? 'ies' : 'y'} found
        </Text>
        {searchQuery && (
          <Text style={styles.resultQuery}>for "{searchQuery}"</Text>
        )}
      </View>
    </View>
  )

  if (loader) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="restaurant-outline" size={48} color={colors.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
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
              onPress={() => navigation.navigate('DrawerNavigator', {
                screen: 'BottomTabs',
                params: {
                  screen: 'Search',
                  params: {
                    screen: 'SearchResults',
                    params: {
                      categoryName: item.name,
                      name: item.name,
                      type: 'restaurant',
                      fromCategoryResults: true,
                      categoryResultsParams: route.params // Passer les params pour pouvoir revenir
                    }
                  }
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

  // Header
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

  // Liste
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

  // État vide
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
