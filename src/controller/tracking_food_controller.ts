import { controller, httpGet, httpPost, httpPut, httpDelete } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { Request, Response, Express } from 'express';
import * as Sequelize from 'sequelize';
import * as DateDiff from 'date-diff';

import TYPES from '../constant/types';
import { IModel } from '../models/model';
import { LoggerInstance, transports, LoggerOptions, WLogger } from '../utils/logger';
import * as helper from '../utils/helper';


@controller('/services/1.1/')
export class TrackingFoodController {

  constructor(@inject(TYPES.Model) private model: IModel,
              @inject(TYPES.Logger) private logger: LoggerInstance){
  }


  /**
    * Food Track - Retrieve
    */
  @httpPost('custom/food_type/list')
  public async food_type_retrieve(request: Request, response: Response): Promise<void> {
    this.logger.info("food_type_retrieve")

    try{

    const food_type_list : any =
      await this.model.getModel('food_type').findAll({
        attributes: [['id','tid'], 'name', ['icon', 'field_icon'], 'gtm_label']
      })

      const response_json = {
        response: {
          food_type: food_type_list
        },
        result: 0
      }
      response.json(response_json)
      return Promise.resolve(undefined)
    }catch(e){
      this.logger.error("Error")
      console.log(e)
      response.json({result:-1})
      return Promise.reject(undefined)
    }
  }

  /**
    * Food Track - Retrieve
    */
  @httpPost('custom/food_track/create')
  public async food_track_create(request: Request, response: Response): Promise<void> {
    this.logger.info("food_type_retrieve")

    try{

      const unix_timestamp : number = parseInt(request.body.date)
      const tracking : any =
          await this.model.getModel('tracking_food').create({
            child_id              : request.gcid,
            food_type_id          : request.body.food_type,
            left_amount           : request.body.left_amount,
            right_amount          : request.body.right_amount,
            last_breast           : request.body.last_breast,
            comment               : request.body.comment,
            date                  : helper.epoch_unix_2_date(unix_timestamp)
          })
      this.logger.info("tracking created!")

      const response_json = {
        response: {
          food_type : tracking.food_type,
          date: unix_timestamp,
          left_amount: tracking.left_amount,
          right_amount: tracking.right_amount,
          last_breast: tracking.last_breast,
          comment: tracking.comment,
          week: "",
          children: request.gcid,
          uid: request.uid,
          nid: tracking.id
        },
        result: 0
      }
      response.json(response_json)
      return Promise.resolve(undefined)
    }catch(e){
      this.logger.error("Error")
      console.log(e)
      response.json({result:-1})
      return Promise.reject(undefined)
    }
  }

}
