import { controller, httpGet, httpPost, httpPut, httpDelete } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { Request, Response, Express } from 'express';

import TYPES from '../constant/types';
import { LoggerInstance, transports, LoggerOptions, WLogger } from '../utils/logger';

// Include Gigya's SDK
import { Gigya, GigyaResponse,
          AccountsGetJWTPublicKeyResponse, Account, SessionInfo,
          AccountsGetJWTResponse} from 'gigya';

export { GigyaResponse,
          AccountsGetJWTPublicKeyResponse, Account, SessionInfo,
          AccountsGetJWTResponse } from 'gigya';

export class GigyaOptions {
  api_key     : string;
  data_center : string;
  user_key    : string;
  secret      : string;
}

export class GigyaService {

  private gigya : Gigya;

  constructor(private options : GigyaOptions,
              @inject(TYPES.Logger) private logger: LoggerInstance)
  {
    this.gigya = new Gigya(options.api_key, options.data_center,
                            options.user_key, options.secret);

// // ----------------
//     this.get_jwt_token('oxn93112@ckoie.com', '12345678')
//     .then( (jwt_token: string) => {
//       this.logger.info("TOOOOKEN -> " + jwt_token)
//     })
// // ----------------
  }

  public async get_jwt_token(login: string, password: string) : Promise<string> {

    try{

      // get JWT public key
      let response : any = await this.get_jwt_public_key()
      //this.logger.info(JSON.stringify(response,null,2))

      // Login
      response  = await this.login(login, password)
      const uid : string = response.UID
      //this.logger.info(JSON.stringify(response,null,2))

      // Get Account Info
      response = await this.get_account_info(uid)
      //this.logger.info(JSON.stringify(response,null,2))

      // Get JWT
      response = await this.get_jwt(uid)
      //this.logger.info(JSON.stringify(response,null,2))

      const jwt_token : string = response.id_token
      this.logger.debug("Obtained JWT token -> " +  jwt_token)
      return Promise.resolve(jwt_token)

    }catch(e){
      this.logger.error(e)
      return Promise.reject(undefined)
    }


  }

  public login(login : string, password : string, api_key: string = undefined) : Promise<GigyaResponse & Account & SessionInfo>{
    return this.gigya.accounts.login({
              apiKey: api_key,
              loginID: login,
              password : password,
              include: 'data',
              sessionExpiration : 60000
            })
  }

  public get_account_info(uid : string, api_key: string = undefined) : Promise<GigyaResponse & Account>{
    return this.gigya.accounts.getAccountInfo({ apiKey: api_key, UID: uid })
  }

  public get_jwt_public_key(api_key: string = undefined) : Promise<GigyaResponse & AccountsGetJWTPublicKeyResponse>{
    return this.gigya.accounts.getJWTPublicKey({ apiKey: api_key })
  }

  public get_jwt(uid : string, api_key: string = undefined) : Promise<GigyaResponse & AccountsGetJWTResponse>{
    return this.gigya.accounts.getJWT({ apiKey: api_key, targetUID: uid })
  }

}
