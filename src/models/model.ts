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

    // -----------------------
    // User
    // -----------------------

    // user
    this.models['user'] = this.sequelize.define('user',{
      id                    : {type: Sequelize.STRING(64), primaryKey:true},
      pre_height            : {type: Sequelize.DOUBLE, defaultValue:0},
      pre_weight            : {type: Sequelize.DOUBLE, defaultValue:0},
      gigya_data            : {type: Sequelize.STRING(1024)}
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
      expertise_id          : {type: Sequelize.INTEGER()},
      topic                 : {type: Sequelize.STRING(64)}
    },
    {
       freezeTableName: true
    });

    this.models['expert'] = this.sequelize.define('expert',{
      id                    : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      expertise_id          : {type: Sequelize.INTEGER()},
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
    this.models['expert'].belongsTo(this.models['expertise'], {
      foreignKey: 'expertise_id',
      targetKey: 'id'
    })


  }

  public getModel(name: string): Sequelize.Model<{}, {}> {
    return this.models[name];
  }

  public sync() : Promise<void> {
    return new Promise<void>( (resolve, reject) =>{
      this.sequelize.sync({force:true})

      .then( () =>{
        return this.models['expertise'].bulkCreate([
          {
            id                    : 1,
            name                  : "Expertos en nutricion Nestlé",
            email                 : "contacto@mx.nestle.com",
            phone                 : "01 800 737 6262",
            gtm_label             : "nutrition_experts",
          },
        ]);
      })
      .then( () =>{
        return this.models['expertise_topic'].bulkCreate([
          {
            expertise_id          : 1,
            topic                 : "Descubre la importancia de la nutrición durante los primeros 1000 días de tu bebé"
          },
          {
            expertise_id          : 1,
            topic                 : "Aprende sobre la nutrición y cuidados prenatales durante tu embarazo"
          },
          {
            expertise_id          : 1,
            topic                 : "Recibe asesoría y apoyo durante el periodo de lactancia"
          },
          {
            expertise_id          : 1,
            topic                 : "Identifica cuando es el mejor momento para introducir los primeros sólidos y como seleccionar los mejores alimentos"
          },
          {
            expertise_id          : 1,
            topic                 : "Respondemos tus preguntas sobre estos temas y muchos otros más a través de nuestro equipo de expertos en nutrición"
          },
        ]);
      })
      .then( () =>{
        return this.models['expert'].bulkCreate([
          {
            expertise_id          : 1,
            title                 : "Josefina",
            image                 : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/experts/3db89a2600000578-0-image-a-4_1488154275573.jpg",
            degree                : "Nutricionista",
            certifications        : "Grado en educación media superior",
            hightlighted          : "Especialista en temas como: nutrición durante el embarazo, alergias alimentarias, alimentación por etapas, lactancia materna, etc. ",
            body                  : "Nutrióloga certificada con experiencia en práctica clínico-nutricional desde hace 8 años, conferencista y locutora en radio de un programa de salud y es mamá de Carlitos de 3 años y Juan Pablo de 1.",
          },
          {
            expertise_id          : 1,
            title                 : "María",
            image                 : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/experts/nutritionist-500.jpg",
            degree                : "Licenciada en Nutrición y Dietétic",
            certifications        : "Estudios en nutrición humana y dietética",
            hightlighted          : "Especialista en temas como: nutrición durante el embarazo, alergias alimentarias, alimentación por etapas, lactancia materna, etc. ",
            body                  : "Nutrióloga en Hospital Español en México, Representante de ventas productos farmacéuticos y conferencista en eventos pediátricos y científicos, tiene 6 meses de embarazo de su primer bebé.",
          },
        ]);
      })
      /**/
      .then(() => {
        return resolve()
      })
    })
  }
}
