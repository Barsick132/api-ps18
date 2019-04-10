'use strict';

const knex = require('../index').knex;
const UsersReq = require('../requests/UsersReq');
const RolesReq = require('../requests/RolesReq');
const ROLE = require('../constants').ROLE;

const FILE = './service/PostsService.js';

/**
 * Добавить роли пользователю
 *
 * body Body_31 ID пользователя и список ID ролей
 * returns inline_response_200_6
 **/
exports.addUserRoles = function (req, body) {
    const METHOD = 'addUserRoles()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_USER_ROLES: 'NOT_FOUND_USER_ROLES',
            NOT_FOUND_ADDED_ROLES: 'NOT_FOUND_ADDED_ROLES',
            NOT_FOUND_VALID_ROLES_TO_ADD: 'NOT_FOUND_VALID_ROLES_TO_ADD',
            CANNOT_ADD_ROLES_TO_NON_EMPLOYEE: 'CANNOT_ADD_ROLES_TO_NON_EMPLOYEE',
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

        RolesReq.getUserRoles(knex, body.pepl_id)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_USER_ROLES);
                }
                console.log('Found User Roles');

                const currentRole = res.map(i => i.role_name);
                if (!UsersReq.checkRole(currentRole, ROLE.EMPLOYEE)) {
                    throw new Error(STATUS.CANNOT_ADD_ROLES_TO_NON_EMPLOYEE);
                }
                console.log('Is Employee');

                const roleArr = RolesReq.getAllRoles();
                for (let i = 0; i < body.role_array.length; i++) {
                    // Проверяем есть ли уже данная роль у сотрудника
                    if (UsersReq.checkRole(currentRole, body.role_array[i])) {
                        body.role_array.splice(i, 1);
                        i--;
                        continue;
                    }

                    // Убираем возможность добавлять роль ученика или родителя сотруднику
                    if (body.role_array[i] === ROLE.STUDENT ||
                        body.role_array[i] === ROLE.PARENT) {
                        body.role_array.splice(i, 1);
                        i--;
                        continue;
                    }

                    // Удаляем несуществующие роли
                    if (!roleArr.some(item => item === body.role_array[i])) {
                        body.role_array.splice(i, 1);
                        i--;
                    }
                }

                if (body.role_array.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_VALID_ROLES_TO_ADD);
                }
                console.log('Found Valid Roles To Add');

                return RolesReq.addUserRoles(
                    knex, body.pepl_id,
                    body.role_array.map(i => {
                        return {
                            role_name: i
                        }
                    })
                )
            })
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_ADDED_ROLES);
                }
                console.log('Added ' + res.length + ' Roles');

                result = {
                    status: STATUS.OK,
                    payload: res
                };
                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_USER_ROLES ||
                    err.message === STATUS.CANNOT_ADD_ROLES_TO_NON_EMPLOYEE ||
                    err.message === STATUS.NOT_FOUND_VALID_ROLES_TO_ADD ||
                    err.message === STATUS.NOT_FOUND_ADDED_ROLES) {
                    result = {status: err.message}
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};


/**
 * Удалить роли у пользователя
 *
 * body Body_32 ID пользователя и список ID ролей
 * returns inline_response_200_6
 **/
exports.delUserRoles = function (req, body) {
    const METHOD = 'getRoles()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_DELETED_ROLES: 'NOT_FOUND_DELETED_ROLES',
            NOT_FOUND_VALID_REMOVABLE_ROLES: 'NOT_FOUND_VALID_REMOVABLE_ROLES',
            CANNOT_DELETE_SINGLE_ROLE: 'CANNOT_DELETE_SINGLE_ROLE',
            CANNOT_ADD_ROLES_TO_NON_EMPLOYEE: 'CANNOT_ADD_ROLES_TO_NON_EMPLOYEE',
            NOT_FOUND_USER_ROLES: 'NOT_FOUND_USER_ROLES',
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

        RolesReq.getUserRoles(knex, body.pepl_id)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_USER_ROLES);
                }
                console.log('Found User Roles');

                const currentRole = res.map(i => i.role_name);
                if (!UsersReq.checkRole(currentRole, ROLE.EMPLOYEE)) {
                    throw new Error(STATUS.CANNOT_ADD_ROLES_TO_NON_EMPLOYEE);
                }
                console.log('Is Employee');

                if (currentRole.length === 1) {
                    throw new Error(STATUS.CANNOT_DELETE_SINGLE_ROLE);
                }
                console.log('Found Several Roles');

                for (let i = 0; i < body.role_array.length; i++) {
                    if (!UsersReq.checkRole(currentRole, body.role_array[i]) ||
                        body.role_array[i] === ROLE.EMPLOYEE) {
                        body.role_array.splice(i, 1);
                        i--;
                    }
                }
                if (body.role_array.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_VALID_REMOVABLE_ROLES);
                }
                console.log('Found Valid Removable Roles');

                return RolesReq.delUserRoles(knex, body.pepl_id, body.role_array);
            })
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_DELETED_ROLES);
                }

                console.log('Deleted ' + res.length + ' Roles');
                result = {
                    status: STATUS.OK,
                    payload: res
                };

                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_USER_ROLES ||
                    err.message === STATUS.CANNOT_ADD_ROLES_TO_NON_EMPLOYEE ||
                    err.message === STATUS.CANNOT_DELETE_SINGLE_ROLE ||
                    err.message === STATUS.NOT_FOUND_VALID_REMOVABLE_ROLES ||
                    err.message === STATUS.NOT_FOUND_DELETED_ROLES) {
                    result = {status: err.message}
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};


/**
 * Получение списка ролей
 *
 * returns inline_response_200_25
 **/
exports.getRoles = function (req) {
    const METHOD = 'getRoles()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
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

        result = {
            status: STATUS.OK,
            payload: RolesReq.getAllRoles()
        };
        resolve(result);
    });
};


/**
 * Получить список ролей пользователя
 *
 * body Body_30 ID пользователя
 * returns inline_response_200_26
 **/
exports.getUserRoles = function (req, body) {
    const METHOD = 'getUserRoles()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_USER_ROLES: 'NOT_FOUND_USER_ROLES',
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

        RolesReq.getUserRoles(knex, body.pepl_id)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_USER_ROLES);
                }

                console.log('Found ' + res.length + ' User Roles');
                result = {
                    status: STATUS.OK,
                    payload: res.map(i => i.role_name)
                };

                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_USER_ROLES) {
                    result = {status: err.message}
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};

