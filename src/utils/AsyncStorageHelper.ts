import { Lazy } from './utils';

let AsyncStorage = new Lazy(() => require('@react-native-community/async-storage').default);

export class AsyncStorageHelper {

  static async set(key: string, value: any): Promise<void> {
    if (typeof value === 'string') {
      return AsyncStorage.get().setItem(key, value)
    } else return AsyncStorage.get().setItem(key, JSON.stringify(value));
  }

  static async getInt(key: string): Promise<number> {
    const str = await AsyncStorage.get().getItem(key);
    if (str) {
      return Number.parseInt(str);
    } else return null;
  }

  static async getFloat(key: string): Promise<number> {
    const str = await AsyncStorage.get().getItem(key);
    if (str) {
      return Number.parseFloat(str);
    } else return null;
  }

  static async getLong(key: string): Promise<number> {
    const str = await AsyncStorage.get().getItem(key);
    if (str) {
      return Number.parseInt(str);
    } else return null;
  }

  static async getString(key: string): Promise<string> {
    return AsyncStorage.get().getItem(key);
  }

  static async getObject(key: string): Promise<any> {
    const str = await AsyncStorage.get().getItem(key);
    if (str) {
      return JSON.parse(str);
    } else return null;
  }

  static remove(key: string): Promise<void> {
    return AsyncStorage.get().removeItem(key)
  }

  static async removePrefix(prefix: string): Promise<void> {
    const keys = await AsyncStorage.get().getAllKeys()
    const filtered = keys.filter((key: string) => key.startsWith(prefix))
    return AsyncStorage.get().multiRemove(filtered)
  }
}

export class LocalAsyncStorageHelper {
  constructor(private readonly prefix: string) { }

  private getKey(key: string): string {
    return this.prefix + ":" + key
  }

  getInt(key: string): Promise<number> {
    return AsyncStorageHelper.getInt(this.getKey(key))
  }

  getObject(key: string): Promise<any> {
    return AsyncStorageHelper.getObject(this.getKey(key))
  }

  getLong(key: string): Promise<number> {
    return AsyncStorageHelper.getLong(this.getKey(key))
  }

  set(key: string, value: any): Promise<void> {
    return AsyncStorageHelper.set(this.getKey(key), value)
  }

  remove(key: string): Promise<void> {
    return AsyncStorageHelper.remove(this.getKey(key))
  }

  removePrefix(prefix: string): Promise<void> {
    return AsyncStorageHelper.removePrefix(this.getKey(prefix))
  }

  clear(): Promise<void> {
    return AsyncStorageHelper.removePrefix(this.prefix)
  }
}