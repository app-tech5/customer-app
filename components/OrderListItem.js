import { useState } from "react";
import { View, Text, Image, Pressable, Modal, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useSelector } from "react-redux";
import OrderItem from '../components/restaurantDetail/OrderItem'
import {language, currency}  from '../global'

const OrderListItem = ({ order, index}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const checkoutModalContent = ()=>{
    return (
        <>
            <View style={styles.modalContainer}>
                <View style={styles.modalCheckoutContainer}>
                    <Text style={styles.restaurantName}>{order.restaurantName}</Text>
                        <OrderItem key={index} item={order} />
                    <View style={styles.subtotalContainer}>
                        <Text style={styles.subtotalText}>Subtotal</Text>
                        <Text>{order.price.toLocaleString(language, {
                            style: "currency",
                            currency: currency
                        })}</Text>
                    </View>
                    <View style={{
                        flexDirection: "row",
                        justifyContent: "center",
                    }}>
                        <TouchableOpacity
                            style={{
                                marginTop: 20,
                                backgroundColor: "black",
                                alignItems: "center",
                                padding: 13,
                                borderRadius: 30,
                                width: 300,
                                position: "relative",
                            }}
                            onPress={() => {
                                // TODO: Implement order creation
                                setModalVisible(false);
                            }}>
                            <Text style={{ color: "white", fontSize: 20 }}>Checkout</Text>
                            <Text style={{
                                color: "white",
                                position: "absolute",
                                right: 20,
                                fontSize: 15,
                                top: 17
                            }}>{}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </>
    )
}
  return (
    <>
        <Modal
                animationType='slide'
                visible={modalVisible}
                transparent={true}
                onRequestClose={() => setModalVisible(false)}>
                {checkoutModalContent()}
            </Modal>
    <Pressable
      style={{ flexDirection: "row", margin: 10, alignItems: "center" }}
      onPress={()=>setModalVisible(true)}
    >
      <Image
        source={{ uri: order.image }}
        style={{ width: 75, height: 75, marginRight: 5 }}
      />
      <View>
        <Text style={{
        fontWeight:Platform.OS === "android"?"bold":"600",
        fontSize: 16 }}>
          {/* {order.Restaurant.name} */}
          {order.title}
        </Text>
        <Text style={{ marginVertical: 5 }}>3 items &#8226; $38.45</Text>
        <Text>2 days ago &#8226; {order.status} </Text>
      </View>
    </Pressable>
    </>
  );
};
const styles = StyleSheet.create({
  modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.7)"
  },
  modalCheckoutContainer: {
      backgroundColor: "white",
      padding: 16,
      height: 500,
      borderWidth: 1,
  },
  restaurantName:{
      textAlign: "center",
      fontWeight:Platform.OS === "android"?"bold":"600",
      fontSize: 18,
      marginBottom: 10
  },
  subtotalContainer:{
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 15,
  },
  subtotalText: {
    textAlign: "left",
    fontWeight:Platform.OS === "android"?"bold":"600",
    fontSize: 15,
    marginBottom: 10
  }
})
export default OrderListItem;