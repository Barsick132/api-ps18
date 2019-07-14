'use strict';

const fs = require('fs'),
    path = require('path'),
    http = require('http');
//const bodyParser = require('body-parser');

const appConnect = require('connect')();
const swaggerTools = require('swagger-tools');
const jsyaml = require('js-yaml');
const passport = require('./api/auth/passport');
const secHandlers = require('./api/helpers/security-handlers');

const process = require('process');
const serverPort = process.env.PORT || 80;

const cors = require('cors');

const Knex = require('knex');
const yaml_conf = require('yaml-config');
const settings = yaml_conf.readConfig('./app.yaml', 'env_variables');

// swaggerRouter configuration
const options = {
    swaggerUi: path.join(__dirname, '/swagger.json'),
    controllers: path.join(__dirname, './controllers'),
    useStubs: process.env.NODE_ENV === 'production' // Conditionally turn on stubs (mock mode)
};

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
const spec = fs.readFileSync(path.join(__dirname, 'api/swagger.yaml'), 'utf8');
const swaggerDoc = jsyaml.safeLoad(spec);

// Подключаемся к БД
module.exports.knex = connect();

function connect() {
    // [START gae_flex_postgres_connect]
    const config = {
        user: process.env.SQL_USER || settings.SQL_USER,
        password: process.env.SQL_PASSWORD || settings.SQL_PASSWORD,
        database: process.env.SQL_DATABASE || settings.SQL_DATABASE,
        host: process.env.SQL_HOST || settings.SQL_HOST,
        port: process.env.SQL_PORT || settings.SQL_PORT,
        uri: process.env.SQL_URI || settings.SQL_URI,
        ssl: process.env.SQL_SSL || settings.SQL_SSL
    };

    // Данные подключения к БД
    return Knex({
        client: 'pg',
        connection: config
    });
}

appConnect.use(cors());
appConnect.use(function (req, res, next) {

    if (req.method === 'OPTIONS') {
        console.log('!OPTIONS');
        let headers = {};
        headers["Access-Control-Allow-Origin"] = "*";
        headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Credentials"] = false;
        headers["Access-Control-Max-Age"] = '86400';
        headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
        res.writeHead(200, headers);
        res.end();
    }
    else {
        next();
    }
});

appConnect.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    next();
});

//appConnect.use(bodyParser.json({limit: 2}));
//appConnect.use(bodyParser.raw({limit: 2}));

appConnect.use(passport.initialize());

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {

    // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
    appConnect.use(middleware.swaggerMetadata());

    appConnect.use(middleware.swaggerSecurity({
        //manage token function in the 'auth' module
        Basic: secHandlers.Basic,
        JWT: secHandlers.JWT
    }));

    // Validate Swagger requests
    appConnect.use(middleware.swaggerValidator());

    // Route validated requests to appropriate controller
    appConnect.use(middleware.swaggerRouter(options));

    // Serve the Swagger documents and Swagger UI
    appConnect.use(middleware.swaggerUi());

    //appConnect.use(require("./router"));

    // Start the server
    http.createServer(appConnect).listen(serverPort, function () {
        console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
        console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
    });

});
