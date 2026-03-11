import { useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadCartFromServer, syncCartWithServer } from '../redux/reducers/cartReducer';
import { SignInContext } from '../contexts/authContext';

const CartSyncWrapper = ({ children }) => {
  const dispatch = useDispatch();
  const { signedIn } = useContext(SignInContext);
  const cartItems = useSelector(state => state.cartReducer);

  useEffect(() => {
    if (signedIn.userToken) {
      
      if (cartItems && cartItems.length > 0) {
        
        dispatch(syncCartWithServer());
      } else {
        
        dispatch(loadCartFromServer());
      }
    }
  }, [signedIn.userToken, dispatch]);
  
  useEffect(() => {
    if (!signedIn.userToken) return;

    const interval = setInterval(() => {
      dispatch(syncCartWithServer());
    }, 30000); 

    return () => clearInterval(interval);
  }, [signedIn.userToken, dispatch]);

  return children;
};

export default CartSyncWrapper;
