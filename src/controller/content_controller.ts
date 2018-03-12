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
  public async expertise_list(request: Request, response: Response): Promise<void> {

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
  public expert_detail(request: Request, response: Response): Promise<void> {
    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }

}
