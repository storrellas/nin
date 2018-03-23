import * as Sequelize from 'sequelize';
import { injectable } from 'inversify';
import * as uuidv4 from 'uuid/v4';


export interface IModel {
  getModel(name: string): Sequelize.Model<{}, {}>;
  raw(query : string): PromiseLike<any>;
}

@injectable()
export class Model implements IModel {

  protected sequelize: Sequelize.Sequelize;
  protected models: {[index: string]: Sequelize.Model<{}, {}>} = {};

  constructor(database : string, user : string, password : string, options: Sequelize.Options ) {

    this.sequelize = new Sequelize(
      database, user, password, options
    );

    // -----------------------
    // User
    // -----------------------

    // user
    this.models['user'] = this.sequelize.define('user',{
      id                    : {type: Sequelize.STRING(64), primaryKey:true},
      gigya_data            : {type: Sequelize.STRING(1024)}
    },
    {
       freezeTableName: true,
    });

    // child
    this.models['child'] = this.sequelize.define('child',{
      id                     : {type: Sequelize.STRING(64), primaryKey:true},
      user_id                : {type: Sequelize.STRING(64)},
      birth_date             : {type: Sequelize.DATE()},
      conception_date        : {type: Sequelize.DATE()},
      birth_date_reliability : {type: Sequelize.INTEGER},
      name                   : {type: Sequelize.STRING(64)},
      prepregnancy_height    : {type: Sequelize.DOUBLE, defaultValue:0},
      prepregnancy_weight    : {type: Sequelize.DOUBLE, defaultValue:0},
    },
    {
       freezeTableName: true
    });



    // associations
    this.models['child'].belongsTo(this.models['user'], {
      foreignKey: 'user_id',
      targetKey: 'id'
    })
    this.models['user'].hasMany(this.models['child'], {
      foreignKey: 'user_id'
    })

    // -----------------------
    // Nutrition
    // -----------------------

    this.models['nutrition_component'] = this.sequelize.define('nutrition_component',{
      id                    : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      name                  : {type: Sequelize.STRING(64)},
      icon                  : {type: Sequelize.STRING(64)},
      description           : {type: Sequelize.STRING(1024)},
      gtm_label             : {type: Sequelize.STRING(1024)}
    },
    {
       freezeTableName: true
    });

    this.models['ingredient'] = this.sequelize.define('ingredient',{
      id                     : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      nutrition_component_id : {type: Sequelize.INTEGER},
      name                   : {type: Sequelize.STRING(64)}
    },
    {
       freezeTableName: true
    });

    this.models['meal_type'] = this.sequelize.define('meal_type',{
      id                     : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      name                   : {type: Sequelize.STRING(64)},
      date_start             : {type: Sequelize.STRING(32)},
      date_end               : {type: Sequelize.STRING(32)},
      gtm_label              : {type: Sequelize.STRING(32)},
    },
    {
       freezeTableName: true
    });


    // associations
    this.models['ingredient'].belongsTo(this.models['nutrition_component'], {
      foreignKey: 'nutrition_component_id',
      targetKey: 'id'
    })
    this.models['nutrition_component'].hasMany(this.models['ingredient'],{
      foreignKey : 'nutrition_component_id'
    })

    // -----------------------
    // Tracking
    // -----------------------

    // tracking_weight
    this.models['tracking_weight'] = this.sequelize.define('tracking_weight',{
      id                    : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      child_id              : {type: Sequelize.STRING(64)},
      weight                : {type: Sequelize.DOUBLE},
      note                  : {type: Sequelize.STRING(256)},
      date                  : {type: Sequelize.DATE()}
    },
    {
       freezeTableName: true
    });

    // tracking_growth
    this.models['tracking_growth'] = this.sequelize.define('tracking_growth',{
      id                    : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      child_id              : {type: Sequelize.STRING(64)},
      weight                : {type: Sequelize.DOUBLE},
      height                : {type: Sequelize.DOUBLE},
      date                  : {type: Sequelize.DATE()}
    },
    {
       freezeTableName: true
    });

    // food_type
    this.models['food_type'] = this.sequelize.define('food_type',{
      id                    : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      name                  : {type: Sequelize.STRING(64)},
      icon                  : {type: Sequelize.STRING(512)},
      gtm_label             : {type: Sequelize.STRING(64)}
    },
    {
       freezeTableName: true
    });


    // tracking_food
    this.models['tracking_food'] = this.sequelize.define('tracking_food',{
      id                    : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      child_id              : {type: Sequelize.STRING(64)},
      food_type_id          : {type: Sequelize.INTEGER},
      left_amount           : {type: Sequelize.INTEGER},
      right_amount          : {type: Sequelize.INTEGER},
      last_breast           : {type: Sequelize.STRING(64)},
      formula_name          : {type: Sequelize.STRING(64)},
      quantity              : {type: Sequelize.INTEGER},
      comment               : {type: Sequelize.STRING(256)},
      date                  : {type: Sequelize.DATE()}
    },
    {
       freezeTableName: true
    });

    this.models['tracking_food_ingredient'] = this.sequelize.define('tracking_food_ingredients',{
      id                    : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      tracking_food_id      : {type: Sequelize.INTEGER},
      ingredient_id         : {type: Sequelize.INTEGER}
    },
    {
       freezeTableName: true
    });

    // associations
    this.models['tracking_weight'].belongsTo(this.models['child'], {
      foreignKey: 'child_id',
      targetKey: 'id'
    })
    this.models['tracking_growth'].belongsTo(this.models['child'], {
      foreignKey: 'child_id',
      targetKey: 'id'
    })
    this.models['tracking_food'].belongsTo(this.models['child'], {
      foreignKey: 'child_id',
      targetKey: 'id'
    })
    this.models['tracking_food'].belongsTo(this.models['food_type'], {
      foreignKey: 'food_type_id',
      targetKey: 'id'
    })

    this.models['tracking_food_ingredient'].belongsTo(this.models['tracking_food'], {
      foreignKey: 'tracking_food_id',
      targetKey: 'id'
    })
    this.models['tracking_food_ingredient'].belongsTo(this.models['ingredient'], {
      foreignKey: 'ingredient_id',
      targetKey: 'id'
    })


    // -----------------------
    // Experts
    // -----------------------

    this.models['expertise'] = this.sequelize.define('expertise',{
      id                    : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      name                  : {type: Sequelize.STRING(64)},
      email                 : {type: Sequelize.STRING(64)},
      phone                 : {type: Sequelize.STRING(64)},
      gtm_label             : {type: Sequelize.STRING(64)},
    },
    {
       freezeTableName: true
    });

    this.models['expertise_topic'] = this.sequelize.define('expertise_topic',{
      id                    : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      expertise_id          : {type: Sequelize.INTEGER},
      topic                 : {type: Sequelize.STRING(1024)}
    },
    {
       freezeTableName: true
    });

    this.models['expert'] = this.sequelize.define('expert',{
      id                    : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      expertise_id          : {type: Sequelize.INTEGER},
      title                 : {type: Sequelize.STRING(64)},
      image                 : {type: Sequelize.STRING(64)},
      degree                : {type: Sequelize.STRING(64)},
      certifications        : {type: Sequelize.STRING(64)},
      hightlighted          : {type: Sequelize.STRING(64)},
      body                  : {type: Sequelize.STRING(1024)},
    },
    {
       freezeTableName: true
    });

    // associations
    this.models['expertise_topic'].belongsTo(this.models['expertise'], {
      foreignKey: 'expertise_id',
      targetKey: 'id'
    })

    this.models['expertise'].hasMany(this.models['expertise_topic'],{
      foreignKey : 'expertise_id'
    })
    this.models['expertise'].hasMany(this.models['expert'],{
      foreignKey : 'expertise_id'
    })

    this.models['expert'].belongsTo(this.models['expertise'], {
      foreignKey: 'expertise_id',
      targetKey: 'id'
    })



    // -----------------------
    // Menu
    // -----------------------

    this.models['menu'] = this.sequelize.define('menu',{
      id                     : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      description            : {type: Sequelize.STRING(64)},
      gtm_label              : {type: Sequelize.STRING(64)},
      kcal                   : {type: Sequelize.INTEGER},
    },
    {
       freezeTableName: true
    });

    this.models['meal'] = this.sequelize.define('meal',{
      id                     : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      description            : {type: Sequelize.STRING(64)},
      meal_type_id           : {type: Sequelize.INTEGER},
      menu_id                : {type: Sequelize.INTEGER},
    },
    {
       freezeTableName: true
    });

    this.models['recipe'] = this.sequelize.define('recipe',{
      id                     : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      meal_id                : {type: Sequelize.INTEGER},
      title                  : {type: Sequelize.STRING(64)},
      quantity               : {type: Sequelize.STRING(64)},
      icon                   : {type: Sequelize.STRING(64)},
      gtm_label              : {type: Sequelize.STRING(64)},
    },
    {
       freezeTableName: true
    });

    this.models['meal_nutrition_component'] = this.sequelize.define('meal_nutrition_component',{
      id                     : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      meal_id                : {type: Sequelize.INTEGER},
      nutrition_component_id : {type: Sequelize.INTEGER},
      quantity               : {type: Sequelize.STRING(64)},
    },
    {
       freezeTableName: true
    });

    // associations
    this.models['menu'].hasMany(this.models['meal'],{
      foreignKey : 'menu_id'
    })
    this.models['meal'].hasMany(this.models['recipe'],{
      foreignKey : 'meal_id'
    })
    this.models['meal'].hasMany(this.models['meal_nutrition_component'],{
      foreignKey : 'meal_id'
    })

    this.models['meal_nutrition_component'].belongsTo(this.models['nutrition_component'],{
      foreignKey: 'nutrition_component_id',
      targetKey: 'id'
    })

  }

  public raw(query : string): PromiseLike<any> {
    return this.sequelize.query(query, { type: Sequelize.QueryTypes.SELECT})
  }

  public getModel(name: string): Sequelize.Model<{}, {}> {
    return this.models[name];
  }

}
