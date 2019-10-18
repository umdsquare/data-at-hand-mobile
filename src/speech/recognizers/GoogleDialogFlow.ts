import {INaturalLanguageAnalyzer, NLUResult} from '../types';
import {AsyncStorageHelper} from '../../system/AsyncStorageHelper';

const DEFAULT_BASE_URL = 'https://dialogflow.googleapis.com/v2/projects/';

interface GoogleRecognitionResult {
  responseId: string;
  queryResult: {
    queryText: string;
    parameters: any;
    allRequiredParamsPresent: boolean;
    intent: {
      name: string;
      displayName: string;
    };
    intentDetectionConfidence: number;
    languageCode: string;
  };
}

//from https://github.com/innFactory/react-native-dialogflow/blob/master/js/googleAuth/GoogleAuth.js
const encodeJWT = function(options) {
  if (!options) {
    throw new Error('options is required');
  }
  if (!options.email) {
    throw new Error('options.email is required');
  }
  if (!options.scopes) {
    throw new Error('options.scopes is required');
  }
  if (!Array.isArray(options.scopes)) {
    throw new Error('options.scopes must be an array');
  }
  if (options.scopes.length === 0) {
    throw new Error('options.scopes must contain at least one scope');
  }
  if (!options.key) {
    throw new Error('options.key is required');
  }

  var rs = require('jsrsasign');

  var iat = Math.floor(new Date().getTime() / 1000),
    exp = iat + Math.floor((options.expiration || 60 * 60 * 1000) / 1000),
    claims = {
      iss: options.email,
      scope: options.scopes.join(' '),
      aud: 'https://accounts.google.com/o/oauth2/token',
      exp: exp,
      iat: iat,
      sub: null,
    };

  if (options.delegationEmail) {
    claims.sub = options.delegationEmail;
  }

  // Sign JWT
  var sHeader = JSON.stringify({alg: 'RS256', typ: 'JWT'});
  return rs.jws.JWS.sign('RS256', sHeader, JSON.stringify(claims), options.key);
};

const STORAGE_KEY_ACCESS_TOKEN = 'google:dialogflow:access_token';
const STORAGE_KEY_EXPIRE_TIME = 'google:dialogflow:expire_time';

class GoogleDialogFlow implements INaturalLanguageAnalyzer {
  private credentials: any;
  private projectId: string;

  async initialize(): Promise<void> {
    try {
      this.credentials = require('../../../credentials/credential_google_dialogflow.json');
    } catch (ex) {
      throw {error: 'InvalidCredentialFile'};
    }

    this.projectId = this.credentials.project_id;

    const accessToken = await this.retrieveAccessToken();
    console.log('Installed DialogFlow. Access token: ', accessToken);
  }

  async dispose(): Promise<void> {
    await AsyncStorageHelper.remove(STORAGE_KEY_ACCESS_TOKEN);
    await AsyncStorageHelper.remove(STORAGE_KEY_EXPIRE_TIME);
    return;
  }

  async process(text: any): Promise<{result: NLUResult; error: any}> {
    const accessToken = await this.retrieveAccessToken();
    const sessionId = require('uuid/v4')();
    const url =
      DEFAULT_BASE_URL +
      this.projectId +
      '/agent/sessions/' +
      sessionId +
      ':detectIntent';

    const requestBody = {
      queryInput: {
        text: {text: text, languageCode: 'en-US'},
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: 'Bearer ' + accessToken,
        charset: 'utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('recognition result. status: ', response.status);
    if (response.status === 200) {
      const rawResult: GoogleRecognitionResult = await response.json();
      console.log(rawResult);
      const result = {
        intent: rawResult.queryResult.intent.displayName,
        confidence: rawResult.queryResult.intentDetectionConfidence,
        parameters: rawResult.queryResult.parameters,
      } as NLUResult;

      return {result: result, error: null};
    } else {
      return {
        result: null,
        error: {
          status: response.status,
          statusText: response.statusText,
        },
      };
    }
  }

  private async retrieveAccessToken(): Promise<string> {
    const cachedToken = await AsyncStorageHelper.getString(
      STORAGE_KEY_ACCESS_TOKEN,
    );
    if (cachedToken) {
      const expireTime = await AsyncStorageHelper.getLong(
        STORAGE_KEY_EXPIRE_TIME,
      );
      if (Date.now() < expireTime) {
        return cachedToken;
      }
    }

    const json = await this.authenticate();
    await AsyncStorageHelper.set(STORAGE_KEY_ACCESS_TOKEN, json.access_token);
    await AsyncStorageHelper.set(
      STORAGE_KEY_EXPIRE_TIME,
      Date.now() + json.expires_in * 1000,
    );
    return json.access_token;
  }

  private async authenticate(): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const formData = {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: encodeJWT({
        email: this.credentials.client_email,
        key: this.credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      }),
    };
    const formBody = [];
    for (var property in formData) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(formData[property]);
      formBody.push(encodedKey + '=' + encodedValue);
    }

    const authResponse = await fetch(
      'https://accounts.google.com/o/oauth2/token',
      {
        method: 'POST',
        headers: {
          Accept:
            'application/json, application/xml, text/play, text/html, *.*',
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        body: formBody.join('&'),
      },
    );
    if (authResponse.status != 200) {
      console.log(authResponse)
      throw {error: 'GoogleAuthFail'};
    } else {
      const json = await authResponse.json();
      return json;
    }
  }
}

const instance = new GoogleDialogFlow();

export {instance as googleDialogFlow};
