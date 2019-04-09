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
exports.addEmpPosts = function (req, body) {
    const METHOD = 'addEmpPosts()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_VALID_POSTS: 'NOT_FOUND_VALID_POSTS',
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

        PostsReq.getOriginalPosts(knex, body.emp_id, body.pst_array.map(i => i.pst_id))
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_VALID_POSTS);
                }

                console.log('Found Valid Posts');
                return PostsReq.insertEmpPosts(knex, body.emp_id, res);
            })
            .then((res) => {
                if (res.length === 0) {
                    new Error(STATUS.NOT_ADDED_POSTS)
                }

                console.log('Added ' + res.length + ' Posts');
                result = {
                    status: STATUS.OK,
                    payload: res.map(item => item.pst_id)
                };

                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_ADDED_POSTS ||
                    err.message === STATUS.NOT_FOUND_VALID_POSTS) {
                    result = {status: err.message}
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })

    });
};


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
exports.delEmpPosts = function (req, body) {
    const METHOD = 'delEmpPosts()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_DOUND_DELETED_POSTS: 'NOT_DOUND_DELETED_POSTS',
            CANNOT_DEL_ALL_POSTS: 'CANNOT_DEL_ALL_POSTS',
            NOT_FOUND_REMOVABLE_POSTS: 'NOT_FOUND_REMOVABLE_POSTS',
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

        PostsReq.getEmpPostsId(knex, body.emp_id)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_REMOVABLE_POSTS);
                }


                let removablePosts = [];
                body.pst_array.forEach(item => {
                    if (res.some(i => i.pst_id === item.pst_id)) {
                        removablePosts.push(item.pst_id);
                    }
                });

                if (removablePosts.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_REMOVABLE_POSTS);
                }

                console.log('Found Removable Posts');
                if (removablePosts.length === res.length) {
                    throw new Error(STATUS.CANNOT_DEL_ALL_POSTS);
                }

                return PostsReq.delEmpPosts(knex, body.emp_id, removablePosts);
            })
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_DELETED_POSTS);
                }

                console.log('Deleted ' + res.length + ' Posts');
                result = {
                    status: STATUS.OK,
                    payload: res
                };

                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_REMOVABLE_POSTS ||
                    err.message === STATUS.CANNOT_DEL_ALL_POSTS ||
                    err.message === STATUS.NOT_FOUND_DELETED_POSTS) {
                    result = {status: err.message}
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};


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
            NOT_FOUND_REMOVABLE_POSTS: 'NOT_FOUND_REMOVABLE_POSTS',
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

        PostsReq.getRemovablePosts(knex, body.map(item => {
            return item.pst_id;
        }))
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_REMOVABLE_POSTS);
                }

                console.log('Found Removable Posts');
                return PostsReq.delPosts(knex, res.map(item => {
                    return item.pst_id;
                }))
            })
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_DELETED_POSTS);
                }

                console.log('Posts Deleted');
                result = {status: STATUS.OK};
                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_DELETED_POSTS ||
                    err.message === STATUS.NOT_FOUND_REMOVABLE_POSTS) {
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
exports.getEmpPosts = function (req, body) {
    const METHOD = 'getEmpPosts()';
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

        PostsReq.getEmpPostsFull(knex, body.emp_id)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_POSTS);
                }

                console.log('Found Emp Posts');
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

