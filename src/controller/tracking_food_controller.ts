import { controller, httpGet, httpPost, httpPut, httpDelete } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { Request, Response, Express } from 'express';
import * as Sequelize from 'sequelize';

import TYPES from '../constant/types';
import { IModel } from '../models/model';
import { LoggerInstance, transports, LoggerOptions, WLogger } from '../utils/logger';
import * as helper from '../utils/helper';


@controller('/services/1.1/')
export class TrackingFoodController {

  constructor(@inject(TYPES.TrackingOptions) private options: helper.TrackingOptions,
              @inject(TYPES.Model) private model: IModel,
              @inject(TYPES.Logger) private logger: LoggerInstance){
  }

  private generate_entity(tracking : any, ingredient_list : any , child : any) : any {

    // Calculate response
    const week_number : number =
        Math.floor(helper.get_week_from_date(new Date(tracking.date), new Date(child.birth_date)))

    // Add common fields
    let entity : any = {
      nid           : tracking.id,
      food_type     : tracking.food_type_id,
      date          : helper.date_2_epoch_unix(tracking.date),
    }
    // Add tracking for breastmilk, pumped_child and pumped_mum
    if( tracking.left_amount ){
      entity.left_amount = tracking.left_amount
      entity.right_amount = tracking.right_amount
      entity.last_breast = tracking.last_breast
    }
    // Add tracking for formula
    if( tracking.formula_name ){
      entity.formula_name = tracking.formula_name
      entity.quantity = tracking.quantity
    }
    // Add tracking for solid
    if( tracking.reaction ){
      entity.reaction = tracking.reaction
      entity.ingredients = ingredient_list
      entity.quantity = tracking.quantity
    }
    // Add rest of common fields
    entity.comment = tracking.comment,
    entity.date = helper.date_2_epoch_unix(tracking.date)
    entity.week = week_number,
    entity.children = child.id
    return entity

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

            // Fields for breastmilk, pumped_child and pumped_mum
            left_amount   : request.body.left_amount,
            right_amount  : request.body.right_amount,
            last_breast   : request.body.last_breast,

            // Fields for formula, solid
            quantity      : request.body.quantity,
            // Fields for formula
            formula_name  : request.body.formula_name,
            // Fields for solid
            reaction      : request.body.reaction,

            comment       : request.body.comment,
            date          : helper.epoch_unix_2_date(unix_timestamp)
          })
      this.logger.info("tracking created!")

      // Iterate ingredients
      const ingredient_list = []
      if( request.body.ingredients ){
        for (let ingredient of request.body.ingredients) {
          const food_ingredient : any =
              await this.model.getModel('tracking_food_ingredient').create({
                tracking_food_id : tracking.id,
                ingredient_id : ingredient
              })
          ingredient_list.push(food_ingredient.ingredient_id)
        }
      }

      // Retrieve child
      const child : any =
        await this.model.getModel('child').findOne( { where: { id: request.gcid } })

      // Generate entity
      const entity : any =
        this.generate_entity(tracking, ingredient_list, child)
      response.json({
          response: entity,
          result: 0
      })
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
            // Fields for breastmilk, pumped_child and pumped_mum
            left_amount   : request.body.left_amount,
            right_amount  : request.body.right_amount,
            last_breast   : request.body.last_breast,

            // Fields for formula, solid
            quantity      : request.body.quantity,
            // Fields for formula
            formula_name  : request.body.formula_name,
            // Fields for solid
            reaction      : request.body.reaction,

            comment       : request.body.comment,
          },
          {
            where: {
              id: request.body.nid
            }
          })

      // Iterate ingredients
      await this.model.getModel('tracking_food_ingredient').destroy({
        where: {
          tracking_food_id: request.body.nid
        }
      })
      if( request.body.ingredients ){
        for (let ingredient of request.body.ingredients) {
          const food_ingredient : any =
              await this.model.getModel('tracking_food_ingredient').create({
                tracking_food_id : request.body.nid,
                ingredient_id : ingredient
              })
        }
      }


      // Check row affected
      if( output[0] == 0 ){
        this.logger.error("id not found")
        response.json({result: 'ko'})
      }else{
        this.logger.info("update ok!")
        // Build response
        const tracking : any =
          await this.model.getModel('tracking_food').findOne({
              include: [
                {
                 model: this.model.getModel('tracking_food_ingredient')
                }
              ],
              where: {id: request.body.nid}
            })


        // Retrieve child
        const child : any =
          await this.model.getModel('child').findOne( { where: { id: request.gcid } })

        const ingredient_list = []
        for (let ingredient of tracking.tracking_food_ingredients) {
          ingredient_list.push(ingredient.ingredient_id)
        }

        // Generate entity
        const entity : any =
          this.generate_entity(tracking, ingredient_list, child)
        response.json({
            response: entity,
            result: 0
        })
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

      const child : any =
        await this.model.getModel('child').findOne( { where: { id: request.gcid } })
      const birth_date : Date = new Date(child.birth_date)

      // Calculate date from week number
      const requested_week_number : number = parseInt(request.body.request_number)

      // Retreive trackings
      const tracking_list : any =
        await this.model.getModel('tracking_food').findAll({
            include: [
              {
               model: this.model.getModel('tracking_food_ingredient')
              }
            ],
            where: {
              child_id: request.gcid,
              food_type_id: request.body.type
            },
            order: [['date', 'DESC']],
          })

      let response_list : {[id:string]:any}[] = []
      let week_number : number = 0;
      if( request.get('raw') == 'true'){

        for (let tracking of tracking_list) {
          const item : any =
             this.generate_entity(tracking, [], child)
             response_list.push(item)
         }

      } // END: IF -----------------------------------
      else
      {
        // Fill map of objects
        const week_map : Map<number,{[id:string]:any}> = new Map<number,{[id:string]:any}>()
        let n_trackings : number = 0
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

          const ingredient_list = []
          for (let ingredient of tracking.tracking_food_ingredients) {
            ingredient_list.push(ingredient.ingredient_id)
          }

          // Generate entity
          const item : any =
             this.generate_entity(tracking, ingredient_list, child)

          // Append item
          const value : any = week_map.get(week_number)
          value.tracks.push(item)
          n_trackings ++;
        }

        // Generate week_list
        response_list = Array.from(week_map.values())

      } // END: ELSE -----------------------------------



      // Generate response
      const response_json = {
          response: {
              list: response_list
          },
          request_number : week_number,
          result: 0
      }
      response.json(response_json)

      return Promise.resolve(undefined)
    }catch(e){
      console.log(e)
      this.logger.error("Error")
      response.json({result: 0})
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
    * Ingredients
    */
  @httpPost('custom/ingredients/list')
  public async ingredients_list(request: Request, response: Response): Promise<void> {
    this.logger.info("ingredients_list")
    try{

      const ingredient_list : any =
        await this.model.getModel('ingredient').findAll({
          attributes: [['id', 'tid'], 'name', ['nutrition_component_id', 'foodgroup']]
        })

      // Generate Response
      const response_json = {
        result: 0,
        response: {
          ingredients: ingredient_list
        }
      }
      response.json(response_json)
    }catch(e){
      console.log(e)
      this.logger.error("Error")
      response.json({result: 0})
      return Promise.reject(undefined)
    }

    return Promise.resolve(undefined)
  }

}
