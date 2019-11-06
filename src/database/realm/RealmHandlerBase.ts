import Realm from 'realm';

export class RealmHandlerBase{
    constructor(private readonly realmConfig: Realm.Configuration){

    }

    private _realm: Realm;

    protected getRealm(): Promise<Realm> {
      if (this._realm) {
        return Promise.resolve(this._realm);
      }
      return Realm.open(this.realmConfig);
    }
}