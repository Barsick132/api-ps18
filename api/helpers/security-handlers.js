const passport = require('../auth/passport');
const RolesReq = require('../../requests/RolesReq');

const FILE = './api/helpers/security-handlers.js';

function Basic(req, def, scopes, callback) {
    const METHOD = 'Basic()';
    console.log('\n', FILE, METHOD);
    passport.authenticate('basic', {session: false}, function (err, data, info) {
        if (err) {
            console.error(FILE, METHOD, '\n', err);
            req.error = err;
        } else {
            if(data) console.log(FILE, METHOD, '\n', 'User Authentication');
            req.user = data.user;
        }
        callback();
    })(req, null, callback);
}

function JWT(req, def, scopes, callback) {
    const METHOD = 'JWT()';
    console.log('\n', FILE, METHOD);
    passport.authenticate('jwt', {session: false}, function (err, data, info) {
        req.roles = RolesReq.getAllRoles();
        if (err) {
            console.error(FILE, METHOD, '\n', err);
            req.error = err;
        } else {
            if(data) console.log(FILE, METHOD, '\n', 'User Authentication');
            req.user = data.user;
        }
        callback();
    })(req, null, callback);
}

module.exports = {
    Basic: Basic,
    JWT: JWT
};