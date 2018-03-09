import * as Sequelize from 'sequelize';
import { injectable } from 'inversify';
import * as uuidv4 from 'uuid/v4';


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
      pre_height            : {type: Sequelize.DOUBLE, defaultValue:0},
      pre_weight            : {type: Sequelize.DOUBLE, defaultValue:0}
    },
    {
       freezeTableName: true,
    });

    // tracking_weight
    this.models['tracking_weight'] = this.sequelize.define('tracking_weight',{
      id                    : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      user_id               : {type: Sequelize.STRING(64)},
      weight                : {type: Sequelize.DOUBLE},
      note                  : {type: Sequelize.STRING(256)},
      date                  : {type: Sequelize.STRING(64)}
    },
    {
       freezeTableName: true
    });

    // associations
    this.models['tracking_weight'].belongsTo(this.models['user'], {
      foreignKey: 'user_id',
      targetKey: 'id'
    })

  }

  public getModel(name: string): Sequelize.Model<{}, {}> {
    return this.models[name];
  }

  public sync() : Promise<void> {
    return new Promise<void>( (resolve, reject) =>{
      this.sequelize.sync({force:true})
      .then(() => {
        return resolve()
      })
    })
  }
}
