import {DataSource, UnSupportedReason} from '../DataSource';
import {FitbitStepMeasure} from './FitbitStepMeasure';
import {FitbitHeartRateMeasure} from './FitbitHeartRateMeasure';
import {AsyncStorageHelper} from '../../../system/AsyncStorageHelper';
import {refresh, authorize, revoke} from 'react-native-app-auth';
import { FitbitSleepMeasure } from './FitbitSleepMeasure';
import { FitbitWeightMeasure } from './FitbitWeightMeasure';
import { FitbitWorkoutMeasure } from './FitbitWorkoutMeasure';

interface FitbitCredential {
  readonly client_secret: string;
  readonly client_id: string;
  readonly redirect_uri: string;
}

const STORAGE_KEY_AUTH_STATE = DataSource.STORAGE_PREFIX + 'fitbit:state';
const STORAGE_KEY_AUTH_CURRENT_SCOPES =
  DataSource.STORAGE_PREFIX + 'fitbit:scopes';

async function registerScopeAndGet(scope: string): Promise<Array<string>> {
  const currentScopes = await AsyncStorageHelper.getObject(
    STORAGE_KEY_AUTH_CURRENT_SCOPES,
  );
  if (currentScopes) {
    if (currentScopes.indexOf(scope) >= 0) {
      return currentScopes;
    } else {
      currentScopes.push(scope);
      await AsyncStorageHelper.set(
        STORAGE_KEY_AUTH_CURRENT_SCOPES,
        currentScopes,
      );
      return currentScopes;
    }
  } else {
    const newScopes = [scope];
    await AsyncStorageHelper.set(STORAGE_KEY_AUTH_CURRENT_SCOPES, newScopes);
    return newScopes;
  }
}

export class FitbitSource extends DataSource {
  key: string = 'fitbit';
  name: string = 'Fitbit';
  description: string = 'Fitbit Fitness Tracker';
  thumbnail = require('../../../../assets/images/services/service_fitbit.jpg');

  supportedMeasures = [
    new FitbitStepMeasure(this),
    new FitbitHeartRateMeasure(this),
    new FitbitSleepMeasure(this),
    new FitbitWeightMeasure(this),
    new FitbitWorkoutMeasure(this)
  ];

  private _credential: FitbitCredential = null;
  private _authConfigBase = null;
  get credential(): FitbitCredential {
    return this._credential;
  }

  private async makeConfig(scope: string): Promise<any> {
    const appendedScopes = await registerScopeAndGet(scope);
    const copiedConfig = JSON.parse(JSON.stringify(this._authConfigBase));
    copiedConfig.scopes = appendedScopes;
    return copiedConfig;
  }

  async checkTokenValid(): Promise<boolean> {
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    return (
      state != null &&
      new Date(state.accessTokenExpirationDate).getTime() > Date.now()
    );
  }

  async authenticate(scope: string): Promise<boolean> {
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    if (state) {
      try {
        const newState = await refresh(await this.makeConfig(scope), {
          refreshToken: state.refreshToken,
        });
        if (newState) {
          await AsyncStorageHelper.set(STORAGE_KEY_AUTH_STATE, newState);
          return true;
        }
      } catch (e) {
        console.log(e);
      }
    }

    try {
      const newState = await authorize(await this.makeConfig(scope));
      if (newState) {
        await AsyncStorageHelper.set(STORAGE_KEY_AUTH_STATE, newState);
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  async signOut(): Promise<void> {
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    if (state) {
      await revoke(this._authConfigBase, {tokenToRevoke: state.refreshToken});
      AsyncStorageHelper.remove(STORAGE_KEY_AUTH_STATE);
    }
  }

  private async revokeScopeAndGet(
    scope: string,
  ): Promise<{removed: boolean; result: Array<string>}> {
    const currentScopes = (await AsyncStorageHelper.getObject(
      STORAGE_KEY_AUTH_CURRENT_SCOPES,
    )) as Array<string>;
    if (currentScopes) {
      const scopeIndex = currentScopes.indexOf(scope);
      if (scopeIndex >= 0) {
        currentScopes.splice(scopeIndex, 1);
        await AsyncStorageHelper.set(
          STORAGE_KEY_AUTH_CURRENT_SCOPES,
          currentScopes,
        );
        return {removed: true, result: currentScopes};
      } else {
        return {removed: false, result: currentScopes};
      }
    } else {
      return {removed: false, result: []};
    }
  }

  async revokeScope(scope: string): Promise<boolean> {
    const scopeRevokeResult = await this.revokeScopeAndGet(scope);
    console.log('new scopes:');
    console.log(scopeRevokeResult);
    if (scopeRevokeResult.removed === true) {
      if (scopeRevokeResult.result.length === 0) {
        try {
          await this.signOut();
          return true;
        } catch (e) {
          console.log(e);
          return false;
        }
      } else {
        try {
          const state = await AsyncStorageHelper.getObject(
            STORAGE_KEY_AUTH_STATE,
          );
          const newState = await refresh(
            {...this._authConfigBase, scopes: scopeRevokeResult.result},
            {
              refreshToken: state.refreshToken,
            },
          );
          if (newState) {
            await AsyncStorageHelper.set(STORAGE_KEY_AUTH_STATE, newState);
            return true;
          }
        } catch (e) {
          console.log(e);
          return false;
        }
      }
    }
    return true;
  }

  protected onCheckSupportedInSystem(): Promise<{
    supported: boolean;
    reason?: UnSupportedReason;
  }> {
    try {
      this._credential = require('../../../../credentials/fitbit.json');
      this._authConfigBase = {
        clientId: this._credential.client_id,
        clientSecret: this._credential.client_secret,
        redirectUrl: this._credential.redirect_uri,
        serviceConfiguration: {
          authorizationEndpoint: 'https://www.fitbit.com/oauth2/authorize',
          tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
          revocationEndpoint: 'https://api.fitbit.com/oauth2/revoke',
        },
      };
      return Promise.resolve({supported: true});
    } catch (e) {
      console.log(e);
      return Promise.resolve({
        supported: false,
        reason: UnSupportedReason.Credential,
      });
    }
  }
}
