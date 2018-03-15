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
    * Food Track - Create
    */
  @httpPost('custom/food_track/create')
  public async food_track_create(request: Request, response: Response): Promise<void> {
    this.logger.info("food_track_create uid:" + request.uid + " gcid:" + request.gcid)

    try{

      const unix_timestamp : number = parseInt(request.body.date)
      const tracking : any =
          await this.model.getModel('tracking_food').create({
            child_id      : request.gcid,
            food_type_id  : request.body.food_type,
            left_amount   : request.body.left_amount,
            right_amount  : request.body.right_amount,
            last_breast   : request.body.last_breast,
            comment       : request.body.comment,
            owner         : request.body.owner,
            date          : helper.epoch_unix_2_date(unix_timestamp)
          })
      this.logger.info("tracking created!")

      const child : any =
        await this.model.getModel('child').findOne( { where: { id: request.gcid } })

      // Calculate response
      const week_number : number =
          helper.date_2_week_age(new Date(tracking.date), new Date(child.birth_date))
      const response_json = {
        response: {
          food_type       : tracking.food_type,
          date            : helper.date_2_epoch_unix(tracking.date),
          left_amount     : tracking.left_amount,
          right_amount    : tracking.right_amount,
          last_breast     : tracking.last_breast,
          owner           : tracking.owner,
          comment         : tracking.comment,
          week            : week_number,
          children        : tracking.gcid,
          uid             : request.uid,
          nid             : tracking.id
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
    * Food Track - Update
    */
  @httpPost('custom/food_track/update')
  public async food_track_update(request: Request, response: Response): Promise<void> {
    this.logger.info("food_track_update uid:" + request.uid + " gcid:" + request.gcid)

    try{
      const output : any =
        await this.model.getModel('tracking_food').update(
          {
            left_amount   : request.body.left_amount,
            right_amount  : request.body.right_amount,
            last_breast   : request.body.last_breast,
            owner         : request.body.owner,
            comment       : request.body.comment,
          },
          {
            where: {
              id: request.body.nid
            }
          })

      // Check row affected
      if( output[0] == 0 ){
        this.logger.error("id not found")
        response.json({result: 'ko'})
      }else{
        this.logger.info("update ok!")
        // Build response
        const tracking : any =
          await this.model.getModel('tracking_food').findOne({
              where: {id: request.body.nid}
            })
        // Build response
        const child : any =
          await this.model.getModel('child').findOne( { where: { id: request.gcid } })

        // Calculate response
        const week_number : number =
            helper.date_2_week_age(new Date(tracking.date), new Date(child.birth_date))
        const response_json = {
          response: {
            food_type     : tracking.food_type,
            date          : helper.date_2_epoch_unix(tracking.date),
            left_amount   : tracking.left_amount,
            right_amount  : tracking.right_amount,
            last_breast   : tracking.last_breast,
            owner         : tracking.owner,
            comment       : tracking.comment,
            week          : week_number,
            children      : request.gcid,
            uid           : request.uid,
            nid           : tracking.id
          },
          result: 0
        }
        response.json(response_json)
      }
      return Promise.resolve(undefined)
    }catch(e){
      this.logger.error("Error")
      console.log(e)
      response.json({result:'ko'})
      return Promise.reject(undefined)
    }
  }

  /**
    * Growth Tracking - Retrieve
    */
  @httpPost('custom/food_track/list')
  public async food_track_list(request: Request, response: Response): Promise<void> {
    this.logger.info("food_track uid:" + request.uid + " gcid:" + request.gcid)

    try{

      const output : any =
        await this.model.getModel('tracking_food').findAll(
          {
            where: {
              child_id: request.gcid,
              owner: request.body.requester
            },
            order: [['date', 'DESC']]
          })

      const child : any =
        await this.model.getModel('child').findOne( { where: { id: request.gcid } })

      // Generate week_set
      const week_set = new Set<number>()
      for (let tracking of output) {
        const week_number : number =
          helper.date_2_week_age(new Date(tracking.date), new Date(child.birth_date))
        week_set.add(week_number)
      }

      // Generate map of objects
      const week_map : Map<number,{[id:string]:any}> = new Map<number,{[id:string]:any}>()
      for (let item of week_set) {
        week_map.set(item, { week: String(item), tracks: [] })
      }

      // Fill map of objects
      for (let tracking of output) {
        const week_number : number =
          helper.date_2_week_age(new Date(tracking.date), new Date(child.birth_date))

        const item = {
          mid            : tracking.id,
          date           : helper.date_2_epoch_unix(tracking.date),
          left_amount    : tracking.left_amount,
          right_amount   : tracking.right_amount,
          last_breast    : tracking.last_breast,
          pumped         : tracking.pumped,
          comment        : tracking.comment,
          children       : tracking.child_id
        }
        week_map.get(week_number).tracks.push(item)
      }

      // Generate week_list
      const week_list : {[id:string]:any}[] = Array.from(week_map.values())

      // Generate response
      const response_json = {
          response: {
              list: week_list
          },
          result: 0
      }
      response.json(response_json)

      return Promise.resolve(undefined)
    }catch(e){
      this.logger.error("Error")
      console.log(e)
      response.json({result:'ko'})
      return Promise.reject(undefined)
    }
  }


  /**
    * Food Track - Delete
    */
  @httpPost('custom/food_track/delete')
  public async food_track_delete(request: Request, response: Response): Promise<void> {
    this.logger.info("food_track_delete mid:" + request.body.mid)
    this.model.getModel('tracking_food').destroy({
        where: {id: request.body.mid}
    })
    response.json({result: 0})
    return Promise.resolve(undefined)
  }
}
