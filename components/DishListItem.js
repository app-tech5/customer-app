import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import i18n from "../lang/i18n";
import { config } from "../config";

const DishListItem = ({ dish }) => {
  const navigation = useNavigation();
  const [imageError, setImageError] = useState(false);

  return (
    <Pressable
      onPress={() => navigation.navigate("MenuDetailScreen", { food: dish, title: dish.name })}
      style={styles.container}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{dish.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {dish.description}
        </Text>
        <Text style={styles.price}>$ {dish.price}</Text>
      </View>
      {dish?.image && (
        <Image
          source={imageError ?
            { uri: config.assetUrls.placeholder.dishListItemNoImage75 } :
            { uri: dish.image }
          }
          style={[styles.image, { backgroundColor: imageError ? '#f0f0f0' : 'transparent' }]}
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
          onLoad={() => {
            setImageError(false);
            setImageLoaded(true);
          }}
        />
      )}
      {!dish?.image && (
        <View style={[styles.image, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 10, color: '#666' }}>{i18n.t('menu.noImage')}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    marginVertical: 10,
    marginHorizontal: 20,
    borderBottomColor: "lightgrey",
    borderBottomWidth: 1,
    flexDirection: "row",
  },
  name: {
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  description: {
    color: "gray",
    marginVertical: 5,
  },
  price: {
    fontSize: 16,
  },
  image: {
    height: 75,
    aspectRatio: 1,
  },
});

export default DishListItem;
