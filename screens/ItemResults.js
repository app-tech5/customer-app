import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ImageBackground} from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../global'
import i18n from '../i18n'
import { getAllMenuItems } from '../api'

export default function ItemResults({route, navigation}) {
  const [itemData, setItemData] = useState([])
  const [loader, setLoader] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cameFromOffers, setCameFromOffers] = useState(false)

  useEffect(()=>{
    const { applicableItems, name, fromOffers, promotionName } = route.params

    // Vérifier si on vient de l'écran Offers
    setCameFromOffers(fromOffers === true)

    // Réinitialiser les états
    setLoader(true)
    setError(null)
    setItemData([])

    // Fonction de chargement des données
    const loadData = async () => {
      try {
        // Récupérer tous les items depuis la base de données
        const allItems = await getAllMenuItems()

        console.log('🎯 ItemResults - Loading data from DB:', {
          applicableItems,
          promotionName,
          name,
          totalItems: allItems.length
        })

        console.log('📋 Sample items from DB:', allItems.slice(0, 5).map(item => ({ name: item.name, _id: item._id })))

        let itemsResult = []

        if (applicableItems && applicableItems.length > 0) {
          console.log('🔍 Filtering items with applicableItems:', applicableItems)
          console.log('📊 Total items in DB:', allItems.length)

          // Montrer quelques exemples d'items en DB
          console.log('📋 Sample DB items:', allItems.slice(0, 3).map(item => ({
            id: item._id || item.id,
            name: item.name,
            restaurantId: item.restaurantId
          })))

          // Filtrer les items applicables à la promotion
          let matchCount = 0
          itemsResult = allItems.filter(item => {
            const itemId = item._id || item.id
            const itemName = item.name

            const isMatch = applicableItems.some(promoItem => {
              // Essayer différentes correspondances avec les données de la DB
              const idMatch = itemId === promoItem
              const nameMatch = itemName === promoItem
              const nameLowerMatch = itemName?.toLowerCase() === promoItem?.toLowerCase()
              const partialMatch = itemName?.toLowerCase().includes(promoItem?.toLowerCase())

              const match = idMatch || nameMatch || nameLowerMatch || partialMatch

              if (match) {
                console.log('✅ Match found:', {
                  item: { id: itemId, name: itemName },
                  promoItem: promoItem,
                  matchType: idMatch ? 'ID' : nameMatch ? 'NAME' : nameLowerMatch ? 'NAME_LOWER' : 'PARTIAL'
                })
                matchCount++
              }

              return match
            })
            return isMatch
          })

          console.log('🎯 Filtered result:', itemsResult.length, 'items matched from', applicableItems.length, 'promo items')
          console.log('📈 Total matches found:', matchCount)
          setSearchQuery(promotionName || name || `Items (${applicableItems.length})`)
        } else {
          console.log('📂 No filter, showing all items')
          // Si pas de filtre, afficher tous les items
          itemsResult = allItems
          setSearchQuery(name || 'All Items')
        }

        setItemData(itemsResult)
      } catch (err) {
        console.error('Error loading item results:', err)
        setError(i18n.t ? i18n.t('search.errorSubtitle') : 'Error loading items')
        setItemData([])
      } finally {
        setLoader(false)
      }
    }

    loadData()

    // Définir le titre
    const title = promotionName ? `Items for ${promotionName}` : (name || 'Items')

    console.log('🎯 ItemResults - Navigation setup:', { cameFromOffers, promotionName, name })

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
         (i18n.t ? i18n.t('search.noItemsTitle') : 'No items found')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isError ? (query || (i18n.t ? i18n.t('search.errorSubtitle') : 'Check your connection')) :
         (i18n.t ? i18n.t('search.noItemsSubtitle') : 'Try different search terms or check back later')}
      </Text>
    </View>
  )

  // Header avec info de recherche
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.resultInfo}>
        <Text style={styles.resultCount}>
          {itemData.length} item{itemData.length > 1 ? 's' : ''} found
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
          <Ionicons name="fast-food-outline" size={48} color={colors.primary} />
          <Text style={styles.loadingText}>Loading items...</Text>
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

      {itemData.length === 0 ? (
        <EmptyState query={searchQuery} isError={false} />
      ) : (
        <FlatList
          data={itemData}
          keyExtractor={(item, index) => String(item._id || item.id || index)}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => {
                // Navigation vers le restaurant qui contient cet item
                if (item.restaurantId) {
                  navigation.navigate('RestaurantDetail', {
                    restaurant: { _id: item.restaurantId },
                    fromPromotion: true,
                    promotionName: name
                  })
                }
              }}
              style={styles.itemCard}
              activeOpacity={0.7}
            >
              <ImageBackground
                style={styles.itemImage}
                imageStyle={{ borderRadius: 8 }}
                source={{ uri: item.image || 'https://via.placeholder.com/150' }}
              >
                <View style={styles.itemOverlay}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.price && (
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  )}
                </View>
              </ImageBackground>

              <View style={styles.itemInfo}>
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description || 'Delicious item from our menu'}
                </Text>
                {item.restaurantName && (
                  <Text style={styles.restaurantName}>
                    From: {item.restaurantName}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
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
  itemCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  itemImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  itemOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  itemName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemPrice: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  restaurantName: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
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
