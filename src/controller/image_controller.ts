import { controller, httpGet, httpPost, httpPut, httpDelete } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { Request, Response, Express } from 'express';
import * as Sequelize from 'sequelize';
import * as fs from 'fs';

import TYPES from '../constant/types';
import { IModel } from '../models/model';
import { LoggerInstance, transports, LoggerOptions, WLogger } from '../utils/logger';

import * as helper from '../utils/helper';
import * as jsonwebtoken from 'jsonwebtoken';

@controller('/services/1.1/')
export class ProfileImageController {

  constructor(@inject(TYPES.ImageOptions) private options: helper.ImageOptions,
              @inject(TYPES.Model) private model: IModel,
              @inject(TYPES.Logger) private logger: LoggerInstance){
  }

  /**
    * Save image
    */
  private save_image(base64Data: string, filename: string) : void {
    const image_path : string = this.options.path + filename
    const binaryData = new Buffer(base64Data, 'base64').toString('binary');
    fs.writeFile(image_path, binaryData, "binary", (err: any) => {
      if( err != undefined)
        this.logger.error("Error occurred " + err)
      else
        this.logger.info("Image saved! filename: " + filename)
    });
  }

  /**
    * Remove image
    */
  private remove_image(filename: string) : void {
    const image_path : string = this.options.path + filename
    fs.unlink(image_path,(err: any) => {
      if( err != undefined)
        this.logger.error("Error occurred " + err)
      else
        this.logger.info("Image deleted! filename: " + filename)
    })
  }

  /**
    * Image management
    */
  @httpPost('custom/user/load_image')
  public user_load_image(request: Request, response: Response): Promise<void> {
    this.logger.info("user_load_image uid:"  + request.uid)

    // Store image
    const base64Data = request.body.image.replace(/^data:image\/png;base64,/,"");
    const filename : string = request.uid + ".png"
    this.save_image(base64Data, filename)

    // Generate response
    const response_json = {
      result : 0,
      response: {
        image_url : this.options.base_url + filename
      }
    }
    response.json(response_json)
    //response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/user/delete_image')
  public user_delete_image(request: Request, response: Response): Promise<void> {
    this.logger.info("user_delete_image uid:"  + request.uid)

    // Remove image
    const filename : string = request.uid + ".png"
    this.remove_image(filename)

    response.json({result: 0})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/child/load_image')
  public child_load_image(request: Request, response: Response): Promise<void> {
    this.logger.info("child_load_image gcid:"  + request.gcid)

    // Store image
    const base64Data = request.body.image.replace(/^data:image\/png;base64,/,"");
    const filename : string = request.gcid + ".png"
    this.save_image(base64Data, filename)

    // Generate response
    const response_json = {
      result : 0,
      response: {
        image_url : this.options.base_url + filename
      }
    }
    response.json(response_json)
    return Promise.resolve(undefined)
  }
  @httpPost('custom/child/delete_image')
  public child_delete_image(request: Request, response: Response): Promise<void> {
    this.logger.info("child_load_image gcid:"  + request.gcid)

    // Remove image
    const filename : string = request.gcid + ".png"
    this.remove_image(filename)

    response.json({result: 0})
    return Promise.resolve(undefined)
  }

}
