import {DataSource, UnSupportedReason} from '../DataSource';
import {FitbitStepMeasure} from './FitbitStepMeasure';
import {FitbitHeartRateMeasure} from './FitbitHeartRateMeasure';
import {SourceDependency} from '../SourceDependency';
import {AsyncStorageHelper} from '../../../system/AsyncStorageHelper';
import {refresh, authorize} from 'react-native-app-auth';

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

async function revokeScopeAndGet(
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

class FitbitCredentialDependency extends SourceDependency {
  private configBase;

  constructor(credential: FitbitCredential, private scope: string) {
    super();

    this.configBase = {
      clientId: credential.client_id,
      clientSecret: credential.client_secret,
      redirectUrl: credential.redirect_uri,
      serviceConfiguration: {
        authorizationEndpoint: 'https://www.fitbit.com/oauth2/authorize',
        tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
        revocationEndpoint: 'https://api.fitbit.com/oauth2/revoke',
      },
    };
  }

  private async makeConfig(): Promise<any> {
    const appendedScopes = await registerScopeAndGet(this.scope);
    const copiedConfig = JSON.parse(JSON.stringify(this.configBase));
    copiedConfig.scopes = appendedScopes;
    return copiedConfig;
  }

  async resolved(): Promise<boolean> {
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    return (
      state != null &&
      new Date(state.accessTokenExpirationDate).getTime() > Date.now()
    );
  }

  async tryResolve(): Promise<boolean> {
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    if (state) {
      try {
        const newState = await refresh(await this.makeConfig(), {
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
      const newState = await authorize(await this.makeConfig());
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
}

export class FitbitSource extends DataSource {
  key: string = 'fitbit';
  name: string = 'Fitbit';
  description: string = 'Fitbit Fitness Tracker';
  thumbnail = require("../../../../assets/images/services/service_fitbit.jpg")

  private _credential: FitbitCredential = null;
  get credential(): FitbitCredential {
    return this._credential;
  }

  makeCredentialDependency(scope: string): FitbitCredentialDependency {
    if (this._credential) {
      return new FitbitCredentialDependency(this.credential, scope);
    } else throw Error('Fitbit credential is not loaded.');
  }

  supportedMeasures = [
    new FitbitStepMeasure(this),
    new FitbitHeartRateMeasure(this),
  ];

  protected onCheckSupportedInSystem(): Promise<{
    supported: boolean;
    reason?: UnSupportedReason;
  }> {
    try {
      this._credential = require('../../../../credentials/fitbit.json');
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
