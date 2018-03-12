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
    // Menus
    // -----------------------

    this.models['nutrition_components'] = this.sequelize.define('nutrition_components',{
      id                    : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      name                  : {type: Sequelize.STRING(64)},
      icon                  : {type: Sequelize.STRING(64)},
      description           : {type: Sequelize.STRING(1024)},
      gtm_label             : {type: Sequelize.STRING(1024)}
    },
    {
       freezeTableName: true
    });

    this.models['nutrition_substitutes'] = this.sequelize.define('nutrition_substitutes',{
      id                     : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      nutrition_component_id : {type: Sequelize.INTEGER},
      name                   : {type: Sequelize.STRING(64)}
    },
    {
       freezeTableName: true
    });


    // associations
    this.models['nutrition_substitutes'].belongsTo(this.models['nutrition_components'], {
      foreignKey: 'nutrition_component_id',
      targetKey: 'id'
    })
    this.models['nutrition_components'].hasMany(this.models['nutrition_substitutes'],{
      foreignKey : 'nutrition_component_id'
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
          {
            id                    : 2,
            name                  : "Expertos en nutricion Purina",
            email                 : "contacto@mx.purina.com",
            phone                 : "01 800 737 6262",
            gtm_label             : "purina_experts",
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

      .then( () =>{
        return this.models['nutrition_components'].bulkCreate([
          {
            id                    : 1,
            name                  : "Aceites",
            icon                  : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/group_oil.png",
            description           : "Son necesarias para la producción de energía y formación \
de membranas celulares, principalmente aquellos derivados de los aceites vegetales: aguacate, \
ajonjolí, semilla de girasol, cacahuate, almendras, pistaches, nueces, aceitunas.\r\n\
Es importante incluir 2 raciones de pescado a la semana, ya que se obtiene DHA y \
EPA necesarios para el desarrollo del bebe.",
            gtm_label             : "oils",
          },
          {
            id                    : 2,
            name                  : "Azúcares",
            icon                  : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/group_oil.png",
            description           : "Azúcares",
            gtm_label             : "sugar",
          },

          {
            id                    : 3,
            name                  : "Cereales",
            icon                  : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/group_starches.png",
            description           : "Son la fuente principal de energía. Debemos preferir los cereales integrales. proporcionan algunos micronutrimentos y fibra.",
            gtm_label             : "cereals",
          },
          {
            id                    : 4,
            name                  : "Fruta",
            icon                  : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/group_fruit.png",
            description           : "Son alimentos ricos en vitaminas y aportan fibra.\r\nAyudan a prevenir \
el estreñimiento y a su vez por la cantidad de fibra que contienen, reducen el colesterol. \
Al comer cantidades adecuadas reducen el riesgo de desarrollar ciertas enfermedades crónicas y \
ciertos tipos de cáncer. Brindan textura, sabor y variedad a los platillos. Es muy importante desinfectar \
y lavar tanto verduras como frutas antes de prepararlas.",
            gtm_label             : "fruit",
          },
          {
            id                    : 5,
            name                  : "Lácteos",
            icon                  : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/group_dairy.png",
            description           : "Aportan calcio y vitamina D, además de ofrecer proteínas.",
            gtm_label             : "dairy",
          },
          {
            id                    : 6,
            name                  : "Proteínas",
            icon                  : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/group_protein.png",
            description           : "Son la principal fuente de proteína y hierro. Las proteínas nos ayudan a formar y conservar todos nuestros órganos, tejidos y huesos",
            gtm_label             : "protein",
          },
          {
            id                    : 7,
            name                  : "Vegetales",
            icon                  : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/group_vegatable.png",
            description           : "Son la principal fuente de vitaminas, minerales, fibra y agua.\r\n\
De preferencia hay que consumirlas crudas o semicocidas para beneficiarnos de la fibra.\r\nAyudan a prevenir \
el estreñimiento y a su vez por la cantidad de fibra que contienen, reducen el colesterol. Al comer cantidades \
adecuadas reducen el riesgo de desarrollar ciertas enfermedades crónicas y ciertos tipos de cáncer. Brindan textura, \
sabor y variedad a los platillos. Es muy importante desinfectar y lavar tanto verduras como frutas antes de \
prepararlas.",
            gtm_label             : "vegetables",
          },
          {
            id                    : 8,
            name                  : "Verduras",
            icon                  : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/group_vegatable.png",
            description           : "Son la principal fuente de vitaminas, minerales, fibra y agua.\r\n\
De preferencia hay que consumirlas crudas o semicocidas para beneficiarnos de la fibra.\r\nAyudan a prevenir \
el estreñimiento y a su vez por la cantidad de fibra que contienen, reducen el colesterol. Al comer cantidades \
adecuadas reducen el riesgo de desarrollar ciertas enfermedades crónicas y ciertos tipos de cáncer. Brindan textura, \
sabor y variedad a los platillos. Es muy importante desinfectar y lavar tanto verduras como frutas antes de \
prepararlas.",
            gtm_label             : "greens",
          },
        ]);
      })


      .then( () =>{
        return this.models['nutrition_substitutes'].bulkCreate([
          // 1
          {
            id                     : 1,
            nutrition_component_id : 1,
            name                   : "1 cdita de aceite"
          },
          {
            id                     : 2,
            nutrition_component_id : 1,
            name                   : "1 cdita de aceite de oliva"
          },
          {
            id                     : 3,
            nutrition_component_id : 1,
            name                   : "1/2 de aguacate verde"
          },
          {
            id                     : 4,
            nutrition_component_id : 1,
            name                   : "1 1/2 de mantequilla"
          },
          {
            id                     : 5,
            nutrition_component_id : 1,
            name                   : "4 cdita de almendra picada"
          },
          // 2
          {
            id                     : 6,
            nutrition_component_id : 2,
            name                   : "1 pieza de manzana"
          },
          {
            id                     : 7,
            nutrition_component_id : 2,
            name                   : "1 taza de melón picado"
          },
          {
            id                     : 8,
            nutrition_component_id : 2,
            name                   : "1 taza de fresa rebanada"
          },
          // 3
        ]);
      })
/**/

      .then(() => {
        return resolve()
      })
    })
  }
}
