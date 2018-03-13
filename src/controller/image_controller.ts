import { controller, httpGet, httpPost, httpPut, httpDelete } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';
import { Request, Response, Express } from 'express';
import * as Sequelize from 'sequelize';
import * as xml2js from 'xml2js';
import * as fs from 'fs';

import TYPES from '../constant/types';
import { IModel } from '../models/model';
import { LoggerInstance, transports, LoggerOptions, WLogger } from '../utils/logger';

import * as helper from '../utils/helper';
import * as jsonwebtoken from 'jsonwebtoken';

@controller('/services/1.1/')
export class ProfileImageController {

  private media_path : string = process.cwd() + '/media/'

  constructor(@inject(TYPES.Model) private model: IModel,
              @inject(TYPES.Logger) private logger: LoggerInstance){
  }

  /**
    * Save image
    */
  private save_image(base64Data: string, filename: string) : void {
    const image_path : string = this.media_path + filename
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
    const image_path : string = this.media_path + filename
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
    const token : any = request.get('token')
    const uid : string = helper.get_uid(token)
    this.logger.info("user_load_image uid:"  + uid)

    // Store image
    const base64Data = request.body.image.replace(/^data:image\/png;base64,/,"");
    this.save_image(base64Data, uid + ".png")

    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/user/delete_image')
  public user_delete_image(request: Request, response: Response): Promise<void> {
    const token : any = request.get('token')
    const uid : string = helper.get_uid(token)
    this.logger.info("user_delete_image uid:"  + uid)

    this.remove_image(uid + ".png")

    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/child/load_image')
  public child_load_image(request: Request, response: Response): Promise<void> {
    const gcid : any = request.get('gcid')
    this.logger.info("child_load_image gcid:"  + gcid)

    // Store image
    const base64Data = request.body.image.replace(/^data:image\/png;base64,/,"");
    this.save_image(base64Data, gcid + ".png")

    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }
  @httpPost('custom/child/delete_image')
  public child_delete_image(request: Request, response: Response): Promise<void> {
    const gcid : any = request.get('gcid')
    this.logger.info("child_load_image gcid:"  + gcid)

    this.remove_image(gcid + ".png")

    response.json({result: 'ok'})
    return Promise.resolve(undefined)
  }

}
