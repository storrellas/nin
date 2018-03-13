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
export class TrackingController {

  // Body mass index for pregnancy
  private bmi_max : number = 24.9
  private bmi_min : number = 18.5
  private pregnancy_weeks : number = 40
  private pregnancy_days : number = this.pregnancy_weeks*7

  constructor(@inject(TYPES.Model) private model: IModel,
              @inject(TYPES.Logger) private logger: LoggerInstance){
  }


  /**
    * Calculates whether given weight is [lower, normal, higher]
    */
  private async calculate_range(child: any, weight: number) : Promise<string>{
    try{
      // Calculate range
      const weight_array : number[] =
            helper.bmi_weight_limits(child.prepregnancy_height)
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
    * Weight Tracking
    */
  private calculate_diff_weeks(date1 : Date, date2 : Date) : number {

  }

  /**
    * Weight Tracking
    */
  @httpPost('custom/mum_weight_trackers/create')
  public async mum_weight_tracking_create(request: Request, response: Response): Promise<void> {
    const token : any = request.get('token')
    const gcid : any = request.get('gcid')
    const uid : string = helper.get_uid(token)
    this.logger.info("mum_weight_tracking_create uid:"  + uid)

    try{

      const unix_timestamp : number = parseInt(request.body.date)
      const tracking_weight : any =
          await this.model.getModel('tracking_weight').create({
            child_id              : gcid,
            weight                : request.body.weight,
            note                  : request.body.note,
            date                  : unix_timestamp
          })
      this.logger.info("tracking created!")

      // Build response
      const child : any =
        await this.model.getModel('child').findOne( { where: { id: gcid } })

      // Calculate weeks
      const birth_date : Date = new Date(child.birth_date)
      const now_date : Date = new Date();
      const conception_date : Date = birth_date.setDate(birth_date.getDate()-this.pregnancy_days)
      const diff = new DateDiff( new Date(), birth_date )

      // Calculate range
      const range_str : string =
        await this.calculate_range(child, parseFloat(request.body.weight))
      const response_json = {
          response: {
              entity: {
                  language: "und",
                  title: "2107776-" + unix_timestamp,
                  status: 1,
                  note: request.body.note,
                  week: String(parseInt(diff.weeks())),
                  weight: request.body.weight,
                  children: gcid,
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
    const token : any = request.get('token')
    const gcid : any = request.get('gcid')
    const uid : string = helper.get_uid(token)
    this.logger.info("mum_weight_tracking_update uid:"  + uid)

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
        const child : any =
          await this.model.getModel('child').findOne( { where: { id: gcid } })
        // Calculate weeks
        const birth_date : Date = new Date(child.birth_date)
        const now_date : Date = new Date();
        const conception_date : Date = birth_date.setDate(birth_date.getDate()-this.pregnancy_days)
        const diff = new DateDiff( new Date(), birth_date )

        // Calculate range
        const range_str : string =
          await this.calculate_range(child, parseFloat(request.body.weight))
        const response_json = {
            response: {
                entity: {
                    language: "und",
                    title: "2107776-" + tracking_weight.date,
                    status: 1,
                    note: tracking_weight.note,
                    week: String(parseInt(diff.weeks())),
                    weight: String(tracking_weight.weight),
                    children: gcid,
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

// http://www.pregnancy-week-by-week.info/pregnancy-wellness/weight-gain.html

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

}
