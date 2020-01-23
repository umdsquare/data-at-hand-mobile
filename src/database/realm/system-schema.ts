const Realm = require('realm');

/*
bool properties map to JavaScript boolean values
int, float, and double properties map to JavaScript number values. Internally ‘int’ and ‘double’ are stored as 64 bits while float is stored with 32 bits.
string properties map to string
data properties map to ArrayBuffer
date properties map to Date
*/

export class UsageLog {
  id: string;
  category: string;
  action: string;
  serializedMetadata: string;
  get metadata() {
    if (this.serializedMetadata) {
      return JSON.stringify(this.serializedMetadata);
    } else return null;
  }

  loggedAt: Date

  static schema = {
    name: 'UsageLog',
    primaryKey: 'id',
    properties: {
      id: 'string',
      category: 'string',
      action: 'string',
      serializedMetadata: 'string?',
      loggedAt: 'date',
    },
  };
}

export const systemRealmConfig = {
  path: 'system.realm',
  deleteRealmIfMigrationNeeded: __DEV__!=null,
  schema: [UsageLog],
}