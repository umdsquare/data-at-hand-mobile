import Realm from 'realm';

import {systemRealmConfig, UsageLog} from '../database/system-schema';

class UsageLogger {
  private _realm: Realm;

  private getRealm(): Promise<Realm> {
    if (this._realm) {
      return Promise.resolve(this._realm);
    }
    return Realm.open(systemRealmConfig);
  }

  async writeLog(category: string, action: string, metadata: any=null, timestamp: Date = new Date()): Promise<UsageLog> {
    const realm = await this.getRealm();
    return new Promise((resolve, reject) => {
      try {
        realm.write(() => {
          const newLog = realm.create(UsageLog, {
            category: category,
            action: action,
            serializedMetadata: metadata ? JSON.stringify(metadata) : null,
            loggedAt: timestamp,
          } as UsageLog);
          console.log("[Log] category:", newLog.category, "| action:", newLog.action, "| params: ", newLog.metadata, "| logged at: ", newLog.loggedAt)
          resolve(newLog)
        });
      } catch (ex) {
        console.error(ex);
        reject(ex)
      }
    });
  }
}

const logger = new UsageLogger()
export { logger as UsageLogger }