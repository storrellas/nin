import { controller, httpGet, httpPost, httpPut, httpDelete } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { Request, Response, Express } from 'express';
import * as Sequelize from 'sequelize';

import TYPES from '../constant/types';
import { IModel } from '../models/model';
import { LoggerInstance, transports, LoggerOptions, WLogger } from '../utils/logger';
import * as helper from '../utils/helper';


@controller('/services/1.1/')
export class TrackingGrowthController {

  constructor(@inject(TYPES.TrackingOptions) private options: helper.TrackingOptions,
              @inject(TYPES.Model) private model: IModel,
              @inject(TYPES.Logger) private logger: LoggerInstance){
  }

  /**
    * Growth Tracking - Create
    */
  @httpPost('custom/child_growth_trackers/create')
  public async child_growth_trackers_create(request: Request, response: Response): Promise<void> {
    this.logger.info("child_growth_trackers_create uid:"  + request.uid + " gcid:" + request.gcid)

    try{

      const unix_timestamp : number = parseInt(request.body.date)
      const tracking : any =
          await this.model.getModel('tracking_growth').create({
            child_id              : request.gcid,
            weight                : request.body.weight,
            height                : request.body.height,
            date                  : helper.epoch_unix_2_date(unix_timestamp)
          })
      this.logger.info("tracking created!")

      // Build response
      const child : any =
        await this.model.getModel('child').findOne( { where: { id: request.gcid } })

      // Calculate weeks
      const date : Date = new Date(tracking.date)
      const week_number : number =
          Math.floor(helper.get_week_from_date(date, new Date(child.birth_date)))

      // Calculate range
      const response_json = {
          response: {
              growth_curve_data: {
                weight: request.body.weigth,
                height: request.body.height,
                date: unix_timestamp,
                week: week_number,
                children: request.gcid,
                mid: tracking.id
              }
          },
          result: 0
      }
      response.json(response_json)
      return Promise.resolve(undefined)
    }catch(e){
      this.logger.error("Error")
      console.log(e)
      response.json({result:-1, messge:String(e)})
      return Promise.reject(undefined)
    }
  }

  /**
    * Growth Tracking - Retrieve
    */
  @httpPost('custom/child_growth_trackers/list')
  public async child_growth_trackers_retrieve(request: Request, response: Response): Promise<void> {
    this.logger.info("child_growth_trackers_retrieve uid:" + request.uid + " gcid:" + request.gcid)

    try{

      const child : any =
        await this.model.getModel('child').findOne( { where: { id: request.gcid } })
      const birth_date : Date = new Date(child.birth_date)

      // Calculate date from week number
      const requested_week_number : number = parseInt(request.body.request_number)

      // Retreive trackings
      const tracking_list : any =
        await this.model.getModel('tracking_growth').findAll(
          {
            where: { child_id: request.gcid },
            order: [['date', 'DESC']]
          })



      // Fill map of objects
      const week_map : Map<number,{[id:string]:any}> = new Map<number,{[id:string]:any}>()
      let n_trackings : number = 0
      let week_number : number = 0
      for (let tracking of tracking_list) {
        week_number = Math.floor( helper.get_week_from_date(new Date(tracking.date), birth_date) )

        // NOTE: Only retreive those
        if( week_number > requested_week_number ){
          continue;
        }

        // NOTE: Retrieve max_tracking_list items taking into account complete tracking weeks
        // That is, n_trackings could be greater than max_trackings_list to append remaining tracks
        if( n_trackings >= this.options.max_trackings_list ){
          if( !week_map.has(week_number) ){
            break;
          }
        }

        // Add item to map if not exists
        if( !week_map.has(week_number) ){
          week_map.set(week_number, { week: String(week_number), tracks: [] })
        }

        // Append item
        const item = {
          mid : tracking.id,
          weight: tracking.weight,
          note: tracking.node,
          children: tracking.child_id,
          timestamp: helper.date_2_epoch_unix(tracking.date)
        }

        // Append item
        const value : any = week_map.get(week_number)
        value.tracks.push(item)
        n_trackings ++;
      }

      // Generate week_list
      const week_list : {[id:string]:any}[] = Array.from(week_map.values())

      // Generate response
      const response_json = {
          response: {
              list: week_list
          },
          request_number : week_number,
          result: 0
      }
      response.json(response_json)

      return Promise.resolve(undefined)
    }catch(e){
      console.log(e)
      this.logger.error("Error")
      response.json({result:-1, messge:String(e)})
      return Promise.reject(undefined)
    }

  }

  /**
    * Growth Tracking - Update
    */
  @httpPost('custom/child_growth_trackers/update')
  public async child_growth_trackers_update(request: Request, response: Response): Promise<void> {
    this.logger.info("child_growth_trackers_update uid:" + request.uid + " gcid:" + request.gcid)
    try{
      const output : any =
        await this.model.getModel('tracking_growth').update(
          {
            height : parseFloat(request.body.height),
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
        const tracking : any =
          await this.model.getModel('tracking_growth').findOne({
              where: {id: parseInt(request.body.mid)}
            })
        // Build response
        const child : any =
          await this.model.getModel('child').findOne( { where: { id: request.gcid } })

        // Calculate weeks
        const week_number : number =
            Math.floor(helper.get_week_from_date(new Date(tracking.date), new Date(child.birth_date)))


        // Calculate range
        const response_json = {
            response: {
                growth_curve_data: {
                  weight: request.body.weigth,
                  height: request.body.height,
                  date: helper.date_2_epoch_unix(tracking.date),
                  week: String(week_number),
                  children: request.gcid,
                  mid: tracking.id
                }
            },
            result: 0
        }
        response.json(response_json)
      }
      return Promise.resolve(undefined)
    }catch(e){
      this.logger.error("Error")
      console.log(e)
      response.json({result:-1, messge:String(e)})
      return Promise.reject(undefined)
    }
  }

  /**
    * Growth Tracking - Delete
    */
  @httpPost('custom/child_growth_trackers/delete')
  public child_growth_trackers_delete(request: Request, response: Response): Promise<void> {
    this.logger.info("child_growth_trackers_delete mid:" + request.body.mid)
    this.model.getModel('tracking_growth').destroy({
        where: {id: request.body.mid}
    })

    response.json({result: 0})
    return Promise.resolve(undefined)
  }

}
