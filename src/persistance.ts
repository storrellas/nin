import 'reflect-metadata';
import * as nconf from 'nconf';
import * as fs from 'fs';

import { LoggerInstance, transports, LoggerOptions, WLogger } from './utils/logger';
import { IModel, Model } from './models/model';
import { Fixture } from './models/fixture';

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
// INITIALIZE APPLICATION
// ------------------------------------

const fixture : Fixture = new Fixture(
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
);

logger.info('-------------------------------------')
logger.info('          NIN Persistance          ')
logger.info('-------------------------------------')
logger.info('Configuration contents:');
const config: {[index: string]: any} = {};
const validConfig = [
  'MYSQL'
];
for (let key in nconf.get()) {
  if (validConfig.indexOf(key) !== -1) {
    config[key] = nconf.get(key);
  }
}
logger.info(JSON.stringify(config, null, 4));

logger.info("Creating models ...")

const create_user : boolean = true

fixture.sync(create_user)
.then( () => {
  if( create_user )
    logger.info("Created user models")
  logger.info("All models created successfully!")
  process.exit()
})
.catch( () =>{
  logger.error("Failed to create models")
  process.exit()
})
