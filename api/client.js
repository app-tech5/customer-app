import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './constants';

export class ApiClient {
  constructor() {
    this.token = null;
    this.user = null;
    this.initializeFromStorage();
  }

  async initializeFromStorage() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (token) this.token = token;
      if (userData) this.user = JSON.parse(userData);
    } catch (error) {
      console.error('Error initializing from storage:', error);
    }
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    return headers;
  }

  async apiCall(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const fetchConfig = {
        headers: this.getHeaders(),
        ...options,
      };
      const response = await fetch(url, fetchConfig);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API call failed: ${endpoint}`, error);
      throw error;
    }
  }

  async saveToStorage() {
    try {
      if (this.token) await AsyncStorage.setItem('userToken', this.token);
      if (this.user) await AsyncStorage.setItem('userData', JSON.stringify(this.user));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  async clearStorage() {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  setToken(token) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }
}
