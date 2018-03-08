import { controller, httpGet, httpPost, httpPut, httpDelete } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { Request, Response, Express } from 'express';

import TYPES from '../constant/types';
import { IModels } from '../models/model';
import { LoggerInstance, transports, LoggerOptions, WLogger } from '../utils/logger';

// Include Gigya's SDK
import { Gigya,
         GigyaResponse,
       AccountsGetJWTPublicKeyResponse,
     Account,
   SessionInfo,
 AccountsGetJWTResponse} from 'gigya';

export class GigyaOptions {
  api_key     : string;
  data_center : string;
  user_key    : string;
  secret      : string;
}

@controller('')
export class GigyaController {

  private gigya : Gigya;

  constructor(@inject(TYPES.GigyaOptions) private options : GigyaOptions,
              @inject(TYPES.Logger) private logger: LoggerInstance)
  {
    this.gigya = new Gigya(options.api_key, options.data_center,
                            options.user_key, options.secret);

  }

  public get_jwt_public_key() : Promise<GigyaResponse & AccountsGetJWTPublicKeyResponse>{
    return this.gigya.accounts.getJWTPublicKey()
  }

  public get_account_info(uid : string) : Promise<GigyaResponse & Account>{
    return this.gigya.accounts.getAccountInfo({ UID: uid })
  }

  public login(login : string, password : string) : Promise<GigyaResponse & Account & SessionInfo>{
    return this.gigya.accounts.login({
              loginID: login,
              password : password,
              include: 'data',
              sessionExpiration : 60000
            })
  }

  public get_jwt(uid : string) : Promise<GigyaResponse & AccountsGetJWTResponse>{
    return this.gigya.accounts.getJWT({ targetUID: uid })
  }

}
