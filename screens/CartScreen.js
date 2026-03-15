import { View, Text, StyleSheet, Image, TouchableOpacity} from "react-native";
import { useSelector } from "react-redux";
import {language, currency}  from '../global'
import { AntDesign } from "@expo/vector-icons";
import { useState } from "react";
import i18n from '../i18n';
import CartModal from "../components/CartModal";

const CartScreen = ({navigation}) => {
  
  const [modalVisible, setModalVisible] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");

  const items = useSelector((state)=>state.cartReducer)
  const {address} = useSelector((state)=>state.userReducer)

  return (
    <View style={{flex: 1}}> 
    {items.length === 0 ?
      <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
       <Image style={{width: 150, height: 150, marginBottom: 20}} source={{uri: "https://img.icons8.com/fluency/344/shopping-cart.png"}} />
       <Text style={{fontSize: 20}}>{i18n.t('cart.addItemsToStartCart')}</Text>
       <Text style={{fontSize: 10, marginBottom: 15}}>{i18n.t('cart.emptySubtitle')}</Text>
       <TouchableOpacity 
       onPress={()=>navigation.navigate("Home")}
            style={{backgroundColor: "black", borderRadius: 20}}>
         <Text style={{color:"white", padding: 8, paddingHorizontal: 10 }}>{i18n.t('cart.startShopping')}</Text>
       </TouchableOpacity>
       </View> 
       :
    <View>
      
      <CartModal modalVisible={modalVisible} setModalVisible={setModalVisible} restaurantName={restaurantName}/>

{Object.entries(items.map(item => item.restaurantName).reduce((acc, curr) => (acc[curr] = (acc[curr] || 0) + 1, acc), {}))
         .map(([restaurantName, quantity], index)=>(
               <TouchableOpacity style={styles.container} key={index} 
             onPress={() => {setModalVisible(true); setRestaurantName(restaurantName)}}
             >
              <View style={styles.imageContainer}>
              <Image source={{uri: items.find(item=>item.restaurantName === restaurantName).restaurantImage}} style={styles.image}/>
              </View>
               <View style={styles.name_quantity_price}>
                <Text style={styles.name}>{restaurantName}</Text>
                <Text style={styles.quantity_price}>{quantity} {quantity > 1 ? i18n.t('cart.items') : i18n.t('cart.item')} • {items.reduce((a, v) => v.restaurantName === restaurantName ? a + v.price : a, 0).toLocaleString(language, {style: "currency", currency: currency})}</Text>
                <Text style={styles.address}>{i18n.t('cart.deliverTo', { address: address?.description || '' })}</Text>
              </View>
               
              <AntDesign name="right" size={20} color="black" style={styles.icon}/>
            </TouchableOpacity>
              
         ))}
    </View>
         }
         </View>
  );
};
 
const styles = StyleSheet.create({

  container: {
    flexDirection: "row",
    alignItems: "center",
     
  },
  imageContainer: {
   padding: 10,
   
  },
  image : {
    width: 60, height: 60,
    overflow: "hidden",
    borderRadius: 50
     
  },
  name_quantity_price: {
   flex: 1,
   borderBottomWidth: 0.5,
   padding: 12
  },
  name: {
   fontWeight: "bold",
   fontSize: 16
  },
  quantity_price: {
    color: "grey"
  },
  address: {
    color: "grey"
  },
  icon: {
    marginRight: 10
  }
})

export default CartScreen;

