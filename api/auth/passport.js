const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const RolesReq = require('../../requests/RolesReq');
const UsersReq = require('../../requests/UsersReq');
const AuthReq = require('../../requests/AuthReq');
const ROLE = require('../../constants').ROLE;

const config = require('../config');

const FILE = './api/auth/passport.js';


// Basic стратегия
passport.use(
    new BasicStrategy(function (username, password, done) {
            const METHOD = 'BasicStrategy()';
            console.log(FILE, METHOD);

        const STATUS = {
            NOT_AUTH: 'NOT_AUTH',
            NOT_ROLES_USER: 'NOT_ROLES_USER',
            ERROR_AUTH: 'ERROR_AUTH',
            NOT_FOUND_PARENT_INFO: 'NOT_FOUND_PARENT_INFO'
        };

            let data = {};
            const knex = require('../../index').knex;
            UsersReq.getPeplByLogin(knex, username)
                .then((res) => {
                    console.log('\tGetting User');
                    if (res.length !== 0 && AuthReq.encryptPassword(password, res[0].pepl_salt) === res[0].pepl_hash_pass) {
                        data.user = res[0];
                        return RolesReq.getUserRoles(knex, data.user.pepl_id);
                    } else {
                        return done(STATUS.NOT_AUTH);
                    }
                })
                .then((res) => {
                    if (res === undefined) return;
                    console.log('\tGetting User Role');

                    if (res.length === 0) {
                        return done(STATUS.NOT_ROLES_USER);
                    }

                    data.user.roles = res.map(item => item.role_name);

                    if (!UsersReq.checkRole(data.user.roles, ROLE.PARENT)) {
                        console.log('\tNot A Parent');
                        return done(null, data);
                    }

                    console.log('\tIs A Parent');
                    return UsersReq.getConfParentById(knex, data.user.pepl_id);
                })
                .then((res) => {
                    if (res === undefined) return;

                    if (res.length !== 1) {
                        return done(STATUS.NOT_FOUND_PARENT_INFO);
                    }

                    console.log('\tFound Confirm Reg');
                    data.user.prnt_data = {
                        prnt_confirm: res[0].prnt_confirm
                    };

                    return done(null, data);
                })
                .catch((err) => {
                    console.error(err);
                    return done(STATUS.ERROR_AUTH);
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

            const STATUS = {
                NOT_AUTH: 'NOT_AUTH',
                NOT_ROLES_USER: 'NOT_ROLES_USER',
                ERROR_AUTH: 'ERROR_AUTH',
                NOT_FOUND_PARENT_INFO: 'NOT_FOUND_PARENT_INFO'
            };

            let data = {};
            const knex = require('../../index').knex;
            UsersReq.getPeplById(knex, jwt_payload.pepl_id)
                .then((res) => {
                    console.log('\tGetting User');
                    if (res.length !== 1) {
                        return done(STATUS.NOT_AUTH);
                    }

                    data.user = res[0];
                    return RolesReq.getUserRoles(knex, data.user.pepl_id);
                })
                .then((res) => {
                    if (res === undefined) return;
                    console.log('\tGetting User Role');

                    if (res.length === 0) {
                        return done(STATUS.NOT_ROLES_USER);
                    }

                    data.user.roles = res.map(item => item.role_name);

                    if (!UsersReq.checkRole(data.user.roles, ROLE.PARENT)) {
                        console.log('\tNot A Parent');
                        return done(null, data);
                    }

                    console.log('\tIs A Parent');
                    return UsersReq.getConfParentById(knex, data.user.pepl_id);
                })
                .then((res) => {
                    if (res === undefined) return;

                    if (res.length !== 1) {
                        return done(STATUS.NOT_FOUND_PARENT_INFO);
                    }

                    console.log('\tFound Confirm Reg');
                    data.user.prnt_data = {
                        prnt_confirm: res[0].prnt_confirm
                    };

                    return done(null, data);
                })
                .catch((err) => {
                    console.error(err);
                    return done(STATUS.ERROR_AUTH);
                });
        }
    ));

module.exports = passport;