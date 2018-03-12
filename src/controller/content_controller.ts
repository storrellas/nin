import { controller, httpGet, httpPost, httpPut, httpDelete } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { Request, Response, Express } from 'express';
import * as Sequelize from 'sequelize';
import * as xml2js from 'xml2js';

import TYPES from '../constant/types';
import { IModel } from '../models/model';
import { LoggerInstance, transports, LoggerOptions, WLogger } from '../utils/logger';

import * as helper from '../utils/helper';
import * as jsonwebtoken from 'jsonwebtoken';

@controller('/services/1.1/')
export class ContentController {

  constructor(@inject(TYPES.Model) private model: IModel,
              @inject(TYPES.Logger) private logger: LoggerInstance){
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
  public async meal_types_list(request: Request, response: Response): Promise<void> {

    try{
      const output : any[] =
        await this.model.getModel('meal_type').findAll({
        })

        // Generate meal_type list
        const meal_type_list : any[] = []
        for (let item of output) {
          meal_type_list.push({
            tid: item.id,
            name: item.name,
            field_meal_type_schedule: {
              date_start: item.date_start,
              date_end: item.date_end,
            },
            gtm_label: item.gtm_label,
          })
        }

        const response_json = {
          response : meal_type_list,
          count    : meal_type_list.length,
          result   : 0
        }
        response.json(response_json)


      //response.json({result: 'ok'})
      return Promise.resolve(undefined)
    }catch{
      this.logger.error("error")
      return Promise.reject(undefined)
    }
  }
  @httpGet('custom/nutrition_categories/list')
  public async nutrition_categories_retrieve(request: Request, response: Response): Promise<void> {
    this.logger.info('nutrition_categories_retrieve')

    try{
      const output : any[] =
        await this.model.getModel('nutrition_component').findAll({
          include: [
            {
             model: this.model.getModel('nutrition_substitute')
            }
          ]
        })


      // Generate nutrition_list
      const nutrition_list : any[] = []
      for (let item of output) {

      // Generate nutrition_substitute list
        const nutrition_substitute_list : any[] = []
        for (let component of item.nutrition_substitutes) {
          nutrition_substitute_list.push(component.name)
        }

        nutrition_list.push({
          tid: item.id,
          name: item.name,
          field_nc_icon: item.icon,
          field_nc_substitutes: nutrition_substitute_list,
          description: item.description,
          gtm_label: item.gtm_label,
        })
      }

      const response_json = {
          response : nutrition_list,
          count    : nutrition_list.length,
          result   : 0
      }
      response.json(response_json)

      //response.json({result: 'ok'})
      return Promise.resolve(undefined)
    }catch{
      this.logger.error("error")
      return Promise.reject(undefined)
    }

  }


  /**
    * Experts
    */
  @httpGet('custom/expertise/list')
  public async expertise_list(request: Request, response: Response): Promise<void> {
    this.logger.info('expertise_list')

    try{

      const output : any[] =
        await this.model.getModel('expertise').findAll({})

      // Generate expert list
      const expertise_list : {[id:string]: any}[] = []
      for (let item of output) {
        expertise_list.push({
          tid : item.id,
          name : item.name,
          gtm_label : item.gtm_label
        })
      }

      const response_json = {
          response: {
              expertise: expertise_list,
          },
          result: 0
      }
      response.json(response_json)
      //response.json({result: 'ok'})
      return Promise.resolve(undefined)
    }catch(e){
      this.logger.error("error")
      console.log(e)
      return Promise.reject(undefined)
    }
  }

  @httpPost('custom/expertise/detail')
  public async expertise_detail(request: Request, response: Response): Promise<void> {
    this.logger.info('expertise_detail tid: ' + request.body.tid)

    try{

      const output : any =
        await this.model.getModel('expertise').findOne({
          include: [
            {
             model: this.model.getModel('expertise_topic')
            },
            {
             model: this.model.getModel('expert')
            },
          ],
          where : { id : request.body.tid }
        })

        // Generate expertise topic list
        const expertise_topic_list : string[] = []
        for (let item of output.expertise_topics) {
          expertise_topic_list.push(item.topic)
        }

        // Generate expert list
        const expert_list : {[id:string]:any}[] = []
        for (let item of output.experts) {
          expert_list.push({
            id: item.id,
            name: item.title,
            field_expert_image: item.image,
          })
        }

      // Generate response
      const response_json = {
          response: {
              tid: output.id,
              name : output.name,
              field_expert_email: output.email,
              field_expert_phone: output.phone,
              field_expertise_topics: expertise_topic_list,
              gtm_label: output.gtm_label,
              experts: expert_list
          },
          result: 0
      }
      response.json(response_json)
      // response.json({result: 'ok'})
      return Promise.resolve(undefined)
    }catch{
      this.logger.error("error")
      return Promise.reject(undefined)
    }
  }

  @httpPost('custom/expert/detail')
  public async expert_detail(request: Request, response: Response): Promise<void> {

    this.logger.info('expert_detail nid: ' + request.body.nid)

    try{

      const output : any =
        await this.model.getModel('expert').findOne({
          where : { id : request.body.nid }
        })

      // Generate response
      const response_json = {
          response: {
              nid: output.id,
              title : output.title,
              field_expert_image: output.image,
              field_expert_expertise: output.expertise_id,
              field_expert_degree: output.degree,
              field_expert_certifications: output.certifications,
              field_expert_highlighted: output.hightlighted,
              body: output.body
          },
          result: 0
      }
      response.json(response_json)
      // response.json({result: 'ok'})
      return Promise.resolve(undefined)
    }catch{
      this.logger.error("error")
      return Promise.reject(undefined)
    }
  }

}
