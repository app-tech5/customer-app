import React, { useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadCartFromServer, syncCartWithServer } from '../redux/reducers/cartReducer';
import { SignInContext } from '../contexts/authContext';

const CartSyncWrapper = ({ children }) => {
  const dispatch = useDispatch();
  const { signedIn } = useContext(SignInContext);
  const cartItems = useSelector(state => state.cartReducer);

  useEffect(() => {
    if (signedIn.userToken) {
      // Si l'utilisateur est connecté, synchroniser le panier
      if (cartItems && cartItems.length > 0) {
        // Si il y a des items locaux, les synchroniser avec le serveur
        dispatch(syncCartWithServer());
      } else {
        // Sinon, charger le panier depuis le serveur
        dispatch(loadCartFromServer());
      }
    }
  }, [signedIn.userToken, dispatch]);

  // Synchronisation périodique toutes les 30 secondes si l'utilisateur est actif
  useEffect(() => {
    if (!signedIn.userToken) return;

    const interval = setInterval(() => {
      dispatch(syncCartWithServer());
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [signedIn.userToken, dispatch]);

  return children;
};

export default CartSyncWrapper;
