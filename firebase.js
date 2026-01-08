import { initializeApp } from 'firebase/app'
import { getAuth, initializeAuth, getReactNativePersistence} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc, getFirestore, collection, getDocs, doc, deleteDoc, orderBy, query, limit,
  where, onSnapshot, serverTimestamp, updateDoc
} from 'firebase/firestore'
import { getStorage, ref, getDownloadURL } from 'firebase/storage'
import { LogBox } from 'react-native';
import { restaurants } from './data';
LogBox.ignoreLogs(['AsyncStorage has been extracted from react-native core'])

const firebaseConfig = {

  apiKey: {/* Your firebase config here */ },

  authDomain: {/* Your firebase config here */ },

  projectId: {/* Your firebase config here */ },

  storageBucket: {/* Your firebase config here */ },

  messagingSenderId: {/* Your firebase config here */ },

  appId: {/* Your firebase config here */ },
  

  
};
const firebaseApp = initializeApp(firebaseConfig);
export default firebaseApp;
initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
 });
export const auth = getAuth(firebaseApp)
export const db = getFirestore()
export const storage = getStorage();
const restaurantsCol = collection(db, 'restaurants')
const categoriesCol = collection(db, 'categories')
const categoriesRestaurantsCol = collection(db, 'categoriesRestaurants')
export const getRestaurantsFromFirebase = () => {
  const restos = []
  return getDocs(restaurantsCol)
    .then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        restos.push({
          restaurantId: doc.id,
          ...doc.data()
        })
      })
      return restos
    })
}
export const ordersCol = collection(db, 'orders')
export const getOrders = () => {
  const q = query(ordersCol, orderBy('createdAt', 'desc'), limit(1))
  const orders = []
  return getDocs(q)
    .then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        orders.push(doc.data())
        console.log(doc.data())
      })
      return orders
    })
}
export const getDriverInfos = async (setDriverName, setCar, setDriverImage, bottomSheet, setDriverLat, setDriverLng, mapRef) => {
  const unsuscribe = onSnapshot(ordersCol, (snapshot) => {
    snapshot.docs.forEach((doc) => {
      if (doc.data().createdAt && doc.data().status === 'ACCEPTED' && doc.data().User.id === auth.currentUser?.uid, doc.data().driverId) {
        bottomSheet?.current.collapse()
        mapRef?.current?.getCamera().then((cam) => {
          cam.zoom += 1;
          mapRef?.current?.animateCamera(cam);
        })
        driverInfos(doc.data().driverId)
          .then((snapshot) => snapshot.docs.forEach((doc) => {
            console.log(doc.data().lat, doc.data().lng)
            setDriverName(doc.data().name)
            setCar(doc.data().Car)
            setDriverImage({ uri: doc.data().image })
            setDriverLat(doc.data().lat)
            setDriverLng(doc.data().lng)
          }))
      }
    })
  })
}
const testt = () => {
  const colRef = collection(db, 'orders')
  const q = query(colRef, orderBy('createdAt', 'desc'))
  return getDocs(q)
    .then((snapshot) => {
      console.log(snapshot.docs[0].data())
    })
}
export const addRestaurants = (restaurants) => {
  restaurants.forEach((restaurant) => {
    addDoc(restaurantsCol, restaurant)
      .then(() => console.log("ajouté"))
  })
}
const foodsCol = collection(db, 'foods')
const addfoods = () => {
  getDocs(restaurantsCol)
    .then(snapshot => snapshot.docs.forEach((doc) => {
      doc.data().dishes.forEach((dishe) => {
        addDoc(foodsCol, dishe.name ? {
          restaurantID: doc.id,
          ...dishe,
          createdAt: serverTimestamp()
        } : {
          restaurantID: doc.id,
          ...dishe,
          name: dishe.title,
          createdAt: serverTimestamp()
        }).then(() => console.log("ADDED"))
      })
    }))
}
export const getFoods = (restaurantId) => {

  const foods = []
  const q = query(foodsCol, where("restaurantId", "==", restaurantId))
  return getDocs(q)
    .then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        foods.push({
          ...doc.data(),
          id: doc.id
        })
      })
       
      return foods
    }
    )
}
const getFoodsAll = () => {
  getDocs(foodsCol)
    .then((snapshot) => {
      console.log(snapshot.docs.map((doc) => doc.data()))
    })
}
const addGroupToFoods = () => {
  getDocs(foodsCol)
    .then(snapshot => {
      snapshot.docs.forEach(docc => {
        updateDoc(doc(db, 'foods', docc.id), {
          group: Math.floor(Math.random() * 9 + 1)
        }).then(() => console.log('Updated'))
      })
    })
}
const userRef = collection(db, 'users')
export const addUser = async (userCredentials, name, phone, address) => {
  addDoc(userRef, {
    id: userCredentials.user.uid,
    name: name,
    email: userCredentials.user.email,
    phone: phone,
    address: address.description,
    lat: address.location.lat,
    lng: address.location.lng
  })
    .then(() => console.log('user create'))
}

export const updateUser = async (address, userId) => {
  const docRef = doc(db, 'users', userId)
  return updateDoc(docRef, {
    address: address.description,
    lat: address.location.lat,
    lng: address.location.lng
  })
    .then(() => console.log('user updated'))
}
export const userInfos = (uid) => {
  const q = query(userRef, where("id", "==", uid))
  return getDocs(q)
}
const driversCol = collection(db, 'drivers')
export const driverInfos = (driverId) => {
  const q = query(driversCol, where("Id", "==", driverId))
  return getDocs(q)
}
const getImageFromStorage = (imagePath) => {
  const fileRef = ref(storage, imagePath);
  return getDownloadURL(fileRef)
}
const addOrderToFirebase = () => {
  addDoc(ordersCol, {
    orderId: generateUID(),
    restaurantId: restaurant.restaurantId,
    Restaurant: {
      lat: restaurant.coordinates.latitude,
      lng: restaurant.coordinates.longitude,
      address: restaurant.location.display_address.toString(),
      phone: restaurant.phone,
      name: restaurant.name,
    },
    User: {
      name: name,
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      phone: phone,
      address: address,
      items: items
    },
    status: "pending",
    createdAt: serverTimestamp(),
  }).then(() => {
    dispatch({ type: 'CLEAR', })
    setLoading(false)
    navigation.navigate('OrderRequest', { loc: loc })
  })
}
const populateRestaurant = () => {
  const themes = [
    "In a rush?",
    "Best Overall",
    "Popular near you",
    "Rewards for you",
    "National brands",
    "Only on Good Food",
    "Everyday savings"
  ]
  getDocs(restaurantsCol)
    .then(snapshot => {
      snapshot.docs.forEach((docc) => {
        updateDoc(doc(db, 'restaurants', docc.id), {
          theme: themes[Math.floor(Math.random() * 7)]
        }).then(() => console.log('Updated'))
      })
    })
}
export const getCategories = () => {
  const categories = []
  return getDocs(categoriesCol).then(snapshot => {
    snapshot.docs.forEach((doc) => {
      categories.push({ ...doc.data(), id: doc.id })
    })
    return categories
  })
}
export const getCategoriesRestaurants = () => {
  let categoriesRestaurants = []
  return getDocs(categoriesRestaurantsCol).then(snapshot => {
    snapshot.docs.forEach((doc) => {
      categoriesRestaurants.push({ ...doc.data(), id: doc.id })
    })
    return categoriesRestaurants
  })
}
export const getCategoriesFromRestaurant = async (restaurantId) => {
  const categoriesRestaurants = await getCategoriesRestaurants()
  const categoriesRestaurantsResult = categoriesRestaurants.filter(categoryRestaurant => categoryRestaurant.restaurantId === restaurantId)
  const categories = await getCategories()
  return categoriesRestaurantsResult.map(categoryRestaurantResult => categories.find(category => category.id === categoryRestaurantResult.categoryId))
}
export const searchRestaurantsByCategory = async (categoryId) => {
  const categoriesRestaurants = await getCategoriesRestaurants()
  const categoriesRestaurantsResult = categoriesRestaurants.filter(categoryRestaurant => categoryRestaurant.categoryId === categoryId)
  const restaurants = await getRestaurantsFromFirebase()
  return categoriesRestaurantsResult.map(categoryRestaurantResult => restaurants.find(restaurant => restaurant.restaurantId === categoryRestaurantResult.restaurantId))
}
