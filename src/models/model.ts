import * as Sequelize from 'sequelize';
import { injectable } from 'inversify';
import * as uuidv4 from 'uuid/v4';


export interface IModel {
  getModel(name: string): Sequelize.Model<{}, {}>;
  raw(query : string): Promise<any>;
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
      birth_date_reliability : {type: Sequelize.STRING(64)},
      name                   : {type: Sequelize.STRING(64)},
      prepregnancy_height    : {type: Sequelize.DOUBLE, defaultValue:0},
      prepregnancy_weight    : {type: Sequelize.DOUBLE, defaultValue:0},
    },
    {
       freezeTableName: true
    });


    // tracking_weight
    this.models['tracking_weight'] = this.sequelize.define('tracking_weight',{
      id                    : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey:true},
      child_id              : {type: Sequelize.STRING(64)},
      weight                : {type: Sequelize.DOUBLE},
      note                  : {type: Sequelize.STRING(256)},
      date                  : {type: Sequelize.STRING(64)}
    },
    {
       freezeTableName: true
    });


    // associations
    this.models['tracking_weight'].belongsTo(this.models['child'], {
      foreignKey: 'child_id',
      targetKey: 'id'
    })
    this.models['child'].belongsTo(this.models['user'], {
      foreignKey: 'user_id',
      targetKey: 'id'
    })
    this.models['user'].hasMany(this.models['child'], {
      foreignKey: 'user_id'
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

    this.models['nutrition_substitute'] = this.sequelize.define('nutrition_substitute',{
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
    this.models['nutrition_substitute'].belongsTo(this.models['nutrition_component'], {
      foreignKey: 'nutrition_component_id',
      targetKey: 'id'
    })
    this.models['nutrition_component'].hasMany(this.models['nutrition_substitute'],{
      foreignKey : 'nutrition_component_id'
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

  public raw(query : string): Promise<any> {
    return this.sequelize.query(query, { type: Sequelize.QueryTypes.SELECT})
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
        return this.models['nutrition_component'].bulkCreate([
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
        return this.models['nutrition_substitute'].bulkCreate([
          // 1
          { id : 1, nutrition_component_id : 1, name : "1 cdita de aceite" },
          { id : 2, nutrition_component_id : 1, name : "1 cdita de aceite de oliva" },
          { id : 3, nutrition_component_id : 1, name : "1/2 de aguacate verde" },
          { id : 4, nutrition_component_id : 1, name : "1/2 de aguacate verde" },
          { id : 5, nutrition_component_id : 1, name : "4 cdita de almendra picada " },
          // 2
          { id : 6, nutrition_component_id : 2, name : "1 pieza de manzana" },
          { id : 7, nutrition_component_id : 2, name : "1 taza de melón picado" },
          { id : 8, nutrition_component_id : 2, name : "1 taza de fresa rebanada" },
          // 3
          { id : 9,   nutrition_component_id : 3, name : "3/4 taza de avena cocida"},
          { id : 10,  nutrition_component_id : 3, name : "1/3 pieza de bolillo"},
          { id : 11,  nutrition_component_id : 3, name : "1/3 taza de cereal integral"},
          { id : 12,  nutrition_component_id : 3, name : "20 gramos de codito crudo"},
          { id : 13,  nutrition_component_id : 3, name : "1/2 taza de fideo cocido"},
          { id : 14,  nutrition_component_id : 3, name : "1 pieza de tortilla"},
          // 4
          { id : 15,  nutrition_component_id : 4, name : "2 pzas de durazno amarillo"},
          { id : 16,  nutrition_component_id : 4, name : "1 taza de fresa rebanada"},
          { id : 17,  nutrition_component_id : 4, name : "3 piezas de guayaba"},
          { id : 18,  nutrition_component_id : 4, name : "1 pieza de mango manila"},
          { id : 19,  nutrition_component_id : 4, name : "1 pieza de manzana"},
          { id : 20,  nutrition_component_id : 4, name : "1 taza de melón picado"},
          { id : 21,  nutrition_component_id : 4, name : "2 piezas de naranja"},
          { id : 22,  nutrition_component_id : 4, name : "1 taza de papaya picada"},

          // 5
          { id : 23,  nutrition_component_id : 5, name : "200 ml de leche"},
          { id : 24,  nutrition_component_id : 5, name : "200 g de yogur"},
          { id : 25,  nutrition_component_id : 5, name : "80 - 100 g de queso blanco fresco (desgrasado)"},
          { id : 26,  nutrition_component_id : 5, name : "46 - 60 g de queso semicurado-curado"},
          { id : 27,  nutrition_component_id : 5, name : "70 g de cuajada"},
          { id : 28,  nutrition_component_id : 5, name : "70 g de requeson"},
          { id : 29,  nutrition_component_id : 5, name : "200 g de petit suisse"},
          { id : 30,  nutrition_component_id : 5, name : "220 g de natillas, flan o arroz con leche 220g"},
          // 6
          { id : 31,  nutrition_component_id : 6, name : "1/5 taza de atún en conserva"},
          { id : 32,  nutrition_component_id : 6, name : "30 gramos de bistec de res"},
          { id : 33,  nutrition_component_id : 6, name : "40 gramos de filete de pescado"},
          { id : 34,  nutrition_component_id : 6, name : "1/2 reb. de pechuga de pavo"},
          { id : 35,  nutrition_component_id : 6, name : "30 gramos de milanesa de pollo"},
          { id : 36,  nutrition_component_id : 6, name : "30 gramos de carne de res"},
          { id : 37,  nutrition_component_id : 6, name : "2 reb. de jamón de pavo"},
          { id : 38,  nutrition_component_id : 6, name : "40 gramos de queso panela"},
          { id : 39,  nutrition_component_id : 6, name : "12 gramos de chicharron"},
          { id : 40,  nutrition_component_id : 6, name : "1 pieza de huevo cocido"},
          { id : 41,  nutrition_component_id : 6, name : "40 gramos de carne de pescado"},
          // 7
          { id : 42,  nutrition_component_id : 7, name : "1/4 taza de brócoli cocido"},
          { id : 43,  nutrition_component_id : 7, name : "1/2 taza de calabaza cocida"},
          { id : 44,  nutrition_component_id : 7, name : "3/4 taza de germen de alfalfa cruda"},
          { id : 45,  nutrition_component_id : 7, name : "1 taza de jitomate bola"},
          // 8
          { id : 46,  nutrition_component_id : 8, name : "1/4 taza de brócoli cocido"},
          { id : 47,  nutrition_component_id : 8, name : "1/2 taza de calabaza cocida"},
          { id : 48,  nutrition_component_id : 8, name : "3/4 taza de germen de alfalfa cruda"},
          { id : 49,  nutrition_component_id : 8, name : "1 taza de jitomate bola"},
          { id : 50,  nutrition_component_id : 8, name : "3 tazas de lechuga"},
          { id : 51,  nutrition_component_id : 8, name : "1 taza de nopal cocido"},
          { id : 52,  nutrition_component_id : 8, name : "1/4 taza de pepino con cascara"},
          { id : 53,  nutrition_component_id : 8, name : "2 tazas de espinaca cruda picada"},
          { id : 54,  nutrition_component_id : 8, name : "1/2 taza de jícama picada"},
          { id : 55,  nutrition_component_id : 8, name : "1/2 taza de zanahoria picada"}
        ]);
      })

      .then( () =>{
        return this.models['meal_type'].bulkCreate([
          {
            id                     : 1,
            name                   : "Desayuno",
            date_start             : "00:00",
            date_end               : "09:00",
            gtm_label              : "breakfast",
          },
          {
            id                     : 2,
            name                   : "Colación",
            date_start             : "09:00",
            date_end               : "12:00",
            gtm_label              : "morning_colacion",
          },
          {
            id                     : 3,
            name                   : "Comida",
            date_start             : "12:00",
            date_end               : "17:00",
            gtm_label              : "meal",
          },
          {
            id                     : 4,
            name                   : "Colación",
            date_start             : "17:00",
            date_end               : "20:00",
            gtm_label              : "afternoon_colacion",
          },
          {
            id                     : 5,
            name                   : "Cena",
            date_start             : "20:00",
            date_end               : "00:00",
            gtm_label              : "dinner",
          },
        ]);
      })

      .then( () =>{
        return this.models['menu'].bulkCreate([
          { id : 1, description: "day_1_menu", kcal : 1885 },
          { id : 2, description: "day_2_menu", kcal : 1780 },
          { id : 3, description: "day_3_menu", kcal : 1855 },
        ]);
      })


      .then( () =>{
        return this.models['meal'].bulkCreate([
// day_1_menu
          // Hashbrown de vegetales + Jugo de mandarina - breakfast
          { id : 1, description : "day_1_menu_breakfast", meal_type_id : 1, menu_id : 1 },
          // Cóctel de Frutas - colacion
          { id : 2, description : "day_1_menu_colacion", meal_type_id : 2, menu_id : 1 },
          // Arracherra con ensalada + ensalada - lunch
          { id : 3, description : "day_1_menu_lunch", meal_type_id : 3, menu_id : 1 },
          // Licuado de fresas con amaranto - afternoon_colacion
          { id : 4, description : "day_1_menu_colacion_afternoon", meal_type_id : 4, menu_id : 1 },
          // Sandwich de pollo con jamón + Té de Manzanilla - dinner
          { id : 5, description : "day_1_menu_dinner", meal_type_id : 5, menu_id : 1 },
// day_2_menu
          // Omelette de champiñones + Jugo verde - breakfast
          { id : 6, description : "day_2_menu_breakfast", meal_type_id : 1, menu_id : 2 },
          // Hot cake con fruta - colacion
          { id : 7, description : "day_2_menu_colacion", meal_type_id : 2, menu_id : 2 },
          // Salmón tropical en salsa de piña + Sopa de codito blanca + Ensalada de lechugas y pepino - lunch
          { id : 8, description : "day_2_menu_lunch", meal_type_id : 3, menu_id : 2 },
          // Plato de cereal con plátano - afternoon_colacion
          { id : 9, description : "day_2_menu_colacion_afternoon", meal_type_id : 4, menu_id : 2 },
          // Chayote al vapor con queso + Pan tostado con mantequilla + Té de limon - dinner
          { id : 10, description : "day_2_menu_dinner", meal_type_id : 5, menu_id : 2 },
// day_3_menu
          // Tostada de ensalada rusa + Smoothie de mamey- breakfast
          { id : 11, description : "day_3_menu_breakfast", meal_type_id : 1, menu_id : 3 },
          // Pepino relleno de cacahuate - colacion
          { id : 12, description : "day_3_menu_colacion", meal_type_id : 2, menu_id : 3 },
          // Crema de chile poblano + Ensalada de fusilli con brochetas + Agua de limón - lunch
          { id : 13, description : "day_3_menu_lunch", meal_type_id : 3, menu_id : 3 },
          // Rodajas de fruta - afternoon_colacion
          { id : 14, description : "day_3_menu_colacion_afternoon", meal_type_id : 4, menu_id : 3 },
          // Chapata de pechuga de pavo + Papaya picada con yogurt - dinner
          { id : 15, description : "day_3_menu_dinner", meal_type_id : 5, menu_id : 3 },
        ]);
      })

      .then( () =>{
        return this.models['recipe'].bulkCreate([
// daily_meal                : 1
          {
            id                     : 1,
            meal_id                : 1,
            title                  : "Hashbrown de vegetales",
            quantity               : "150g",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/hash_brown_de_vegetales.png",
          },
          {
            id                     : 2,
            meal_id                : 1,
            title                  : "Jugo de mandarina",
            quantity               : "1/2 vaso",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/jugo_de_mandarina.png",
          },
          {
            id                     : 3,
            meal_id                : 2,
            title                  : "Cóctel de Frutas",
            quantity               : "1 taza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/coctel_de_frutas.png",
          },
          {
            id                     : 4,
            meal_id                : 3,
            title                  : "Arracherra con ensalada",
            quantity               : "200gr",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/arrachera_con_ensalada.png",
          },
          {
            id                     : 5,
            meal_id                : 3,
            title                  : "Ensalada",
            quantity               : "1 taza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/ensalada.png",
          },
          {
            id                     : 6,
            meal_id                : 4,
            title                  : "Licuado de fresas con amaranto",
            quantity               : "1 vaso",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/licuado_de_fresas_con_amaranto.png",
          },
          {
            id                     : 7,
            meal_id                : 5,
            title                  : "Sandwich de pollo con jamón",
            quantity               : "1 pieza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/licuado_de_fresas_con_amaranto.png",
          },
          {
            id                     : 8,
            meal_id                : 5,
            title                  : "Té de Manzanilla",
            quantity               : "1 taza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/te_de_manzanilla.png",
          },
// daily_meal                : 2
          {
            id                     : 9,
            meal_id                : 6,
            title                  : "Omelette de champiñones",
            quantity               : "150g",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/omelett_de_champinones.png",
            gtm_label              : "ommelete"
          },
          {
            id                     : 10,
            meal_id                : 6,
            title                  : "Jugo verde",
            quantity               : "1 vaso",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/jugo_verde.png",
          },
          {
            id                     : 11,
            meal_id                : 7,
            title                  : "Hot cake con fruta",
            quantity               : "1 pieza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/hot_cake_con_fruta.png",
          },
          {
            id                     : 12,
            meal_id                : 8,
            title                  : "Salmón tropical en salsa de piña",
            quantity               : "100g",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/salmon_tropical_en_salsa_de_pina.png",
          },
          {
            id                     : 13,
            meal_id                : 8,
            title                  : "Sopa de codito blanca",
            quantity               : "1 taza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/sopa_de_codito_blanca.png",
          },
          {
            id                     : 14,
            meal_id                : 8,
            title                  : "Ensalada de lechugas y pepino",
            quantity               : "1 taza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/ensalada_de_lechugas_y_pepino.png",
          },
          {
            id                     : 15,
            meal_id                : 9,
            title                  : "Plato de cereal con plátano",
            quantity               : "1 plato",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/plato_de_cereal_con_platano.png",
          },
          {
            id                     : 16,
            meal_id                : 10,
            title                  : "Chayote al vapor con queso",
            quantity               : "1 pieza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/plato_de_cereal_con_platano.png",
          },
          {
            id                     : 17,
            meal_id                : 10,
            title                  : "Pan tostado con mantequilla",
            quantity               : "1 pieza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/pan_tostado_con_mantequilla.png",
          },
          {
            id                     : 18,
            meal_id                : 10,
            title                  : "Té de limón",
            quantity               : "1 taza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/te_de_limon.png",
          },
// daily_meal                : 3
          {
            id                     : 19,
            meal_id                : 11,
            title                  : "Tostada de ensalada rusa",
            quantity               : "1 pieza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/tostada_de_ensalada_rusa.png",
          },
          {
            id                     : 20,
            meal_id                : 11,
            title                  : "Smoothie de mamey",
            quantity               : "1 vaso",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/smoothie_de_mamey.png",
          },
          {
            id                     : 21,
            meal_id                : 12,
            title                  : "Pepino relleno de cacahuate",
            quantity               : "1 pieza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/pepino_relleno_de_cacahuete.png",
          },
          {
            id                     : 22,
            meal_id                : 13,
            title                  : "Crema de chile poblano",
            quantity               : "1/2 taza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/crema_de_chila_poblano.png",
          },
          {
            id                     : 23,
            meal_id                : 13,
            title                  : "Ensalada de fusilli con brochetas",
            quantity               : "1 racion",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/ensalada_de_fusilli_con_brochetas.png",
          },
          {
            id                     : 24,
            meal_id                : 13,
            title                  : "Agua de limón",
            quantity               : "1 vaso",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/agua_limon.png",
          },
          {
            id                     : 25,
            meal_id                : 14,
            title                  : "Rodajas de fruta",
            quantity               : "5 piezas",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/rodajas_de_fruta.png",
          },
          {
            id                     : 26,
            meal_id                : 15,
            title                  : "Chapata de pechuga de pavo",
            quantity               : "1/2 pieza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/rodajas_de_fruta.png",
          },
          {
            id                     : 27,
            meal_id                : 15,
            title                  : "Papaya picada con yogurt",
            quantity               : "1 taza",
            icon                   : "https://mx-test.factory.nestlebaby.com/sites/g/files/sxd651/f/papaya_picada_con_yogurt.png",
          },

        ]);
      })

      .then( () =>{
        return this.models['meal_nutrition_component'].bulkCreate([
// meal_id:1
          { id :  1, meal_id : 1, nutrition_component_id : 6, quantity : 1 },
          { id :  2, meal_id : 1, nutrition_component_id : 3, quantity : 2 },
          { id :  3, meal_id : 1, nutrition_component_id : 1, quantity : 1 },
          { id :  4, meal_id : 1, nutrition_component_id : 4, quantity : 1 },
// meal_id:2
          { id :  5, meal_id : 2, nutrition_component_id : 4, quantity : 1 },
          { id :  6, meal_id : 2, nutrition_component_id : 5, quantity : 1 },
          { id :  7, meal_id : 2, nutrition_component_id : 1, quantity : 1 },
// meal_id:3
          { id :  8, meal_id : 3, nutrition_component_id : 6, quantity : 1 },
          { id :  9, meal_id : 3, nutrition_component_id : 3, quantity : 2 },
          { id : 10, meal_id : 3, nutrition_component_id : 8, quantity : 2 },
// meal_id:4
          { id : 11, meal_id : 4, nutrition_component_id : 3, quantity : 1 },
          { id : 12, meal_id : 4, nutrition_component_id : 4, quantity : 1 },
// meal_id:5
          { id : 13, meal_id : 5, nutrition_component_id : 3, quantity : 1 },
          { id : 14, meal_id : 5, nutrition_component_id : 1, quantity : 1 },
          { id : 15, meal_id : 5, nutrition_component_id : 6, quantity : 2 },
          { id : 16, meal_id : 5, nutrition_component_id : 4, quantity : 1 },
// meal_id:6
          { id : 17, meal_id : 6, nutrition_component_id : 6, quantity : 1 },
          { id : 18, meal_id : 6, nutrition_component_id : 8, quantity : 1 },
          { id : 19, meal_id : 6, nutrition_component_id : 3, quantity : 2 },
// meal_id:7
          { id : 20, meal_id : 7, nutrition_component_id : 3, quantity : 2 },
          { id : 21, meal_id : 7, nutrition_component_id : 4, quantity : 1 },
// meal_id:8
          { id : 22, meal_id : 8, nutrition_component_id : 6, quantity : 1 },
          { id : 23, meal_id : 8, nutrition_component_id : 4, quantity : 1 },
          { id : 24, meal_id : 8, nutrition_component_id : 3, quantity : 1 },
          { id : 25, meal_id : 8, nutrition_component_id : 3, quantity : 1 },
          { id : 26, meal_id : 8, nutrition_component_id : 1, quantity : 1 },
          { id : 27, meal_id : 8, nutrition_component_id : 8, quantity : 2 },
// meal_id:9
          { id : 28, meal_id : 9, nutrition_component_id : 3, quantity : 1 },
// meal_id:10
          { id : 29, meal_id : 10, nutrition_component_id : 8, quantity : 1 },
          { id : 30, meal_id : 10, nutrition_component_id : 5, quantity : 1 },
          { id : 31, meal_id : 10, nutrition_component_id : 3, quantity : 1 },
          { id : 32, meal_id : 10, nutrition_component_id : 4, quantity : 1 },
// meal_id:11
          { id : 33, meal_id : 11, nutrition_component_id : 3, quantity : 1 },
          { id : 34, meal_id : 11, nutrition_component_id : 6, quantity : 1 },
          { id : 35, meal_id : 11, nutrition_component_id : 8, quantity : 2 },
          { id : 36, meal_id : 11, nutrition_component_id : 1, quantity : 1 },
          { id : 37, meal_id : 11, nutrition_component_id : 4, quantity : 1 },
          { id : 38, meal_id : 11, nutrition_component_id : 3, quantity : 1 },
// meal_id:12
          { id : 39, meal_id : 12, nutrition_component_id : 8, quantity : 1 },
          { id : 40, meal_id : 12, nutrition_component_id : 1, quantity : 1 },
// meal_id:13
          { id : 41, meal_id : 13, nutrition_component_id : 8, quantity : 2 },
          { id : 42, meal_id : 13, nutrition_component_id : 3, quantity : 1 },
          { id : 43, meal_id : 13, nutrition_component_id : 8, quantity : 2 },
          { id : 44, meal_id : 13, nutrition_component_id : 4, quantity : 2 },
          { id : 45, meal_id : 13, nutrition_component_id : 6, quantity : 1 },
          { id : 46, meal_id : 13, nutrition_component_id : 1, quantity : 1 },
          { id : 47, meal_id : 13, nutrition_component_id : 4, quantity : 1 },
// meal_id:14
          { id : 48, meal_id : 14, nutrition_component_id : 4, quantity : 2 },
// meal_id:15
          { id : 49, meal_id : 15, nutrition_component_id : 3, quantity : 1 },
          { id : 50, meal_id : 15, nutrition_component_id : 1, quantity : 1 },
          { id : 51, meal_id : 15, nutrition_component_id : 6, quantity : 1 },
          { id : 52, meal_id : 15, nutrition_component_id : 5, quantity : 1 },
          { id : 53, meal_id : 15, nutrition_component_id : 4, quantity : 1 },
          { id : 54, meal_id : 15, nutrition_component_id : 5, quantity : 1 },
        ]);
      })


      .then(() => {
        return resolve()
      })
    })
  }

}
