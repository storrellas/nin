import 'reflect-metadata';
import * as nconf from 'nconf';
import * as fs from 'fs';
import { InversifyExpressServer } from 'inversify-express-utils';
import { Container } from 'inversify';
import * as bodyParser from 'body-parser';
import TYPES from './constant/types';
import * as xml2js from 'xml2js';
import { Request, Response, Application, NextFunction } from 'express';


import { LoggerInstance, transports, LoggerOptions, WLogger } from './utils/logger';
import { IModels, Models } from './models/model';
import { IDataStore, DataStore, LocalDataStore } from './service/datastore';
import { ICoreModuleManager, CoreModuleManager } from './models/core_module_manager';
import { ICoreService, CoreService } from './service/core_service';

import { RequestType } from './controller/core_controller';
import  './controller/core_controller';

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
let config_file : string = nconf.get('config_file') || './src/resources/NINConfiguration.json.default';
if (!fs.existsSync(config_file)) {
  console.error("Default Configuration file " + config_file + " was not found! ");
  process.exit(1);
}
nconf.file({ file: config_file });

// Enable custom configuration file
config_file = './src/resources/NINConfiguration.json.default';
if (fs.existsSync(config_file)) {
  console.error("Reading custom Configuration file " + config_file + " was not found! ");
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
if( process.env.NODE_ENV === 'production')
{
  // container.bind<IDataStore>(TYPES.DataStore).toConstantValue(
  //   new LocalDataStore(new WLogger())
  // );

  container.bind<IDataStore>(TYPES.DataStore).toConstantValue(
    new DataStore(container.get<LoggerInstance>(TYPES.Logger), {
      host   : nconf.get('REDIS:HOST'),
      port   : nconf.get('REDIS:PORT'),
      expire : nconf.get('REDIS:EXPIRE')
    })
  );

}else{
  container.bind<IDataStore>(TYPES.DataStore).toConstantValue(
    new DataStore(container.get<LoggerInstance>(TYPES.Logger), {
      host   : nconf.get('REDIS:HOST'),
      port   : nconf.get('REDIS:PORT'),
      expire : nconf.get('REDIS:EXPIRE')
    })
  );
}



if( nconf.get('NODE_ENV') === 'integration_test'){
  nconf.set('MYSQL','USING SQLITE FOR INTEGRATION TESTS')
  container.bind<IModels>(TYPES.Models).toConstantValue(new Models(
    "configuration","","",
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

  container.bind<IModels>(TYPES.Models).toConstantValue(new Models(
    "configuration",
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
      logging: false
    }
    )
  );

}


container.bind<ICoreModuleManager>(TYPES.CoreModuleManager).toConstantValue(new CoreModuleManager(
    container.get<IModels>(TYPES.Models),
    container.get<LoggerInstance>(TYPES.Logger)
));
container.bind<ICoreService>(TYPES.CoreService).toConstantValue(
  new CoreService(
    container.get<ICoreModuleManager>(TYPES.CoreModuleManager),
    container.get<IDataStore>(TYPES.DataStore),
    container.get<LoggerInstance>(TYPES.Logger)
  )
);

// ------------------------------------

import { GigyaOptions, GigyaController } from './controller/gigya_controller';

const android_gigya : GigyaOptions = new GigyaOptions()
android_gigya.api_key     = '3_HkjGLqe4R73hayOfESeZeR-ABzTxZTPrK8qhxZoe-0mweFle_sL9O4-ojQp9IxuP';
android_gigya.data_center = 'us1';
android_gigya.user_key    = 'AMvnR4qi0nSo';
android_gigya.secret      = 'fpZ/5fUHcv8HT4fSU7FdrO11mfjTSWC1';

const ios_gigya : GigyaOptions = new GigyaOptions()
ios_gigya.api_key     = '3_-7gHURwQ0lLRQhSQi9GpB2e8tmk2gM3Akqzg-GxyNcTHNpEBO3vKghOD_PVNVG6G';
ios_gigya.data_center = 'us1';
ios_gigya.user_key    = 'AMvnR4qi0nSo';
ios_gigya.secret      = 'fpZ/5fUHcv8HT4fSU7FdrO11mfjTSWC1';

container.bind<GigyaOptions>(TYPES.GigyaOptions).toConstantValue(android_gigya);
/**/


/*

// Include Gigya's SDK
import Gigya from 'gigya';

class GigyaConfiguration{
  api_key     : string;
  data_center : string;
  user_key    : string;
  secret      : string;
}

const android_gigya : GigyaConfiguration = new GigyaConfiguration()
android_gigya.api_key     = '3_HkjGLqe4R73hayOfESeZeR-ABzTxZTPrK8qhxZoe-0mweFle_sL9O4-ojQp9IxuP';
android_gigya.data_center = 'us1';
android_gigya.user_key    = 'AMvnR4qi0nSo';
android_gigya.secret      = 'fpZ/5fUHcv8HT4fSU7FdrO11mfjTSWC1';

const ios_gigya : GigyaConfiguration = new GigyaConfiguration()
ios_gigya.api_key     = '3_-7gHURwQ0lLRQhSQi9GpB2e8tmk2gM3Akqzg-GxyNcTHNpEBO3vKghOD_PVNVG6G';
ios_gigya.data_center = 'us1';
ios_gigya.user_key    = 'AMvnR4qi0nSo';
ios_gigya.secret      = 'fpZ/5fUHcv8HT4fSU7FdrO11mfjTSWC1';

const account_gigya : GigyaConfiguration = android_gigya

// Initialize SDK with your API Key and Secret.
const gigya = new Gigya(account_gigya.api_key, account_gigya.data_center,
                          account_gigya.user_key, account_gigya.secret);


// // Fetch user's account.
// // Returns a Promise. Promise is thrown on error.
// // Get Account Info
// // --------------------
// const response = gigya.accounts.getAccountInfo({
//   UID: '22caa681b4c24c409597b318e22b2734'
// }).then( (response:any) => {
//   console.log(response);
// }).catch( (error: any) => {
//   console.log(error);
// });


// LOGIN
// -------------
const response = gigya.accounts.login({
  loginID: 'oxn93112@ckoie.com',
  password: '12345678',
  include : 'data',
  sessionExpiration: 60000
}).then( (response:any) => {
  console.log(response);
}).catch( (error: any) => {
  console.log("LJFDSÑLFDSJ ")
  console.log(error);
});

// // getJWTPublicKey
// // -------------
// const response = gigya.accounts.getJWTPublicKey()
// .then( (response:any) => {
//   console.log(response);
// }).catch( (error: any) => {
//   console.log(error);
// });

// // getJWT
// // -------------
// const response = gigya.accounts.getJWT({
//   targetUID: '22caa681b4c24c409597b318e22b2734'
// })
// .then( (response:any) => {
//   console.log(response);
// }).catch( (error: any) => {
//   console.log(error);
// });
/**/

// ------------------------------------

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
   //app.use(bodyParser.json());
   app.use(bodyParser.text({
     type: () => true
   }));


   // Middleware for extracting data from url / body and set into request.data
    app.use((request: Request, response: Response, next : NextFunction) => {

// TODO: Check whether request is GET or POST_get_core_by

        // Check whether data in URL / body
        let data : string = "";
        if( request.body.length > 0 ){
          data = request.body;
        }else if( request.query.data != undefined ){
          data = request.query.data;
        }else{
          response.status(400).json( {response:'no data identified in request'} )
        }

        // Grab parameters
        if( data.length > 0 ){
          try{
            let json_data : any = JSON.parse(data)
            request.data = JSON.parse(data)
            request.request_type = RequestType.JSON;
            next();
          }catch{
            logger.debug("JSON cannot be parsed '" + request.body + "'. Proceeding to XML parsing ...")
            // Parse XML
            var parser = new xml2js.Parser({explicitArray : false});
            parser.parseString(data, (err :any, result: any) => {
              if( err == null ){
                request.data = result.data;
                request.request_type = RequestType.XML;
                next()
              }else{
                this.logger.error("Problems parsing " + result + " " + err)
                response.status(400).json( {response:'no possible to parse data either JSON or XML'} )
              }
            });
          }

        }

    });



 });

export const serverInstance = server.build();
serverInstance.listen(http_port);
console.log(`Server started on port ${http_port} :)`);
