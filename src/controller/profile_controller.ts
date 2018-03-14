import { controller, httpGet, httpPost, httpPut, httpDelete } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { Request, Response, Express } from 'express';
import * as Sequelize from 'sequelize';

import TYPES from '../constant/types';
import { IModel } from '../models/model';
import { LoggerInstance, transports, LoggerOptions, WLogger } from '../utils/logger';
import * as helper from '../utils/helper';
import { GigyaResponse, Account, GigyaOptions, GigyaService } from '../service/gigya_service';

@controller('/services/1.1/')
export class ProfileController {

  constructor(@inject(TYPES.GigyaService) private gigya : GigyaService,
              @inject(TYPES.Model) private model: IModel,
              @inject(TYPES.Logger) private logger: LoggerInstance){
  }


  /**
    * Ping
    */
  @httpGet('ping/')
  public ping(request: any, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }

  /**
    * The App will have a cache to store different groups of information.
    * This method will return the timestamp of the last modification of each of this groups.
    * If we detect a change on that timestamp we will recover the information from server again.
    * https://wiki.nespresso.com/display/NMTPS/API+Content+Cache
    */
  @httpGet('custom/cache/time')
  public async cache_time(request: any, response: Response): Promise<void> {

    try{

      // Get timestamps
      let output : any =
        await this.model.getModel('menu').findOne({
          attributes: ['updatedAt'],
          order: [['updatedAt', 'DESC']]
        })
      const cache_menu_timestamp : number =
            helper.date_2_epoch_unix( output.updatedAt )
      output =
        await this.model.getModel('expertise').findOne({
          attributes: ['updatedAt'],
          order: [['updatedAt', 'DESC']]
        })
      const cache_expert_timestamp : number =
            helper.date_2_epoch_unix( output.updatedAt )
      output =
        await this.model.getModel('nutrition_component').findOne({
          attributes: ['updatedAt'],
          order: [['updatedAt', 'DESC']]
        })
      const cache_foodgroup_timestamp : number =
            helper.date_2_epoch_unix( output.updatedAt )

      // Generate response
      const response_json = {
        response: {
            cache: {
                menu: cache_menu_timestamp,
                expert: cache_expert_timestamp,
                foodgroups: cache_foodgroup_timestamp,
                reset: 0
            }
        },
        result: 0
      }
      response.json(response_json)

    }catch(e){
      this.logger.error("error")
      console.log(e)
      return Promise.reject(undefined)
    }
  }

  /**
    * WHO Message
    */
  @httpGet('custom/security/message')
  public who_message(request: any, response: Response): Promise<void> {
    this.logger.info("who_message")

    // Generate response
    const response_json = {
      response: {
          nid: 4646,
          title_field: "La Organización Mundial de la Salud (OMS)",
          field_description: 'La OMS recomienda la lactancia materna exclusiva hasta los 6 meses.\r\n \
Nestlé apoya esta recomendación en conjunto con la introducción \
de la alimentación complementaria a partir \
de los 6 meses de acuerdo con las recomendaciones de tu profesional de la salud.',
          field_sm_checkbox_text: null,
          field_sm_confirm_text: "CLICK PARA CONTINUAR"
      },
      result: 0
    }
    response.json(response_json)

    return Promise.resolve(undefined)
  }

  /**
    * This service have 2 functions:
    *
    * This service launch a User synchronisation between Drupal and Gigya.
    * This method will be called 2 times:
    *    When the user starts the App (doing Login or with the remember me checkbox selected).
    *    After the user add a Pregnancy/Baby
    * In the response, the method returns the timestamp of the last track,
    * this timestamp is used for the local cache of the user tracks.
    */
  @httpPost('custom/user/login')
  public user_login(request: Request, response: Response): Promise<void> {
    const token : any = request.get('token')
    const uid : string = helper.get_uid(token)
    this.logger.info("user_login uid:"  + uid)

    // Create custom user if not exists
    this.model.getModel('user').upsert({
      id: uid
    })

    response.json({result: 0})
    return Promise.resolve(undefined)
  }

  /**
    * This service launch a User synchronisation between Drupal and Gigya.
    * This method will be called after a change of the Duedate of the Baby.
    * The method do exactly the same than the Login, but it's copied because
    * in the future, the logic could be different.
    */
  @httpPost('custom/user/update')
  public async user_update(request: Request, response: Response): Promise<void> {
    const token : any = request.get('token')
    const uid : string = helper.get_uid(token)
    const api_key : string = helper.get_api_key(token)
    this.logger.info("user_update uid:"  + uid)
    this.logger.info("user_update api_key:"  + api_key)

    try{

      // ------------------
      // Grab information from gigya
      // ------------------
      const gigya_response : GigyaResponse & Account =
        await this.gigya.get_account_info(uid)

      this.logger.debug("gigya response -> " + JSON.stringify(gigya_response))

      // Create child
      for (let item of gigya_response.data.child) {
          this.model.getModel('child').upsert({
            id: item.applicationInternalIdentifier,
            user_id : uid,
            birth_date : item.birthDate,
            birth_date_reliability : item.birthDateReliability,
            name: item.name
          })

      }

      // Information from Gigya should be parsed in here
      const output : Array<any> =
        await this.model.getModel('user').update(
          {
            gigya_data : JSON.stringify(gigya_response.data)
          },
          {
            where: {
              id: uid
            }
          })
        // Check row affected
        if( output[0] == 0 ){
          this.logger.error("uid not found")
          response.json({result: 'ko'})
        }else{
          this.logger.info("update ok!")
          const response_json = {
                      response: {
                          last_tracked: 1516609740,
                          last_tracked_modified: 1516609740
                      },
                      result: 0
                  }
          response.json(response_json)
        }


      return Promise.resolve(undefined)
    }catch(e){
      response.json({result: 'ko'})
      return Promise.reject(undefined)
    }

  }


  /**
    * Prepregnancy Data
    */
  @httpPost('custom/user/save_prepregnancy_data')
  public async prepregnancy_create_or_update(request: Request, response: Response): Promise<void> {
    const token : any = request.get('token')
    const gcid : any = request.get('gcid')
    const uid : string = helper.get_uid(token)
    this.logger.info("prepregnancy_create_or_update uid:"  + uid + " gcid:" + gcid)

    try{
        const output : Array<any> =
          await this.model.getModel('child').update(
            {
              prepregnancy_height : request.body.height,
              prepregnancy_weight : request.body.weight
            },
            {
              where: {
                id: gcid
              }
            })


        // Check row affected
        if( output[0] == 0 ){
          this.logger.error("uid not found")
          response.json({result: 'ko'})
        }else{
          this.logger.info("update ok!")

          const weight_array : number[] =
                helper.bmi_weight_limits(parseFloat(request.body.height))
          const bmi_string : string = helper.bmi_min + "-" + helper.bmi_max
          const response_json = {
                  response: {
                      range: {
                          max: weight_array[0],
                          min: weight_array[1]
                      },
                      BMI: bmi_string,
                      trimester: 3
                  },
                  result: 0
              }
          response.json(response_json)
        }
        return Promise.resolve(undefined)

    }catch(e){
      console.log(e)
      this.logger.error("exception raised")
      response.json({result: 'ko'})
      return Promise.reject(undefined)
    }
  }
  @httpPost('custom/user/get_prepregnancy_data')
  public async prepregnancy_get(request: Request, response: Response): Promise<void> {
    const token : any = request.get('token')
    const gcid : any = request.get('gcid')
    const uid : string = helper.get_uid(token)
    this.logger.info("prepregnancy_get uid:"  + uid + " gcid:" + gcid)

    try{
        const output : any =
          await this.model.getModel('child').findOne(
            {
              where: {
                id: gcid
              }
            })


        if( output == undefined ){
          this.logger.error("user not found")
          response.json({result: 'ko'})
        }else{
          const response_json = {
              response: {
                  height: output.prepregnancy_height,
                  weight: output.prepregnancy_weight,
                  children: output.id
              },
              result: 0
          }
          this.logger.info("updated ok!")
          response.json(response_json)
        }
        return Promise.resolve(undefined)

    }catch(e){
      console.log(e)
      this.logger.error("exception raised")
      response.json({result: 'ko'})
      return Promise.reject(undefined)
    }
  }


}
