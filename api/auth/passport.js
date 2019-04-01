const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const crypto = require('crypto');
const RolesReq = require('../../requests/RolesReq');
const UsersReq = require('../../requests/UsersReq');

const config = require('../config');

const FILE = './api/auth/passport.js';

const encryptPassword = (password, salt) => {
    return crypto.createHmac('sha1', salt).update(password).digest('hex');
};


// Basic стратегия
passport.use(
    new BasicStrategy(function (username, password, done) {
            const METHOD = 'BasicStrategy()';
            console.log(FILE, METHOD);

            let data = {};
            const knex = require('../../index').knex;
            UsersReq.getPeplByLogin(knex, username)
                .then((res) => {
                    console.log('Getting User');
                    if (res.length !== 0 && encryptPassword(password, res[0].pepl_salt) === res[0].pepl_hash_pass) {
                        data.user = res[0];
                        return RolesReq.getUserRoles(knex, data.user.pepl_id);
                    } else {
                        return done('NOT_AUTH');
                    }
                })
                .then((res) => {
                    if (res === undefined) return;

                    console.log('Getting User Role');
                    if (res.length !== 0) {
                        data.user.roles = res.map(items => {
                            return items.role_name;
                        });
                        return done(null, data);
                    } else {
                        return done('NOT_ROLES_USER');
                    }
                })
                .catch((err) => {
                    console.error(err);
                    return done('ERROR_AUTH');
                });
        }
    ));

// JWT стратегия
let opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
opts.secretOrKey = config.jwt.secret;

passport.use(
    new JwtStrategy(opts, function (jwt_payload, done) {
            const METHOD = 'JwtStrategy()';
            console.log(FILE, METHOD);

            let data = {};
            const knex = require('../../index').knex;
            UsersReq.getPeplById(knex, jwt_payload.pepl_id)
                .then((res) => {
                    console.log('Getting User');
                    if (res.length === 1) {
                        data.user = res[0];
                        return RolesReq.getUserRoles(knex, data.user.pepl_id);
                    } else {
                        return done('NOT_AUTH');
                    }
                })
                .then((res) => {
                    if (res === undefined) return;
                    console.log('Getting User Role');
                    if (res.length && res.length !== 0) {
                        data.user.roles = res.map(items => {
                            return items.role_name;
                        });
                        return done(null, data);
                    } else {
                        return done('NOT_ROLES_USER');
                    }
                })
                .catch((err) => {
                    console.error(err);
                    return done('ERROR_AUTH');
                });
        }
    ));

module.exports = passport;