'use strict';

const jwt = require("jsonwebtoken");
const config = require("../api/config");
const uniqid = require('uniqid');
const crypto = require('crypto');
const ROLE = require('../constants').ROLE;
const knex = require('../index').knex;
const RolesReq = require('../requests/RolesReq');
const PostsReq = require('../requests/PostsReq');
const AuthReq = require('../requests/AuthReq');
const UsersReq = require('../requests/UsersReq');

const FILE = './service/AuthService.js';

/**
 * Автопроверка подтверждения регистрации
 *
 * body List ID родителя
 * returns inline_response_200_20
 **/
exports.autoCheckParentReg = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": [{
                "cr_id": 1,
                "cr_teacher_fullname": "OK",
                "cr_class": "OK",
                "cr_child_fullname": "OK"
            }, {
                "cr_id": 1,
                "cr_teacher_fullname": "OK",
                "cr_class": "OK",
                "cr_child_fullname": "OK"
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


/**
 * Подтверждение регистрации родителей
 *
 * body Body_23 ID родителя и статус подтверждения
 * returns inline_response_200_6
 **/
exports.confirmParentReg = function (body) {
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
 * Получить список запросов на регистрацию
 *
 * returns inline_response_200_19
 **/
exports.getListConfirmReg = function () {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": [{
                "prnt_id": 2,
                "cr_array": [{
                    "cr_first_child": "Семен",
                    "cr_last_teacher": "Иванович",
                    "cr_id": 1,
                    "cr_class": "7Б",
                    "cr_first_teacher": "Иван",
                    "cr_second_child": "Тарасов",
                    "cr_last_child": "Львович",
                    "cr_second_teacher": "Иванов"
                }, {
                    "cr_first_child": "Семен",
                    "cr_last_teacher": "Иванович",
                    "cr_id": 1,
                    "cr_class": "7Б",
                    "cr_first_teacher": "Иван",
                    "cr_second_child": "Тарасов",
                    "cr_last_child": "Львович",
                    "cr_second_teacher": "Иванов"
                }],
                "pepl_data": {
                    "pepl_first_name": "Иван",
                    "pepl_gender": true,
                    "pepl_second_name": "Иванов",
                    "pepl_last_name": "Иванович",
                    "pepl_email": "admin@mail.ru",
                    "pepl_phone": "9568734554",
                    "pepl_birthday": "1977-01-19"
                },
                "prnt_data": {
                    "prnt_flat": "45",
                    "prnt_home": "17Б",
                    "prnt_confirm": 0,
                    "prnt_city": "Липецк",
                    "prnt_street": "Ангарская"
                }
            }, {
                "prnt_id": 2,
                "cr_array": [{
                    "cr_first_child": "Семен",
                    "cr_last_teacher": "Иванович",
                    "cr_id": 1,
                    "cr_class": "7Б",
                    "cr_first_teacher": "Иван",
                    "cr_second_child": "Тарасов",
                    "cr_last_child": "Львович",
                    "cr_second_teacher": "Иванов"
                }, {
                    "cr_first_child": "Семен",
                    "cr_last_teacher": "Иванович",
                    "cr_id": 1,
                    "cr_class": "7Б",
                    "cr_first_teacher": "Иван",
                    "cr_second_child": "Тарасов",
                    "cr_last_child": "Львович",
                    "cr_second_teacher": "Иванов"
                }],
                "pepl_data": {
                    "pepl_first_name": "Иван",
                    "pepl_gender": true,
                    "pepl_second_name": "Иванов",
                    "pepl_last_name": "Иванович",
                    "pepl_email": "admin@mail.ru",
                    "pepl_phone": "9568734554",
                    "pepl_birthday": "1977-01-19"
                },
                "prnt_data": {
                    "prnt_flat": "45",
                    "prnt_home": "17Б",
                    "prnt_confirm": 0,
                    "prnt_city": "Липецк",
                    "prnt_street": "Ангарская"
                }
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


/**
 * Авторизация пользователей
 *
 * returns inline_response_200_17
 **/
exports.login = function (req) {
    const METHOD = 'login()';

    return new Promise(function (resolve, reject) {
        let result = {};
        if (req.isAuthenticated()) {
            const regex = new RegExp('^((Basic)[ ]|(JWT)[ ]).+$');
            let match = req.headers.authorization.match(regex);

            let data = {
                pepl_login: req.user.pepl_login,
                pepl_second_name: req.user.pepl_second_name,
                pepl_first_name: req.user.pepl_first_name,
                pepl_last_name: req.user.pepl_last_name,
            };

            if (match[2]) {
                data.token = 'JWT ' + jwt.sign({pepl_id: req.user.pepl_id}, config.jwt.secret, {expiresIn: config.jwt.expiresIn});
            }
            if (match[3]) {
                data.token = req.headers.authorization;
            }

            data.role_array = req.user.roles;
            result = {
                status: "OK",
                payload: data
            };

            resolve(result);
        } else {
            console.log(FILE, '\n', METHOD, 'User is not authenticated');
            result = {
                status: "NOT_AUTH"
            };
            reject(result);
        }
    });
};


/**
 * Регистрация сотрудников из xlsx
 *
 * body String Файл в base64
 * returns inline_response_200_18
 **/
exports.registerEmployees = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
};


/**
 * Регистрация учеников из xlsx
 *
 * body String Файл в base64
 * returns inline_response_200_18
 **/
exports.registerStudents = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Регистрация пользователя
 *
 * body Body_22 Данные человека указываются для всех, к ним добавляются данные сотрудника или ученика или родителя
 * returns inline_response_200_16
 **/

exports.signup = function (req, body) {
    const METHOD = 'signup()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
            let result = {};

            const STATUS = {
                NOT_ADDED_POSTS: 'NOT_ADDED_POSTS',
                NOT_PEPL_DATA: 'NOT_PEPL_DATA',
                NOT_DETERMINE_ROLE: 'NOT_DETERMINE_ROLE',
                NOT_ACCESS: 'NOT_ACCESS',
                NOT_REG_PEOPLE: 'NOT_REG_PEOPLE',
                NOT_ADDED_ADDITIONAL_DATA: 'NOT_ADDED_ADDITIONAL_DATA',
                NOT_ADDED_ROLES_USER: 'NOT_ADDED_ROLES_USER',
                NOT_ADDED_CONFIRM_REG: 'NOT_ADDED_CONFIRM_REG',
                UNKNOWN_ERROR: 'UNKNOWN_ERROR',
                CLASS_NOT_PARSED: 'CLASS_NOT_PARSED',
                LOGIN_BUSY: 'LOGIN_BUSY',
                OK: 'OK'
            };

            let globalData = undefined;
            let payload = {};

            const getGlobalData = (login, pass, role) => {
                let data = {
                    ROLE: role,
                    pepl_login: login,
                    pepl_pass: pass ? pass : uniqid.process(),
                    pepl_salt: crypto.randomBytes(32).toString('base64')
                };
                data.pepl_hash_pass = crypto.createHmac('sha1', data.pepl_salt).update(data.pepl_pass).digest('hex');
                return data;
            };

            const checkAuth = () => {
                return new Promise((resolve) => {
                    resolve(req.isAuthenticated());
                });
            };

            checkAuth()
                .then((res) => {
                    if (res) {
                        console.log('User is Authenticated');
                        return {
                            auth: res,
                            admin: UsersReq.checkRole(req.user.roles, ROLE.ADMIN)
                        };
                    } else {
                        console.log('User Not Authenticated');
                        return {
                            auth: res
                        };
                    }
                })
                .then((res) => {
                    if (res.admin || !res.auth) {
                        console.log('Open Access');

                        if (body.pepl_data) {

                            // Ученик
                            if (body.emp_data === undefined &&
                                body.std_data &&
                                body.prnt_data === undefined &&
                                res.admin) {

                                console.log('Reg Student');
                                globalData = getGlobalData(body.pepl_login, body.pepl_pass, ROLE.STUDENT);
                            }

                            // Родитель
                            if (body.emp_data === undefined &&
                                body.std_data === undefined &&
                                globalData === undefined &&
                                body.prnt_data) {

                                console.log('Reg Parent');
                                globalData = getGlobalData(body.pepl_login, body.pepl_pass, ROLE.PARENT);
                            }

                            if (globalData === undefined && res.admin) {
                                // Сотрудник
                                console.log('Reg Employee');
                                globalData = getGlobalData(body.pepl_login, body.pepl_pass, ROLE.EMPLOYEE);
                            }

                            if (globalData === undefined) {
                                console.log('Not Access');
                                throw new Error(STATUS.NOT_ACCESS);
                            }

                            if (globalData.pepl_login)
                                return UsersReq.getPeplByLogin(knex, globalData.pepl_login);
                        } else {
                            // Нет основной информации
                            console.log('Not People Data');
                            throw new Error(STATUS.NOT_PEPL_DATA);
                        }
                    } else {
                        console.log('Not Access');
                        throw new Error(STATUS.NOT_ACCESS);
                    }
                })
                .then((res) => {
                    if (res && res.length && res.length !== 0) {
                        console.log('Login Busy');
                        throw new Error(STATUS.LOGIN_BUSY);
                    }

                    console.log('Login Is Valid');
                    let req_pepl_data = {
                        pepl_login: globalData.pepl_login,
                        pepl_hash_pass: globalData.pepl_hash_pass,
                        pepl_salt: globalData.pepl_salt,
                        pepl_second_name: body.pepl_data.pepl_second_name,
                        pepl_first_name: body.pepl_data.pepl_first_name,
                        pepl_last_name: body.pepl_data.pepl_last_name,
                        pepl_gender: body.pepl_data.pepl_gender,
                        pepl_birthday: body.pepl_data.pepl_birthday,
                        pepl_phone: body.pepl_data.pepl_phone,
                        pepl_email: body.pepl_data.pepl_email,
                    };

                    payload.pepl_login = globalData.pepl_login;
                    payload.pepl_pass = globalData.pepl_pass;
                    payload.pepl_second_name = body.pepl_data.pepl_second_name;
                    payload.pepl_first_name = body.pepl_data.pepl_first_name;
                    payload.pepl_last_name = body.pepl_data.pepl_last_name;

                    return new Promise((resolve, reject) => {
                        knex.transaction((trx) => {
                            AuthReq.insertPepl(knex, trx, req_pepl_data)
                                .then((res) => {
                                    if (res.length !== 0) {
                                        console.log('People Added');

                                        payload.pepl_id = res[0].pepl_id;
                                        if (!payload.pepl_login)
                                            payload.pepl_login = res[0].pepl_login;

                                        switch (globalData.ROLE) {
                                            case ROLE.STUDENT: {
                                                const parseClass = (className) => {
                                                    const regex = new RegExp('^(\\d{1,2})([А-ЯЁ])$');
                                                    let match = className.match(regex);
                                                    if (match[1] && match[1] >= 1 && match[1] <= 11 && match[2]) {
                                                        const parsedClass = {
                                                            parallel: match[1],
                                                            letter: match[2]
                                                        };

                                                        const date = new Date();
                                                        let result = {
                                                            std_date_receipt: new Date(date.getFullYear() - parsedClass.parallel, 8, 1),
                                                            std_stayed_two_year: 0,
                                                            std_class_letter: parsedClass.letter,
                                                        };

                                                        if (date.getMonth() >= 8) {
                                                            result.std_date_receipt.setFullYear(result.std_date_receipt.getFullYear() + 1);
                                                        }

                                                        result.std_date_issue = new Date(result.std_date_receipt.getFullYear() + 11, 5, 1);

                                                        return result;

                                                    } else {
                                                        return null;
                                                    }
                                                };


                                                const parsedClassData = parseClass(body.std_data.std_class);
                                                if (parsedClassData === null)
                                                    throw new Error(STATUS.CLASS_NOT_PARSED);
                                                console.log('Parsed Class');

                                                const req_std_data = {
                                                    std_id: payload.pepl_id,
                                                    emp_id: body.std_data.emp_id,
                                                    std_date_receipt: parsedClassData.std_date_receipt,
                                                    std_stayed_two_year: parsedClassData.std_stayed_two_year,
                                                    std_class_letter: parsedClassData.std_class_letter,
                                                    std_date_issue: parsedClassData.std_date_issue
                                                };

                                                return AuthReq.insertStd(knex, trx, req_std_data);
                                            }
                                            case ROLE.EMPLOYEE: {
                                                let req_emp_data = {
                                                    emp_id: payload.pepl_id,
                                                    emp_skype: body.emp_data.emp_skype,
                                                    emp_discord: body.emp_data.emp_discord,
                                                    emp_hangouts: body.emp_data.emp_hangouts,
                                                    emp_viber: body.emp_data.emp_viber,
                                                    emp_vk: body.emp_data.emp_vk,
                                                    emp_date_enrollment: body.emp_data.emp_date_enrollment
                                                };

                                                return AuthReq.insertEmp(knex, trx, req_emp_data);
                                            }
                                            case ROLE.PARENT: {
                                                let req_prnt_data = {
                                                    prnt_id: payload.pepl_id,
                                                    prnt_city: body.prnt_data.prnt_data.prnt_city,
                                                    prnt_street: body.prnt_data.prnt_data.prnt_street,
                                                    prnt_home: body.prnt_data.prnt_data.prnt_home,
                                                    prnt_flat: body.prnt_data.prnt_data.prnt_flat,
                                                    prnt_confirm: 0, // На рассмотрении
                                                };

                                                return AuthReq.insertPrnt(knex, trx, req_prnt_data);
                                            }
                                        }
                                    } else {
                                        console.log('Not Registered');
                                        throw new Error(STATUS.NOT_REG_PEOPLE);
                                    }
                                })
                                .then((res) => {
                                    if (res.length !== 0) {
                                        console.log('Added ', globalData.ROLE);

                                        let role_name = undefined;
                                        switch (globalData.ROLE) {
                                            case ROLE.STUDENT: {
                                                role_name = ROLE.STUDENT;
                                                break;
                                            }
                                            case ROLE.EMPLOYEE: {
                                                if (body.role_array !== undefined) {
                                                    body.role_array = body.role_array.filter((item) => {
                                                        return req.roles.some(i => {
                                                            if (item === i &&
                                                                item !== ROLE.STUDENT &&
                                                                item !== ROLE.PARENT) {
                                                                return true;
                                                            }
                                                        });
                                                    });
                                                }

                                                if (body.role_array === undefined || body.role_array.length === 0)
                                                    role_name = ROLE.EMPLOYEE;
                                                break;
                                            }
                                            case ROLE.PARENT: {
                                                role_name = ROLE.PARENT;
                                                break;
                                            }
                                        }

                                        console.log('Determined Role');
                                        if (role_name) {
                                            payload.role_array = [role_name];
                                            return RolesReq.addUserRoles(knex, trx, payload.pepl_id, [{role_name: role_name}]);
                                        } else {
                                            payload.role_array = body.role_array;
                                            const req_role_arr = body.role_array.map(item => {
                                                return {role_name: item};
                                            });
                                            return RolesReq.addUserRoles(knex, trx, payload.pepl_id, req_role_arr);
                                        }


                                    } else {
                                        console.log('Not Added Additional Data');
                                        throw new Error(STATUS.NOT_ADDED_ADDITIONAL_DATA);
                                    }
                                })
                                .then((res) => {
                                    if (res.length !== 0) {
                                        console.log('Added Role');

                                        switch (globalData.ROLE) {
                                            case ROLE.STUDENT: {
                                                console.log('Successful Registered Student');

                                                result = {
                                                    status: STATUS.OK,
                                                    payload: payload
                                                };
                                                resolve(result);
                                                return;
                                            }
                                            case ROLE.EMPLOYEE: {
                                                // Добавляем должности, если они были указаны
                                                if (body.emp_data.pst_arr.length !== 0) {
                                                    return PostsReq.insertEmpPostsTrx(knex, trx, payload.pepl_id, body.emp_data.pst_arr);
                                                } else {
                                                    console.log('Not Found Posts');
                                                    return undefined;
                                                }
                                            }
                                            case ROLE.PARENT: {
                                                // Добавляем данные подтверждения, если есть
                                                return AuthReq.insertConfirmReg(knex, trx, payload.pepl_id, body.prnt_data.cr_array);
                                            }
                                        }
                                    } else {
                                        console.log('Not Added User Roles');
                                        throw new Error(STATUS.NOT_ADDED_ROLES_USER);
                                    }
                                })
                                .then((res) => {
                                    switch (globalData.ROLE) {
                                        case ROLE.EMPLOYEE: {
                                            if (res === undefined || res.length === 0) {
                                                console.log('Not Added Posts');
                                                throw new Error(STATUS.NOT_ADDED_POSTS);
                                            }

                                            console.log('Successful Registered Employee');
                                            result = {
                                                status: STATUS.OK,
                                                payload: payload
                                            };
                                            resolve(result);
                                            break;
                                        }
                                        case ROLE.PARENT: {
                                            if (res.length !== 0) {
                                                // Родитель зарегистрирован полностью
                                                console.log('Successful Registered Parent');
                                                result = {
                                                    status: STATUS.OK,
                                                    payload: payload
                                                };
                                                resolve(result);
                                            } else {
                                                console.log('Not Added Confirm Reg');
                                                throw new Error(STATUS.NOT_ADDED_CONFIRM_REG);
                                            }
                                        }
                                    }
                                })
                                .then(() => {
                                    trx.commit();
                                })
                                .catch((err) => {
                                    if (err.message === STATUS.NOT_ADDED_CONFIRM_REG ||
                                        err.message === STATUS.NOT_ADDED_ROLES_USER ||
                                        err.message === STATUS.NOT_ADDED_ADDITIONAL_DATA ||
                                        err.message === STATUS.NOT_REG_PEOPLE ||
                                        err.message === STATUS.CLASS_NOT_PARSED ||
                                        err.message === STATUS.NOT_ADDED_POSTS)
                                        result = {status: err.message};
                                    else
                                        result = {status: STATUS.UNKNOWN_ERROR};
                                    reject(result);

                                    trx.rollback(err);
                                });
                        });
                    });
                })
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    if (err.message === STATUS.NOT_PEPL_DATA ||
                        err.message === STATUS.NOT_ACCESS ||
                        err.message === STATUS.LOGIN_BUSY) {
                        console.error(err);
                        result = {status: err.message};
                    } else {
                        if (err.status) {
                            result = err;
                        } else {
                            console.error(err);
                            result = {status: STATUS.UNKNOWN_ERROR};
                        }
                    }
                    reject(result);
                });
        }
    );
};
