import * as Sequelize from 'sequelize';
import { injectable } from 'inversify';

export interface IModel {
  getModel(name: string): Sequelize.Model<{}, {}>;
}

@injectable()
export class Model {

  protected sequelize: Sequelize.Sequelize;
  protected models: {[index: string]: Sequelize.Model<{}, {}>} = {};

  constructor(database : string, user : string, password : string, options: Sequelize.Options ) {

    this.sequelize = new Sequelize(
      database, user, password, options
    );

    // user
    this.models['user'] = this.sequelize.define('user',{
      id                    : {type: Sequelize.STRING(64), primaryKey:true},
      pre_height            : {type: Sequelize.INTEGER},
      pre_weight            : {type: Sequelize.INTEGER}
    });

  }

  public getModel(name: string): Sequelize.Model<{}, {}> {
    return this.models[name];
  }

  public sync() : Promise<void> {
    return new Promise<void>( (resolve, reject) =>{
      this.sequelize.sync()
      .then(() => {
        return resolve()
      })
    })     
  }
}
