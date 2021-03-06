import { controller, httpGet, httpPost, httpPut, httpDelete } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { Request, Response, Express } from 'express';
import * as Sequelize from 'sequelize';

import TYPES from '../constant/types';
import { IModel } from '../models/model';
import { LoggerInstance, transports, LoggerOptions, WLogger } from '../utils/logger';
import * as helper from '../utils/helper';


@controller('/services/1.1/')
export class TrackingWeightController {

  // Body mass index for pregnancy
  private bmi_max : number = 24.9
  private bmi_min : number = 18.5

  constructor(@inject(TYPES.TrackingOptions) private options: helper.TrackingOptions,
              @inject(TYPES.Model) private model: IModel,
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
      return Promise.reject('')
    }
  }


  /**
    * Calculate pregnancy gain chart
    */
  private calculate_pregnancy_gain_chart() : Array<number>[]{

    const max_gain_chart : Array<number> = new Array<number>()
    const min_gain_chart : Array<number> = new Array<number>()


    // For further details see:
    // https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/prenatal-nutrition/eating-well-being-active-towards-healthy-weight-gain-pregnancy-2010.html
    const threshold_week : number = 13
    const max_slope_before_th_week : number = (2.0 - 0.0) / (threshold_week - 0)
    const max_slope_after_th_week : number = ((16.0) - (2.0)) / (helper.pregnancy_weeks - threshold_week)
    const max_y_intercept_after_th_week : number = 2.0 - max_slope_after_th_week * threshold_week

    const min_slope_before_th_week : number = (0.5 - 0.0) / (threshold_week - 0)
    const min_slope_after_th_week : number = (11.5 - 0.5) / (helper.pregnancy_weeks - threshold_week)
    const min_y_intercept_after_th_week : number = 2.0 - min_slope_after_th_week * threshold_week

    // Calculate charts
    let ind : number = 0;
    for( ind = 0; ind < helper.pregnancy_weeks; ind ++){
      if( ind < threshold_week){
        max_gain_chart.push( max_slope_before_th_week * ind )
        min_gain_chart.push( max_slope_before_th_week * ind )
      }else{
        max_gain_chart.push( max_slope_after_th_week * ind + max_y_intercept_after_th_week )
        min_gain_chart.push( min_slope_after_th_week * ind + min_y_intercept_after_th_week )
      }
    }
    return [max_gain_chart, min_gain_chart]
  }

  /**
    * Weight Tracking - Create
    */
  @httpPost('custom/mum_weight_trackers/create')
  public async mum_weight_tracking_create(request: Request, response: Response): Promise<void> {
    this.logger.info("mum_weight_tracking_create uid:"  + request.uid + " gcid:" + request.gcid)

    try{

      const unix_timestamp : number = parseInt(request.body.date)
      const date : Date = helper.epoch_unix_2_date(unix_timestamp)
      const tracking : any =
          await this.model.getModel('tracking_weight').create({
            child_id              : request.gcid,
            weight                : request.body.weight,
            note                  : request.body.note,
            date                  : date
          })
      this.logger.info("tracking created!")

      // Build response
      const child : any =
        await this.model.getModel('child').findOne( { where: { id: request.gcid } })

      // Calculate weeks
      const birth_date : Date = new Date(child.birth_date)
      const conception_date : Date = helper.get_conception_date(birth_date)
      const week_number : number = Math.floor( helper.get_week_from_date(date, conception_date) )

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
                  week: String(week_number),
                  weight: request.body.weight,
                  children: request.gcid,
                  date: unix_timestamp,
                  mid: tracking.id
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
      response.json({result:-1, messge:String(e)})
      return Promise.reject(undefined)
    }
  }

  /**
    * Weight Tracking - Update
    */
  @httpPost('custom/mum_weight_trackers/update')
  public async mum_weight_tracking_update(request: Request, response: Response): Promise<void> {
    this.logger.info("mum_weight_tracking_update uid:" + request.uid + " gcid:" + request.gcid)

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
          await this.model.getModel('child').findOne( { where: { id: request.gcid } })
        // Calculate weeks
        const date : Date = new Date(tracking_weight.date);
        const birth_date : Date = new Date(child.birth_date)
        const conception_date : Date = helper.get_conception_date(birth_date)
        const week_number : number = Math.floor( helper.get_week_from_date(date, conception_date) )


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
                    week: String(week_number),
                    weight: String(tracking_weight.weight),
                    children: request.gcid,
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
      response.json({result:-1, messge:String(e)})
      return Promise.reject(undefined)
    }

  }

  /**
    * Weight Tracking - Retrieve list
    */
  @httpPost('custom/mum_weight_trackers/list')
  public async mum_weight_tracking_retrieve_list(request: Request, response: Response): Promise<void> {
    this.logger.info("mum_weight_tracking_retrieve_list uid:" + request.uid + " gcid:" + request.gcid)

    try{

      const child : any =
        await this.model.getModel('child').findOne( { where: { id: request.gcid } })
      const birth_date : Date = new Date(child.birth_date)

      // Calculate date from week number
      const conception_date : Date = helper.get_conception_date(birth_date)
      const requested_week_number : number = parseInt(request.body.request_number)

      // Retreive trackings
      const tracking_list : any =
        await this.model.getModel('tracking_weight').findAll(
          {
            where: {
              child_id: request.gcid,
              //date: { $lte: requested_date }
            },
            order: [['date', 'DESC']],
          })

      // Fill map of objects
      const week_map : Map<number,{[id:string]:any}> = new Map<number,{[id:string]:any}>()
      let n_trackings : number = 0
      let week_number : number = 0
      for (let tracking of tracking_list) {
        week_number = Math.floor( helper.get_week_from_date(new Date(tracking.date), conception_date) )

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
    * Weight Tracking - Retrieve graph
    */
  @httpPost('custom/mum_weight_trackers/graph')
  public async mum_weight_tracking_retrieve_graph(request: Request, response: Response): Promise<void> {
    this.logger.info("mum_weight_tracking_retrieve_graph uid:" + request.uid + " gcid:" + request.gcid)

    try{

      // Requested weeek number
      const n_requested_week : number = parseInt(request.body.weeks)

      // Obtain trackings
      const tracking_list : any =
        await this.model.getModel('tracking_weight').findAll(
          {
            where: { child_id: request.gcid },
            order: [['date', 'DESC']],
          })
      const child : any =
        await this.model.getModel('child').findOne( { where: { id: request.gcid } })
      const conception_date : Date = helper.get_conception_date(new Date(child.birth_date))

      // Calculate weight chart
      const pregnancy_chart : Array<number>[] = this.calculate_pregnancy_gain_chart()
      const max_pregnancy_chart : Array<number> = pregnancy_chart[0]
      const min_pregnancy_chart : Array<number> = pregnancy_chart[1]

      // Iterate results
      let current_week_number : number = 0
      const week_list = []
      for (let tracking of tracking_list) {
        const week_number : number =
          Math.floor( helper.get_week_from_date(new Date(tracking.date), conception_date) )

        // NOTE: Requirements is that we should get latest week tracking_growth
        // trackings are retreived ordered by date.
        // If( week number changes ) append()
        // else skip()
        if( current_week_number == week_number )
          continue;

        // Store current week number
        current_week_number = week_number

        // Generate week item
        week_list.push({
          y_max:{
            weight: (child.prepregnancy_weight + max_pregnancy_chart[week_number]),
            week: week_number
          },
          y_min:{
            weight: (child.prepregnancy_weight + min_pregnancy_chart[week_number]),
            week: week_number
          },
          current:{
            weight: tracking.weight,
            week: week_number
          }
        })

        // Limit number of items
        if( week_list.length >= (n_requested_week+1) )
          break;
      }

      // Insert item when not enough items
      if( week_list.length < (n_requested_week+1) ){
        week_list.push({
          y_max:{
            weight: child.prepregnancy_weight,
            week: 0
          },
          y_min:{
            weight: child.prepregnancy_weight,
            week: 0
          },
          current:{
            weight: child.prepregnancy_weight,
            week: 0
          }
        })
      }


      // Generate response
      response.json({
        response : {
          weeks: week_list,
        },
        result: 0
      })


      return Promise.resolve(undefined)
    }catch(e){
      this.logger.error("Error")
      console.log(e)
      response.json({result:-1, messge:String(e)})
      return Promise.reject(undefined)
    }
  }

  /**
    * Weight Tracking - Delete
    */
  @httpPost('custom/mum_weight_trackers/delete')
  public mum_weight_tracking_delete(request: Request, response: Response): Promise<void> {
    this.logger.info("mum_weight_tracking_delete mid:" + request.body.mid)
    this.model.getModel('tracking_weight').destroy({
        where: {id: request.body.mid}
    })
    response.json({result: 0})
    return Promise.resolve(undefined)
  }


  /**
    * Dashboard
    */
  @httpPost('custom/user/dashboard')
  public async user_dashboard(request: Request, response: Response): Promise<void> {
    this.logger.info("user_dashboard uid:" + request.uid + " gcid:" + request.gcid)

    try{

      const tracking : any =
        await this.model.getModel('tracking_weight').findOne(
          {
            where: { child_id: request.gcid },
            order: [['date', 'DESC']],
          })

      // Get last week weight
      let query : string = "SELECT id, child_id, weight, note, date, createdAt, MAX(updatedAt) FROM tracking_weight " +
                             "WHERE child_id = '" + request.gcid + "'" +
                             "GROUP BY CONCAT(YEAR(date), '/' ,WEEK(date)) " +
                             "order by date DESC LIMIT 2"
      let output : any = await this.model.raw(query)
      const gain_weight : number = output[0].weight - output[1].weight

      // Get prepregnancy weigth
      const child : any =
        await this.model.getModel('child').findOne( { where: { id: request.gcid } })

      // Get average
      query = "SELECT AVG(weight) as average FROM NIN.tracking_weight " +
                             "WHERE child_id = '" + request.gcid+ "'"
      output = await this.model.raw(query)

      response.json({
        response : {
          pregnancy_weigh: child.prepregnancy_weight,
          last_tracked:{
            weight: tracking.weight,
            date: helper.date_2_epoch_unix(tracking.date)
          },
          average_gain: output[0].average,
          last_week_gain:{
            weight: gain_weight,
            num_days: 7
          },
          last_tracked_modified: helper.date_2_epoch_unix(tracking.updatedAt)
        },
        result: 0
      })
      return Promise.resolve(undefined)
    }catch(e){
      this.logger.error("Error")
      console.log(e)
      response.json({result:-1, messge:String(e)})
      return Promise.reject(undefined)
    }

  }

}
