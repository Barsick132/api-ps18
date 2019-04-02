'use strict';

const knex = require('../index').knex;
const UsersReq = require('../requests/UsersReq');
const PostsReq = require('../requests/PostsReq');
const ROLE = require('../constants').ROLE;

const FILE = './service/PostsService.js';

/**
 * Добавить должности сотруднику
 *
 * body Body_34 ID сотрудника и список ID должностей
 * returns inline_response_200_6
 **/
exports.addEmpPosts = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "status": "OK"
        };
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Добавить должности
 *
 * body List Список должностей
 * returns inline_response_200_6
 **/
exports.addPosts = function (req, body) {
    const METHOD = 'addPosts()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_ADDED_POSTS: 'NOT_ADDED_POSTS',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            OK: 'OK'
        };

        let result = {};

        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (!UsersReq.checkRole(req.user.roles, ROLE.ADMIN)) {
            console.error('Not Admin');
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        PostsReq.insertPosts(knex, body)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_ADDED_POSTS);
                }

                console.log('Posts Added');

                result = {status: STATUS.OK};
                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_ADDED_POSTS) {
                    result = {status: err.message}
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};


/**
 * Удалить должности сотрудника
 *
 * body Body_35 ID сотрудника и список ID должностей
 * returns inline_response_200_6
 **/
exports.delEmpPosts = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "status": "OK"
        };
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Удалить должности
 *
 * body List Список ID должностей
 * returns inline_response_200_6
 **/
exports.delPosts = function (req, body) {
    const METHOD = 'delPosts()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_DELETED_POSTS: 'NOT_FOUND_DELETED_POSTS',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            OK: 'OK'
        };

        let result = {};

        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (!UsersReq.checkRole(req.user.roles, ROLE.ADMIN)) {
            console.error('Not Admin');
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        PostsReq.delPosts(knex, body.map(item => {
            return item.pst_id;
        }))
            .then((res) => {
                if(res === 0) {
                    throw new Error(STATUS.NOT_FOUND_DELETED_POSTS);
                }

                console.log('Posts Deleted');
                result = {status: STATUS.OK};
                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_DELETED_POSTS) {
                    result = {status: err.message}
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};


/**
 * Получить список должностей
 *
 * returns inline_response_200_27
 **/
exports.getAllPosts = function (req) {
    const METHOD = 'getAllPosts()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_POSTS: 'NOT_FOUND_POSTS',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            OK: 'OK'
        };

        let result = {};

        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (!UsersReq.checkRole(req.user.roles, ROLE.ADMIN)) {
            console.error('Not Admin');
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        PostsReq.getAllPosts(knex)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_POSTS)
                }

                console.log('All Posts Found');
                result = {
                    status: STATUS.OK,
                    payload: res
                };

                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_POSTS) {
                    result = {status: err.message}
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};


/**
 * Получить список должностей сотрудника
 *
 * body Body_33 ID сотрудника
 * returns inline_response_200_27
 **/
exports.getEmpPosts = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": [{
                "pst_id": 1,
                "pst_name": "Педагог-психолог",
                "pst_description": "pst_description"
            }, {
                "pst_id": 1,
                "pst_name": "Педагог-психолог",
                "pst_description": "pst_description"
            }],
            "status": "OK"
        };
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
}

