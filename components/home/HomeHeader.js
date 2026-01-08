import { View, Text, TouchableOpacity} from 'react-native'
import React, {useState} from 'react'
import { Icon,withBadge} from 'react-native-elements'
import { FontAwesome } from '@expo/vector-icons'
import FilterModal from '../FilterModal'

export default function HomeHeader({navigation}) {

    const [filter, setFilter] = useState(false)
  return (
      <>
          <View style={{
            flexDirection : "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
             <Menu navigation={navigation}/>
              <TouchableOpacity onPress={()=>setFilter(true)}>
          
                  <FontAwesome
                      name='filter'
                      color="grey"
                      size={25}
          
                  />
          
              </TouchableOpacity>
          </View>
          <FilterModal visible={filter} setVisible={setFilter}/>
      </>
  )
}

export const Menu = ({navigation}) => {

    return  <View style={{
     }}>
         <Icon
             type="material-community"
             name='menu'
             color="black"
             size={32}
             onPress={()=>navigation.toggleDrawer()}
         />
     </View>
}