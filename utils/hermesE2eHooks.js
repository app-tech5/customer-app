import { api } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../redux/store';

export function installHermesE2eAuthHooks(setSignedIn) {
  globalThis.__HERMES_E2E_LOGIN__ = async (email, password) => {
    try {
      const result = await api.login(email, password);
      if (!result?.token || !result?.user?.id) {
        return { ok: false, error: 'login returned no token/user' };
      }
      await AsyncStorage.setItem('userToken', result.token);
      const userInfo = await api.getUserInfo(result.user.id);
      await AsyncStorage.setItem('userData', JSON.stringify(userInfo));
      store.dispatch({
        type: 'ADD_USER',
        payload: {
          ...userInfo,
          userId: result.user.id,
        },
      });
      setSignedIn(result.token);
      return { ok: true, userId: result.user.id };
    } catch (error) {
      return { ok: false, error: String(error?.message || error) };
    }
  };

  globalThis.__HERMES_E2E_LOGOUT__ = async () => {
    try {
      await api.logout();
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      setSignedIn(null);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: String(error?.message || error) };
    }
  };
}
