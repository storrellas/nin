import { controller, httpGet, httpPost, httpPut, httpDelete } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { Request, Response, Express } from 'express';
import * as Sequelize from 'sequelize';
import * as xml2js from 'xml2js';

import TYPES from '../constant/types';
import { IModel } from '../models/model';
import { LoggerInstance, transports, LoggerOptions, WLogger } from '../utils/logger';

import * as jsonwebtoken from 'jsonwebtoken';

@controller('/services/1.1/')
export class TrackingController {

  // Body mass index for pregnancy
  private bmi_max : number = 24.9
  private bmi_min : number = 18.5

  constructor(@inject(TYPES.Model) private model: IModel,
              @inject(TYPES.Logger) private logger: LoggerInstance){
  }

  private get_uid(token : string) : string{
    const item : any = jsonwebtoken.decode(token)
    //this.logger.debug("extracted uid: " + item.sub)
    return item.sub
  }

  /**
    * Calculates weight limits according to bmi formula
    * BMI = (Weight in kilograms  / Height[m]^^2)
    * https://www.fitpregnancy.com/tools/bmi-calculator
    * NORMAL (18.5 to 24.9) 25-35lbs recommended weight gain
    *
    * output[0] -> max weight
    * output[1] -> min weight
    */
  private bmi_weight_limits(height: number) : number[]{
    const weight_max = this.bmi_max * Math.pow(height,2)
    const weight_min = this.bmi_min * Math.pow(height,2)
    return [weight_max, weight_min]
  }

  /**
    * Calculates whether given weight is [lower, normal, higher]
    */
  private async calculate_range(uid: string, weight: number) : Promise<string>{
    try{

      const output : any =
        await this.model.getModel('user').findOne(
          {
            where: {
              id: uid
            }
          })

      // Calculate range
      const weight_array : number[] =
            this.bmi_weight_limits(output.pre_height)
      const weight_max : number = weight_array[0]
      const weight_min : number = weight_array[1]
      let range_str : string = "normal"
      if( weight > weight_max) range_str = "higher"
      if( weight < weight_min) range_str = "lower"
      this.logger.debug("BMI Limits [" + weight_max + "," + weight_min +  "]")
      return Promise.resolve(range_str)

    }catch(e){
      return Promise.resolve('')
    }
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
  public cache_time(request: any, response: Response): Promise<void> {

    // Select timestamp
    const cache_menu_timestamp : number = 1518616381
    const cache_export_timestamp : number = 1509404692
    const cache_foodgroup_timestamp : number = 1518616261

    // Generate response
    const response_json = {
      response: {
          cache: {
              menu: cache_menu_timestamp,
              expert: cache_export_timestamp,
              foodgroups: cache_foodgroup_timestamp,
              reset: 0
          }
      },
      result: 0
    }
    response.json(response_json)
    return Promise.resolve(undefined)
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
    const uid : string = this.get_uid(token)
    this.logger.info("user_login uid:"  + uid)

    // Create custom user if not exists
    this.model.getModel('user').upsert({
      id: uid
    })

    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }

  /**
    * This service launch a User synchronisation between Drupal and Gigya.
    * This method will be called after a change of the Duedate of the Baby.
    * The method do exactly the same than the Login, but it's copied because
    * in the future, the logic could be different.
    */
  @httpPost('custom/user/update')
  public user_update(request: Request, response: Response): Promise<void> {
    const token : any = request.get('token')
    const uid : string = this.get_uid(token)
    this.logger.info("user_update uid:"  + uid)

// ------------------
// Grab information from gigya
// ------------------

    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }


  /**
    * Prepregnancy Data
    */
  @httpPost('custom/user/save_prepregnancy_data')
  public async prepregnancy_create_or_update(request: Request, response: Response): Promise<void> {
    const token : any = request.get('token')
    const uid : string = this.get_uid(token)
    this.logger.info("prepregnancy_create_or_update uid:"  + uid)

    try{
      const output : Array<any> =
        await this.model.getModel('user').update(
          {
            pre_height : request.body.height,
            pre_weight : request.body.weight
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

          const weight_array : number[] =
                this.bmi_weight_limits(parseFloat(request.body.height))
          const bmi_string : string = this.bmi_min + "-" + this.bmi_max
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
    const uid : string = this.get_uid(token)
    this.logger.info("prepregnancy_get uid:"  + uid)

    try{
      const output : any =
        await this.model.getModel('user').findOne(
          {
            where: {
              id: uid
            }
          })

        if( output == undefined ){
          this.logger.error("user not found")
          response.json({result: 'ko'})
        }else{
          const response_json = {
              response: {
                  weight: output.pre_weight,
                  height: output.pre_height,
                  children: uid + "_1516745642557"
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


  /**
    * Image management
    */
  @httpPost('custom/user/load_image')
  public user_load_image(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/user/delete_image')
  public user_delete_image(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/child/load_image')
  public child_load_image(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/child/delete_image')
  public child_delete_image(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }

  /**
    * Dashboard
    */
  @httpPost('custom/user/dashboard')
  public user_dashboard(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }


  /**
    * Weight Tracking
    */
  @httpPost('custom/mum_weight_trackers/create')
  public async mum_weight_tracking_create(request: Request, response: Response): Promise<void> {
    const token : any = request.get('token')
    const uid : string = this.get_uid(token)
    this.logger.info("mum_weight_tracking_create uid:"  + uid)

    try{

      const unix_timestamp : number = parseInt(request.body.date)
      const tracking_weight : any =
          await this.model.getModel('tracking_weight').create({
            user_id               : uid,
            weight                : request.body.weight,
            note                  : request.body.note,
            date                  : unix_timestamp
          })
      this.logger.info("tracking created!")

      // Build response
      const range_str : string =
        await this.calculate_range(uid, parseFloat(request.body.weight))
      const response_json = {
          response: {
              entity: {
                  language: "und",
                  title: "2107776-" + unix_timestamp,
                  status: 1,
                  note: request.body.note,
                  week: "9",
                  weight: request.body.weight,
                  children: uid + "_1516745642557",
                  date: unix_timestamp,
                  mid: tracking_weight.id
              },
              range: range_str
          },
          result: 0
      }
      response.json(response_json)
      return Promise.resolve(undefined)

    }catch(e){
      this.logger.error("Error")
      console.log(e)
      return Promise.reject(undefined)
    }
  }
  @httpPost('custom/mum_weight_trackers/update')
  public async mum_weight_tracking_update(request: Request, response: Response): Promise<void> {
    try{

      const output : any =
        await this.model.getModel('tracking_weight').update(
          {
            note : request.body.note,
            weight : parseFloat(request.body.weight)
          },
          {
            where: {
              id: parseInt(request.body.mid)
            }
          })

      // Check row affected
      if( output[0] == 0 ){
        this.logger.error("id not found")
        response.json({result: 'ko'})
      }else{
        this.logger.info("update ok!")
                    // Build response
        const tracking_weight : any =
          await this.model.getModel('tracking_weight').findOne({
              where: {id: parseInt(request.body.mid)}
            })
        const range_str : string =
          await this.calculate_range(tracking_weight.user_id, parseFloat(request.body.weight))
        const response_json = {
            response: {
                entity: {
                    language: "und",
                    title: "2107776-" + tracking_weight.date,
                    status: 1,
                    note: tracking_weight.note,
                    week: "9",
                    weight: String(tracking_weight.weight),
                    children: tracking_weight.user_id + "_1516745642557",
                    date: tracking_weight.date,
                    mid: tracking_weight.id
                },
                range: range_str
            },
            result: 0
        }
        response.json(response_json)
      }
      return Promise.resolve(undefined)
    }catch(e){
      console.log(e)
      this.logger.error("Error")
      response.json({result: 'ko'})
      return Promise.reject(undefined)
    }



  }
  @httpPost('custom/mum_weight_trackers/list')
  public mum_weight_tracking_retrieve_list(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/mum_weight_trackers/graph')
  public mum_weight_tracking_retrieve_graph(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/mum_weight_trackers/delete')
  public mum_weight_tracking_delete(request: Request, response: Response): Promise<void> {
    this.model.getModel('tracking_weight').destroy({
        where: {id: parseInt(request.body.mid)}
    })
    response.json({result: 0})
    return Promise.resolve(undefined)
  }


  /**
    * Menu Planner
    */
  @httpPost('custom/menus/list')
  public menus_retrieve(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }

  @httpGet('custom/meal_types/list')
  public meal_types_list(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpGet('custom/nutrition_categories/list')
  public nutrition_categories_retrieve(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }


  /**
    * Experts
    */
  @httpGet('custom/expertise/list')
  public expertise_list(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/expertise/detail')
  public expertise_detail(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/expert/detail')
  public expert_detail(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }

}
