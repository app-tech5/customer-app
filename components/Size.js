import { useState } from "react"
import { Text, View, StyleSheet } from "react-native"
import { CheckBox } from "react-native-elements"
import { useDispatch, useSelector } from "react-redux"
import { currency, language } from "../global"

const Size = ({ food, restaurant }) => {
    const dispatch = useDispatch();
    // const items = useSelector((state)=>state.cartReducer).filter(item => item.restaurantName === restaurant.name)
    const [checked, setChecked] = useState(new Array(Object.keys(food.size).length).fill(false))

    return Object.keys(food.size).map((key, index) => {
        return (
            <View key={index} style={styles.container}>
                <CheckBox
                    title={key}
                    checked={checked[index]}
                    uncheckedIcon='circle-o'
                    checkedIcon='dot-circle-o'
                    onPress={() => {
                        // if(!items.some(item => item.name === food.name))
                        dispatch({
                            type: 'UPDATE_FROM_CARD',
                            payload: {
                                ...food,
                                size: {
                                    title: key,
                                    price: food.size[key]
                                },
                                price:Number(food.size[key]),
                                restaurantName: restaurant.name,
                                restaurantImage: restaurant.image,
                                restaurant: restaurant

                            }
                        });
                        setChecked([...Array(index).fill(false), true, ...Array(checked.length - index).fill(false)])
                    }}
                    textStyle={styles.checkboxText}
                    containerStyle={styles.checkboxContainer}
                />
                <Text style={styles.price}>{Number(food.size[key]).toLocaleString(language, { style: "currency", currency: currency })}</Text>
            </View>
        )
    })

}
const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        // borderWidth: 2,
        marginHorizontal: 10,
        paddingRight: 10,
        backgroundColor: "white"
    },
    checkboxText: {
        fontSize: 20
    },
    checkboxContainer: {
        backgroundColor: "white",
        borderWidth: 0
    },
    price: {
        fontSize: 20
    }
})
export default Size

