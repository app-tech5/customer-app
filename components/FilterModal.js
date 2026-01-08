import { View, Text, Modal, StyleSheet} from 'react-native'
import React from 'react'
import { AntDesign, Ionicons, FontAwesome, MaterialIcons, Entypo} from '@expo/vector-icons'
import MaxDeliveryFee from './MaxDeliveryFee'

export default function FilterModal({visible, setVisible}) {
  return (
      <Modal animationType='slide' visible={visible}>
          <View style={styles.container}>
              <View style={styles.header}>
              <CloseModal setVisible={setVisible}/> 
                  <Text style={styles.textHeader}>All filters</Text>
              </View>
              <Title text="Sort" />
               
              <Filter iconName='car' text="Picked for you" icon="AntDesign"/>
              <Filter iconName='hourglass-start' text="Most popular" icon="FontAwesome"/>
              <Filter iconName='staro' text="Rating" icon="AntDesign"/>
              <Filter iconName='delivery-dining' text="Delivery time" icon="MaterialIcons"/>
              <Filter iconName='delivery-dining' text="Deal" icon="MaterialIcons"/>
              <Filter iconName='delivery-dining' text="Hightest rated" icon="MaterialIcons"/>
              <Title text="Max. Delivery Fee" />
              <MaxDeliveryFee />
              <Title text="Price range" />
              <View style={styles.priceRangeContainer}>
                  <PriceRange text="$" />
                  <PriceRange text="$$" />
                  <PriceRange text="$$$" />
                  <PriceRange text="$$$$" />
              </View>
              
          </View>
              <Button />
    </Modal>
  )
}

export const CloseModal = ({setVisible})=>{

    return (
         
    <AntDesign name="close" size={24} color="black" onPress={() => { setVisible(false) }} />
                   
              
    )
}

const Button = ()=>{
    return (
        <View style={styles.button}>
            <Text style={styles.textButton}>Apply</Text>
        </View>
    )
}

const Title = ({text})=>{
    return <View style={styles.bloc}>
    <Text style={styles.title}>{text}</Text>
</View>
}

const PriceRange = ({text})=>{
    return (
        <View style={styles.priceRange}>
            <Text>{text}</Text>
        </View>
    )
}



const Filter = ({iconName, text, icon})=> {
    return (
        <View style={styles.bloc}>
             
           <Icon name={iconName} type={icon}/>
            <Text style={styles.title}>{text}</Text>
        </View>
    )
}

export const  Icon = ({name, type, size})=>{

    return (
        <>
        {type==="AntDesign"?<AntDesign name={name} size={size?size:24} color="black"/>:<></>}
        {type==="Ionicons"?<Ionicons name={name} size={size?size:24} color="black"/>:<></>}
        {type==="FontAwesome"?<FontAwesome name={name} size={size?size:24} color="black"/>:<></>}
        {type==="MaterialIcons"?<MaterialIcons name={name} size={size?size:24} color="black"/>:<></>}
        {type==="Entypo"?<Entypo name={name} size={size?size:24} color="black"/>:<></>}
        
        </>
          
    )
}

 

const styles = StyleSheet.create({
    container: {
       flex: 1,
       marginHorizontal: 10,
       
        
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
       marginTop: 10,
       borderBottomWidth: 0.5,
       borderBottomColor: "grey"
     },
    textHeader: {
        fontSize: 24,
        marginLeft: 30,
        paddingVertical: 15
    },
    bloc: {
     flexDirection: "row",
     alignItems: "center"
    },
    title: {
        fontSize: 20,
        padding: 15
    },
    text: {

    },
    priceRangeContainer: {
     flexDirection: "row",
     justifyContent: "space-evenly"
    },
    priceRange: {
        height: 60,
        borderWidth: 1,
        aspectRatio: 1,
        alignItems:"center",
        justifyContent: "center",
        borderRadius: 50
    },
    button: {
     backgroundColor: "black",
     marginHorizontal: 10
    },
    textButton: {
      fontSize: 20,
      color: "white",
      alignSelf: "center",
      paddingVertical: 15
    }
}) 

