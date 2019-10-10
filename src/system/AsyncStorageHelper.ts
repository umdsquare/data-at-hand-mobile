import AsyncStorage from '@react-native-community/async-storage';

export class AsyncStorageHelper {
  static async set(key: string, value: any): Promise<void> {
    return AsyncStorage.setItem(key, JSON.stringify(value));
  }

  static async get(key: string): Promise<number> {
    const str = await AsyncStorage.getItem(key);
    if (str) {
      return Number.parseInt(str);
    } else return null;
  }

  static async getFloat(key: string): Promise<number> {
    const str = await AsyncStorage.getItem(key);
    if (str) {
      return Number.parseFloat(str);
    } else return null;
  }

  static async getString(key: string): Promise<string> {
    return AsyncStorage.getItem(key);
  }

  static async getObject(key: string): Promise<any> {
    const str = await AsyncStorage.getItem(key);
    if (str) {
      return JSON.parse(str);
    } else return null;
  }

  static remove(key: string): Promise<void>{
      return AsyncStorage.removeItem(key)
  }
}
