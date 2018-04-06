import 'reflect-metadata';
import * as nconf from 'nconf';
import * as fs from 'fs';
import { InversifyExpressServer } from 'inversify-express-utils';
import { Container } from 'inversify';
import * as bodyParser from 'body-parser';
import TYPES from './constant/types';
import * as express from 'express'
import { Request, Response, Application, NextFunction } from 'express';


import * as helper from './utils/helper';
import { LoggerInstance, transports, LoggerOptions, WLogger } from './utils/logger';
import { IModel, Model } from './models/model';
import { IDataStore, DataStore, LocalDataStore } from './service/datastore';
import { GigyaOptions, GigyaService } from './service/gigya_service';

import  './controller/content_controller';
import  './controller/image_controller';
import  './controller/profile_controller';
import  './controller/tracking_weight_controller';
import  './controller/tracking_growth_controller';
import  './controller/tracking_food_controller';

declare global {
  namespace Express {
    interface Request {
      uid     : string | undefined;
      gcid    : string | undefined;
      api_key : string | undefined;
    }
  }
}

// ------------------------------------
// CONFIGURATION
// ------------------------------------

//
// Setup nconf to use (in-order):
//   1. Environment variables
//   2. Command-line arguments
//   3. A file located at 'path/to/config.json'
//
nconf.argv().env({separator:'__'})

// Check whether configuration file is found
let config_file : string = nconf.get('config_file') || __dirname + '/../src/resources/NINConfiguration.json.default';
if (!fs.existsSync(config_file)) {
  console.error("Default Configuration file " + config_file + " was not found! ");
  process.exit(1);
}
nconf.file({ file: config_file });

// Enable custom configuration file
const custom_config_file = __dirname + '/../src/resources/NINConfiguration.json';
if (fs.existsSync(custom_config_file)) {
  config_file = custom_config_file
  console.log("Reading custom Configuration file " + config_file + " was found! ");
  nconf.file({ file: config_file });
}

nconf.set('NODE_ENV', process.env.NODE_ENV)

// ------------------------------------
// CONFIGURE LOGGER
// ------------------------------------
const logger : LoggerInstance = new WLogger({
  level: nconf.get('LOGLEVEL'),
  transports: [
    new transports.Console({
      colorize: true,
      prettyPrint: true,
      timestamp: true
    })
  ]
})

// ------------------------------------
// CONTAINER CONFIGURATION
// ------------------------------------
const container = new Container();

container.bind<LoggerInstance>(TYPES.Logger).toConstantValue(logger);
// if( process.env.NODE_ENV === 'production')
// {
//   // container.bind<IDataStore>(TYPES.DataStore).toConstantValue(
//   //   new LocalDataStore(new WLogger())
//   // );
//
//   container.bind<IDataStore>(TYPES.DataStore).toConstantValue(
//     new DataStore(container.get<LoggerInstance>(TYPES.Logger), {
//       host   : nconf.get('REDIS:HOST'),
//       port   : nconf.get('REDIS:PORT'),
//       expire : nconf.get('REDIS:EXPIRE')
//     })
//   );
//
// }else{
//   container.bind<IDataStore>(TYPES.DataStore).toConstantValue(
//     new DataStore(container.get<LoggerInstance>(TYPES.Logger), {
//       host   : nconf.get('REDIS:HOST'),
//       port   : nconf.get('REDIS:PORT'),
//       expire : nconf.get('REDIS:EXPIRE')
//     })
//   );
// }

if( nconf.get('NODE_ENV') === 'integration_test'){
  nconf.set('MYSQL','USING SQLITE FOR INTEGRATION TESTS')
  container.bind<IModel>(TYPES.Model).toConstantValue(new Model(
    "NIN","","",
    {
      dialect: 'sqlite',
      // disable logging; default: console.log
      storage: process.env.sqlfile,
      //logging: false
    }
    )
  );
}
else
{

  container.bind<IModel>(TYPES.Model).toConstantValue(new Model(
    "NIN",
    nconf.get("MYSQL:USER"),
    nconf.get("MYSQL:PASSWORD"),
    {
      host: nconf.get("MYSQL:HOST"),
      dialect: 'mysql',
      pool: {
        max: 5,
        min: 0,
        idle: 10000
      },
      // disable logging; default: console.log
      logging: true
    }
    )
  );

}

// Gigya Controller
const gigya_options : GigyaOptions = new GigyaOptions()
gigya_options.api_key     = nconf.get("GIGYA:API_KEY_DEFAULT");
gigya_options.data_center = nconf.get("GIGYA:DATA_CENTER");
gigya_options.user_key    = nconf.get("GIGYA:USER_KEY");
gigya_options.secret      = nconf.get("GIGYA:SECRET");

container.bind<GigyaService>(TYPES.GigyaService).toConstantValue(
  new GigyaService( gigya_options, container.get<LoggerInstance>(TYPES.Logger) )
);


const tracking_options : helper.TrackingOptions = new helper.TrackingOptions()
tracking_options.max_trackings_list = nconf.get("MAX_TRACKING_LIST");
container.bind<helper.TrackingOptions>(TYPES.TrackingOptions).toConstantValue(tracking_options);

const image_options : helper.ImageOptions = new helper.ImageOptions()
image_options.path = nconf.get("IMAGE:PATH");
image_options.base_url = nconf.get("IMAGE:BASE_URL");
container.bind<helper.ImageOptions>(TYPES.ImageOptions).toConstantValue(image_options);

// ------------------------------------
// INITIALIZE APPLICATION
// ------------------------------------

const http_port  = nconf.get("HTTP_PORT")
logger.info('-------------------------------------')
logger.info('          NIN Backend                ')
logger.info('-------------------------------------')
logger.info('Listening at ' + http_port + ' for http')
fs.readFile(config_file, 'utf8', function (err : NodeJS.ErrnoException,data) {
   if (err) {
     return logger.error( err.message );
   }

   // Getting keys from '/etc/Orchestrator/OrchestratorAPIGateway.json' and printing JSON
   const data_json = JSON.parse(data);
   const result : { [key:string]:string; } = {};
   for (var p in data_json) {
     if( data_json.hasOwnProperty(p) ) {
       result[p] = nconf.get(p)
     }
   }

   logger.info('Configuration contents:\n' + JSON.stringify(result, null, '  '))
 });


// start the server
const server = new InversifyExpressServer(container);
server.setConfig((app: Application) => {
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  //Uncomment this to play with user controller that is working with jsons not binaries
  app.use(bodyParser.json());
  app.use(bodyParser.text({
    type: () => true
  }));

  // Serve static files
  app.use("/media", express.static(process.cwd() + '/media/'));


  // Middleware for extracting data from url / body and set into request.data
  app.use((request: Request, response: Response, next : NextFunction) => {

    // Cache time does not provide headers
    if( request.url.indexOf('custom/cache/time') >= 0 || request.url.indexOf('custom/security/message') >= 0){
      next()
      return
    }

    try{
      request.gcid = request.get('gcid')
      const token : any = request.get('token')
      request.uid = helper.get_uid(token)
      request.api_key = helper.get_api_key(token)
      next()
    }catch(e){
      logger.error("Error")
      console.log(e)
      response.json({result:-1, messge:String(e)})
    }
  });

});



export const serverInstance = server.build();
serverInstance.listen(http_port);
console.log(`Server started on port ${http_port} :)`);
