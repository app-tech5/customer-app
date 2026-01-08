import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";

const Item = ({ name, details }) => {
  const navigation = useNavigation()
  return (
    <TouchableOpacity
      onPress={()=>navigation.navigate("SearchResults", {name})}
    >
      <View style={styles.item}>
        <Text style={styles.title}>{name}</Text>
      </View>
    </TouchableOpacity>
)};
const List = ({ searchPhrase, setCLicked, data }) => {
  const renderItem = ({ item }) => {
    if (searchPhrase === "") {
      <Item name={item.name}  />;
    }
    if (item.name.toUpperCase().includes(searchPhrase.toUpperCase().trim().replace(/\s/g, ""))) {
      return <Item name={item.name}  />;
    }
  };
  return (
    <SafeAreaView style={styles.list__container}>
      <View
        onStartShouldSetResponder={() => {
          setCLicked(false);
        }}
      >
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      </View>
    </SafeAreaView>
  );
};
export default List;
const styles = StyleSheet.create({
  list__container: {
    margin: 10,
    height: "85%",
    width: "100%",
  },
  item: {
    margin: 30,
    borderBottomWidth: 2,
    borderBottomColor: "lightgrey"
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
});