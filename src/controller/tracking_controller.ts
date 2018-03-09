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

  constructor(@inject(TYPES.Model) private model: IModel,
              @inject(TYPES.Logger) private logger: LoggerInstance){
  }


  private get_uid(token : string) : string{
    const item : any = jsonwebtoken.decode(token)
    //this.logger.debug("extracted uid: " + item.sub)
    return item.sub
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
    * Cache time
    */
  @httpGet('custom/cache/time')
  public cache_time(request: any, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }

  /**
    * WHO Message
    */
  @httpGet('custom/security/message')
  public who_message(request: any, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }

  /**
    * Drupal Sync
    */
  @httpPost('custom/user/login')
  public user_login(request: Request, response: Response): Promise<void> {
    const token : any = request.get('token')
    const uid : string = this.get_uid(token)
    this.logger.info("user_login uid:"  + uid)

    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/user/update')
  public user_update(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }


  /**
    * Prepregnancy Data
    */
  @httpPost('custom/user/save_prepregnancy_data')
  public prepregnancy_create(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/user/get_prepregnancy_data')
  public prepregnancy_get(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
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
  public mum_weight_tracking_create(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/mum_weight_trackers/update')
  public mum_weight_tracking_update(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
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
    response.json({result: 'ok'})
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
