import { useEffect, useContext } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { loadCartFromServer, syncCartWithServer } from '../redux/actions/cartActions';
import { SignInContext } from '../contexts/authContext';

const CartSyncWrapper = ({ children }) => {
  const dispatch = useDispatch();
  const store = useStore();
  const { signedIn } = useContext(SignInContext);
  const cartItems = useSelector((state) => state.cartReducer);

  useEffect(() => {
    if (!signedIn.userToken) return;

    if (cartItems && cartItems.length > 0) {
      syncCartWithServer(dispatch, store.getState);
    } else {
      loadCartFromServer(dispatch);
    }
  }, [signedIn.userToken, dispatch, store]);

  useEffect(() => {
    if (!signedIn.userToken) return;

    const interval = setInterval(() => {
      syncCartWithServer(dispatch, store.getState);
    }, 30000);

    return () => clearInterval(interval);
  }, [signedIn.userToken, dispatch, store]);

  return children;
};

export default CartSyncWrapper;
