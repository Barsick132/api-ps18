'use strict';

const knex = require('../index').knex;
const UsersReq = require('../requests/UsersReq');
const PostsReq = require('../requests/PostsReq');
const RolesReq = require('../requests/RolesReq');
const RecordsReq = require('../requests/RecordsReq');
const AuthReq = require('../requests/AuthReq');
const ROLE = require('../constants').ROLE;
const T = require('../constants').TABLES;

const FILE = './service/UsersService.js';

/**
 *
 * Метод получения данных классного
 * руководителя по ID ученика
 *
 */

exports.getClassTeacher = function (req, body) {
    const METHOD = 'getClassTeacher()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            ACCOUNT_UNDER_REVIEW: 'ACCOUNT_UNDER_REVIEW',
            ACCOUNT_REJECT: 'ACCOUNT_REJECT',
            NOT_ACCESS_TO_CHILD: 'NOT_ACCESS_TO_CHILD',
            NOT_FOUND_TEACHER_POSTS: 'NOT_FOUND_TEACHER_POSTS',
            NOT_FOUND_TEACHER_ROLES: 'NOT_FOUND_TEACHER_ROLES',
            NOT_FOUND_CLASS_TEACHER: 'NOT_FOUND_CLASS_TEACHER',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            OK: 'OK'
        };

        let result = {};
        let payload = {};
        let currentRole;

        // Проверка аутентификации пользователя
        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        // Проверка доступа по ролям
        if (UsersReq.checkRole(req.user.roles, ROLE.ADMIN)) {
            console.log('User Have ' + ROLE.ADMIN + ' Role');
            currentRole = ROLE.ADMIN;
        }
        if (UsersReq.checkRole(req.user.roles, ROLE.PSYCHOLOGIST)) {
            console.log('User Have ' + ROLE.PSYCHOLOGIST + ' Role');
            currentRole = ROLE.PSYCHOLOGIST;
        }
        if (UsersReq.checkRole(req.user.roles, ROLE.PARENT)) {
            switch (req.user.prnt_data.prnt_confirm) {
                case 0: {
                    console.error('Account Under Review');
                    reject({status: STATUS.ACCOUNT_UNDER_REVIEW});
                    return;
                }
                case 2: {
                    console.error('Account Reject');
                    reject({status: STATUS.ACCOUNT_REJECT});
                    return
                }
                case 1: {
                    console.log('User Have ' + ROLE.PARENT + ' Role');
                    currentRole = ROLE.PARENT;
                }
            }
        }
        if (!currentRole) {
            console.error('Not Access');
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        const getChildrenParent = function () {
            if (currentRole === ROLE.PARENT) {
                return UsersReq.checkChildrensId(knex, req.user.pepl_id, body.std_id);
            }
            return new Promise(resolve => resolve(undefined));
        };

        getChildrenParent()
            .then((res) => {
                if (res !== undefined && res.length !== 1)
                    throw new Error(STATUS.NOT_ACCESS_TO_CHILD);
                return UsersReq.getClassTeacher(knex, body.std_id)
            })
            .then((res) => {
                if (res.length !== 1) {
                    throw new Error(STATUS.NOT_FOUND_CLASS_TEACHER);
                }

                console.log('Class Teacher Found');
                if (currentRole === ROLE.ADMIN) {
                    payload = {
                        pepl_id: res[0].pepl_id,
                        pepl_login: res[0].pepl_login,
                        pepl_data: {
                            pepl_second_name: res[0].pepl_second_name,
                            pepl_first_name: res[0].pepl_first_name,
                            pepl_last_name: res[0].pepl_last_name,
                            pepl_gender: res[0].pepl_gender,
                            pepl_birthday: res[0].pepl_birthday,
                            pepl_phone: res[0].pepl_phone,
                            pepl_email: res[0].pepl_email
                        },
                        emp_data: {
                            emp_skype: res[0].emp_skype,
                            emp_discord: res[0].emp_discord,
                            emp_hangouts: res[0].emp_hangouts,
                            emp_viber: res[0].emp_viber,
                            emp_vk: res[0].emp_vk,
                            emp_date_enrollment: res[0].emp_date_enrollment
                        }
                    };
                    return RolesReq.getUserRoles(knex, res[0].pepl_id);
                }
                if (currentRole === ROLE.PSYCHOLOGIST || currentRole === ROLE.PARENT) {
                    result = {
                        status: STATUS.OK,
                        payload: {
                            pepl_data: {
                                pepl_second_name: res[0].pepl_second_name,
                                pepl_first_name: res[0].pepl_first_name,
                                pepl_last_name: res[0].pepl_last_name
                            }
                        }
                    };
                    resolve(result);
                }
            })
            .then((res) => {
                if (currentRole !== ROLE.ADMIN) {
                    return;
                }

                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_TEACHER_ROLES);
                }

                console.log('Teacher Roles Found');
                payload.role_array = res.map(item => {
                    return item.role_name;
                });

                return PostsReq.getEmpPosts(knex, payload.pepl_id);
            })
            .then((res) => {
                if (currentRole !== ROLE.ADMIN) {
                    return;
                }

                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_TEACHER_POSTS);
                }

                console.log('Teacher Posts Found');
                payload.pst_arr = res.map(item => {
                    return item.pst_name;
                });

                return UsersReq.getTeacherClasses(knex, payload.pepl_id);
            })
            .then((res) => {
                if (currentRole !== ROLE.ADMIN) {
                    return;
                }

                if (res.length === 0) {
                    console.log('Not Found Teacher Classes')
                } else {
                    console.log('Teacher Classes Found');
                }

                payload.class_arr = res.map(item => {
                    return UsersReq.getParallel(
                        item.std_date_receipt,
                        item.std_stayed_two_year,
                        item.std_date_issue
                    ) + item.std_class_letter;
                });

                result = {
                    status: STATUS.OK,
                    payload: payload
                };

                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_CLASS_TEACHER ||
                    err.message === STATUS.NOT_FOUND_TEACHER_ROLES ||
                    err.message === STATUS.NOT_FOUND_TEACHER_POSTS ||
                    err.message === STATUS.NOT_ACCESS_TO_CHILD) {
                    result = {status: err.message}
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            });
    });
};

/**
 *
 * Получение данных Получение списка учителей
 * для назначения классного руководства (Admin)
 *
 **/

exports.getTeachers = function (req) {
    const METHOD = 'getTeachers()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_POSTS_USERS: 'NOT_FOUND_POSTS',
            NOT_FOUND_ROLES_USERS: 'NOT_FOUND_ROLES_USERS',
            NOT_FOUND_TEACHERS: 'NOT_FOUND_TEACHERS',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            OK: 'OK'
        };

        let result = {};
        let payload = {};
        let pepl_id_arr = [];

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

        UsersReq.getTeachers(knex)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_TEACHERS);
                }

                console.log('Teachers Found');
                payload = res.map(item => {
                    return {
                        pepl_id: item.pepl_id,
                        pepl_login: item.pepl_login,
                        pepl_data: {
                            pepl_second_name: item.pepl_second_name,
                            pepl_first_name: item.pepl_first_name,
                            pepl_last_name: item.pepl_last_name,
                            pepl_gender: item.pepl_gender,
                            pepl_birthday: item.pepl_birthday,
                            pepl_phone: item.pepl_phone,
                            pepl_email: item.pepl_email
                        },
                        emp_data: {
                            emp_skype: item.emp_skype,
                            emp_discord: item.emp_discord,
                            emp_hangouts: item.emp_hangouts,
                            emp_viber: item.emp_viber,
                            emp_vk: item.emp_vk,
                            emp_date_enrollment: item.emp_date_enrollment
                        }
                    }
                });

                pepl_id_arr = res.map(item => {
                    return item.pepl_id;
                });

                return RolesReq.getSeveralUserRoles(knex, pepl_id_arr);

            })
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_ROLES_USERS);
                }

                console.log('Roles Users Found');
                payload.forEach(i => {
                    i.role_array = [];
                    res.forEach(item => {
                        if (item.pepl_id === i.pepl_id)
                            i.role_array.push(item.role_name);
                    })
                });

                return PostsReq.getSeveralEmpPosts(knex, pepl_id_arr);
            })
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_POSTS_USERS);
                }

                console.log('Posts Users Found');
                payload.forEach(i => {
                    i.pst_arr = [];
                    res.forEach(item => {
                        if (item.emp_id === i.pepl_id)
                            i.pst_arr.push(item.pst_name);
                    })
                });

                return UsersReq.getTeachersClasses(knex, pepl_id_arr);
            })
            .then((res) => {
                if (res.length === 0) {
                    console.log('Not Found Teachers Classes')
                } else {
                    console.log('Teachers Classes Found');
                }

                payload.forEach(i => {
                    i.class_arr = [];
                    res.forEach(item => {
                        if (i.pepl_id === item.emp_id) {
                            i.class_arr
                                .push(UsersReq.getParallel(
                                    item.std_date_receipt,
                                    item.std_stayed_two_year,
                                    item.std_date_issue
                                ) + item.std_class_letter);
                        }
                    })
                });

                result = {
                    status: STATUS.OK,
                    payload: payload
                };

                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_TEACHERS ||
                    err.message === STATUS.NOT_FOUND_ROLES_USERS ||
                    err.message === STATUS.NOT_FOUND_POSTS_USERS) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR};
                }
                reject(result);
            });
    });
};


/**
 * Получение персональных данных
 *
 * returns inline_response_200_21
 **/
exports.getPersonalData = function (req) {
    const METHOD = 'getPersonalData()';
    console.log(FILE, METHOD);


    return new Promise(function (resolve, reject) {
        const STATUS = {
            ACCOUNT_UNDER_REVIEW: 'ACCOUNT_UNDER_REVIEW',
            ACCOUNT_REJECT: 'ACCOUNT_REJECT',
            NOT_GETTED_POSTS: 'NOT_GETTED_POSTS',
            NOT_GETTED_ADDITIONAL_DATA_OR_NOT_CONFIRMED: 'NOT_GETTED_ADDITIONAL_DATA_OR_NOT_CONFIRMED',
            NOT_GETTED_ADDITIONAL_DATA: 'NOT_GETTED_ADDITIONAL_DATA',
            NOT_GETTED_CHILDREN_DATA: 'NOT_GETTED_CHILDREN_DATA',
            NOT_AUTH: 'NOT_AUTH',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            OK: 'OK'
        };

        let result = {};
        let payload = {};
        let globalData = {};

        const getAdditionalData = () => {
            if (UsersReq.checkRole(req.user.roles, ROLE.STUDENT)) {
                // Роль студента
                globalData.ROLE = ROLE.STUDENT;
                return UsersReq.getStudentByID(knex, req.user.pepl_id);
            } else {
                if (UsersReq.checkRole(req.user.roles, ROLE.PARENT)) {
                    // Роль родителя
                    globalData.ROLE = ROLE.PARENT;
                    return UsersReq.getConfParentAddressByID(knex, req.user.pepl_id);
                } else {
                    // Роль сотрудника
                    globalData.ROLE = ROLE.EMPLOYEE;
                    return UsersReq.getEmployeeByID(knex, req.user.pepl_id);
                }
            }
        };

        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (UsersReq.checkRole(req.user.roles, ROLE.PARENT)) {
            switch (req.user.prnt_data.prnt_confirm) {
                case 0: {
                    console.error('Account Under Review');
                    reject({status: STATUS.ACCOUNT_UNDER_REVIEW});
                    return;
                }
                case 2: {
                    console.error('Account Reject');
                    reject({status: STATUS.ACCOUNT_REJECT});
                    return
                }
            }
        }

        payload = {
            pepl_login: req.user.pepl_login,
            role_array: req.user.roles,
            pepl_data: {
                pepl_second_name: req.user.pepl_second_name,
                pepl_first_name: req.user.pepl_first_name,
                pepl_last_name: req.user.pepl_last_name,
                pepl_gender: req.user.pepl_gender,
                pepl_birthday: req.user.pepl_birthday,
                pepl_phone: req.user.pepl_phone,
                pepl_email: req.user.pepl_email
            }
        };

        getAdditionalData()
            .then((res) => {
                if (!res || !res.length || res.length !== 1) {
                    // Ошибка при получении дополнительных данных пользователя
                    if (globalData.ROLE === ROLE.PARENT) {
                        throw new Error(STATUS.NOT_GETTED_ADDITIONAL_DATA_OR_NOT_CONFIRMED);
                    }
                    throw new Error(STATUS.NOT_GETTED_ADDITIONAL_DATA);
                }

                console.log('Additional Data Received');
                const additional_data = res[0];
                switch (globalData.ROLE) {
                    case ROLE.STUDENT: {
                        payload.std_data = {};
                        payload.std_data.std_class = UsersReq.getParallel(
                            additional_data.std_date_receipt,
                            additional_data.std_stayed_two_year,
                            additional_data.std_date_issue
                        ) + additional_data.std_class_letter;
                        payload.std_data.std_stayed_two_year = additional_data.std_stayed_two_year;
                        payload.std_data.std_date_issue = additional_data.std_date_issue;

                        result = {
                            status: STATUS.OK,
                            payload: payload
                        };

                        console.log('Successful Response Data Student');
                        resolve(result);
                        return result;
                    }
                    case ROLE.PARENT: {
                        payload.prnt_data = {};
                        payload.prnt_data.main_data = additional_data;
                        return UsersReq.getChildrensPepl(knex, req.user.pepl_id);
                    }
                    case ROLE.EMPLOYEE: {
                        payload.emp_data = {};
                        payload.emp_data.main_data = additional_data;
                        return PostsReq.getEmpPosts(knex, req.user.pepl_id);
                    }
                }
            })
            .then((res) => {
                if (!res || res.length === 0) {
                    if (globalData.ROLE === ROLE.PARENT)
                        throw new Error(STATUS.NOT_GETTED_CHILDREN_DATA);
                    throw new Error(STATUS.NOT_GETTED_POSTS);
                }

                switch (globalData.ROLE) {
                    case ROLE.PARENT: {
                        console.log('Childrens Data Received');
                        payload.prnt_data.prnt_childrens = res;
                        result = {
                            status: STATUS.OK,
                            payload: payload
                        };

                        console.log('Successful Response Data Parent');
                        resolve(result);
                        break;
                    }
                    case ROLE.EMPLOYEE: {
                        console.log('Posts Data Received');
                        payload.emp_data.pst_arr = res.map(item => {
                            return item.pst_name;
                        });
                        result = {
                            status: STATUS.OK,
                            payload: payload
                        };

                        console.log('Successful Response Data Employee');
                        resolve(result);
                        break;
                    }
                }
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_GETTED_ADDITIONAL_DATA ||
                    err.message === STATUS.NOT_GETTED_ADDITIONAL_DATA_OR_NOT_CONFIRMED ||
                    err.message === STATUS.NOT_GETTED_POSTS ||
                    err.message === STATUS.NOT_GETTED_CHILDREN_DATA) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR};
                }
                reject(result);
            })
    });
};


/**
 *
 * Обновление персональных данных (ALL)
 *
 */
exports.updPersonalData = function (req, body) {
    const METHOD = 'getPersonsToBeRec()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            INFO_NOT_UPDATEABLE: 'INFO_NOT_UPDATEABLE',
            ACCOUNT_UNDER_REVIEW: 'ACCOUNT_UNDER_REVIEW',
            ACCOUNT_REJECT: 'ACCOUNT_REJECT',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            NOT_AUTH: 'NOT_AUTH',
            OK: 'OK'
        };

        let result = {};
        let payload = [];

        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (UsersReq.checkRole(req.user.roles, ROLE.PARENT)) {
            switch (req.user.prnt_data.prnt_confirm) {
                case 0: {
                    console.error('Account Under Review');
                    reject({status: STATUS.ACCOUNT_UNDER_REVIEW});
                    return;
                }
                case 2: {
                    console.error('Account Reject');
                    reject({status: STATUS.ACCOUNT_REJECT});
                    return
                }
            }
        }

        let pepl_req = {};
        let addit_req = {};
        let currentRole;
        if (body.pepl_old_pass && body.pepl_new_pass &&
            AuthReq.encryptPassword(body.pepl_old_pass, req.user.pepl_salt) === req.user.pepl_hash_pass) {
            pepl_req = AuthReq.getSaltAndHashPass(body.pepl_new_pass);
        }

        if (UsersReq.checkRole(req.user.roles, ROLE.STUDENT)) {
            currentRole = ROLE.STUDENT;
        }
        if (UsersReq.checkRole(req.user.roles, ROLE.EMPLOYEE)) {
            currentRole = ROLE.EMPLOYEE;
            if (body.emp_data) {
                if (body.emp_data.emp_skype !== undefined)
                    addit_req.emp_skype = body.emp_data.emp_skype;
                if (body.emp_data.emp_discord !== undefined)
                    addit_req.emp_discord = body.emp_data.emp_discord;
                if (body.emp_data.emp_hangouts !== undefined)
                    addit_req.emp_hangouts = body.emp_data.emp_hangouts;
                if (body.emp_data.emp_viber !== undefined)
                    addit_req.emp_viber = body.emp_data.emp_viber;
                if (body.emp_data.emp_vk !== undefined)
                    addit_req.emp_vk = body.emp_data.emp_vk;
            }
        }
        if (UsersReq.checkRole(req.user.roles, ROLE.PARENT)) {
            currentRole = ROLE.PARENT;
            if (body.prnt_data) {
                if (body.prnt_data.prnt_city)
                    addit_req.prnt_city = body.prnt_data.prnt_city;
                if (body.prnt_data.prnt_street)
                    addit_req.prnt_street = body.prnt_data.prnt_street;
                if (body.prnt_data.prnt_home)
                    addit_req.prnt_home = body.prnt_data.prnt_home;
                if (body.prnt_data.prnt_flat !== undefined)
                    addit_req.prnt_flat = body.prnt_data.prnt_flat;
            }
        }

        if (body.pepl_phone !== undefined)
            pepl_req.pepl_phone = body.pepl_phone;
        if (body.pepl_email !== undefined)
            pepl_req.pepl_email = body.pepl_email;
        if (currentRole !== ROLE.STUDENT) {
            if (body.pepl_second_name)
                pepl_req.pepl_second_name = body.pepl_second_name;
            if (body.pepl_first_name)
                pepl_req.pepl_first_name = body.pepl_first_name;
            if (body.pepl_last_name)
                pepl_req.pepl_last_name = body.pepl_last_name;
            if (body.pepl_gender)
                pepl_req.pepl_gender = body.pepl_gender;
        }

        if (Object.keys(pepl_req).length === 0) {
            // Не данных People, которые столи бы обновить
            switch (currentRole) {
                case ROLE.STUDENT: {
                    console.error('Information Not Updateable');
                    reject({status: STATUS.INFO_NOT_UPDATEABLE});
                    return;
                }
                case ROLE.EMPLOYEE: {
                    if (!body.emp_data || Object.keys(body.emp_data).length === 0) {
                        console.error('Information Not Updateable');
                        reject({status: STATUS.INFO_NOT_UPDATEABLE});
                        return;
                    }
                    break;
                }
                case ROLE.PARENT: {
                    if (!body.prnt_data || Object.keys(body.prnt_data).length === 0) {
                        console.error('Information Not Updateable');
                        reject({status: STATUS.INFO_NOT_UPDATEABLE});
                        return;
                    }
                    break;
                }
            }
        }

        UsersReq.updPersonalData(knex, req.user.pepl_id, currentRole, pepl_req, addit_req)
            .then((res) => {
                if (res.status !== undefined) {
                    reject(res);
                    return;
                }

                if (pepl_req.pepl_salt && pepl_req.pepl_hash_pass &&
                    body.pepl_old_pass && body.pepl_new_pass &&
                    AuthReq.encryptPassword(body.pepl_new_pass, res.pepl_data.pepl_salt) === res.pepl_data.pepl_hash_pass) {
                    res.pepl_data.pepl_pass = body.pepl_new_pass;
                }
                if (res.pepl_data) {
                    res.pepl_data.pepl_salt = undefined;
                    res.pepl_data.pepl_hash_pass = undefined;
                    res.pepl_data.pepl_id = undefined;
                    res.pepl_data.pepl_login = undefined;
                    res.pepl_data.pepl_birthday = undefined;
                }

                switch (currentRole) {
                    case ROLE.STUDENT: {
                        Object.keys(res.pepl_data).forEach(item => {
                            if (item !== "pepl_pass" && item !== "pepl_phone" && item !== "pepl_email") {
                                res.pepl_data[item] = undefined;
                            }
                        });
                        break;
                    }
                    case ROLE.EMPLOYEE: {
                        if (res.emp_data) {
                            res.emp_data.emp_id = undefined;
                            res.emp_data.emp_date_enrollment = undefined;
                        }
                        break;
                    }
                    case ROLE.PARENT: {
                        if (res.prnt_data) {
                            res.prnt_data.prnt_id = undefined;
                            res.prnt_data.prnt_confirm = undefined;
                        }
                        break;
                    }
                }

                result = res;
                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                result = {status: STATUS.UNKNOWN_ERROR};
                reject(result);
            })
    });
};

/**
 * Получение списка сотрудников доступных для записи
 *
 * returns inline_response_200_22
 **/
exports.getPersonsToBeRec = function (req) {
    const METHOD = 'getPersonsToBeRec()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            ACCOUNT_UNDER_REVIEW: 'ACCOUNT_UNDER_REVIEW',
            ACCOUNT_REJECT: 'ACCOUNT_REJECT',
            POSTS_EMP_NOT_FOUND: 'POSTS_EMP_NOT_FOUND',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            NOT_FOUND_USER_TO_BE_REC: 'NOT_FOUND_USER_TO_BE_REC',
            NOT_AUTH: 'NOT_AUTH',
            OK: 'OK'
        };

        let result = {};
        let payload = [];

        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (UsersReq.checkRole(req.user.roles, ROLE.PARENT)) {
            switch (req.user.prnt_data.prnt_confirm) {
                case 0: {
                    console.error('Account Under Review');
                    reject({status: STATUS.ACCOUNT_UNDER_REVIEW});
                    return;
                }
                case 2: {
                    console.error('Account Reject');
                    reject({status: STATUS.ACCOUNT_REJECT});
                    return
                }
            }
        }

        UsersReq.getEmpToBeRec(knex)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_USER_TO_BE_REC);
                }

                console.log('Emp To Be Rec Found');
                payload = res;

                return PostsReq.getSeveralEmpPosts(knex, res.map(item => {
                    return item.pepl_id
                }))
            })
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.POSTS_EMP_NOT_FOUND);
                }
                console.log('Posts Emp Found');

                payload = payload.map(item => {
                    res.forEach(i => {
                        if (i.emp_id === item.pepl_id) {
                            if (item.pst_arr === undefined) item.pst_arr = [];
                            item.pst_arr.push(i.pst_name);
                        }
                    });
                    return item;
                });

                result = {
                    status: STATUS.OK,
                    payload: payload
                };

                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_USER_TO_BE_REC ||
                    err.message === STATUS.POSTS_EMP_NOT_FOUND) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};


/**
 * Поиск сотрудников с фильтрацией
 *
 * body Body_27 Параметры поиска сотрудника
 * returns inline_response_200_23
 **/
exports.getEmployees = function (req, body) {
    const METHOD = 'getEmployees()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_EMPLOYEES: 'NOT_FOUND_EMPLOYEES',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            OK: 'OK'
        };

        let result = {};
        let payload = {};

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

        let pst_arr;
        if (body.pst_arr) {
            if (body.pst_arr.length !== 0)
                pst_arr = body.pst_arr;
            delete body.pst_arr;
        }

        let role_arr;
        if (body.role_array) {
            if (body.role_array.length !== 0)
                role_arr = body.role_array;
            delete body.role_array;
        }

        const access_params = [T.PEOPLE.PEPL_LOGIN, T.PEOPLE.PEPL_SECOND_NAME, T.PEOPLE.PEPL_FIRST_NAME,
            T.PEOPLE.PEPL_LAST_NAME, T.PEOPLE.PEPL_GENDER, T.PEOPLE.PEPL_BIRTHDAY,
            T.PEOPLE.PEPL_PHONE, T.PEOPLE.PEPL_EMAIL];
        Object.keys(body).forEach(param => {
            if (!access_params.some(p => p === param)) {
                delete body[param];
            }
        });

        UsersReq.getEmployees(knex, body, role_arr, pst_arr)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_EMPLOYEES);
                }

                console.log('Found ' + res.length + ' Employees');
                payload = res.map(emp => {
                    return {
                        pepl_id: emp.pepl_id,
                        pepl_login: emp.pepl_login,
                        pepl_data: {
                            pepl_second_name: emp.pepl_second_name,
                            pepl_first_name: emp.pepl_first_name,
                            pepl_last_name: emp.pepl_last_name,
                            pepl_gender: emp.pepl_gender,
                            pepl_birthday: RecordsReq.getDateString(emp.pepl_birthday),
                            pepl_phone: emp.pepl_phone,
                            pepl_email: emp.pepl_email
                        },
                        emp_data: {
                            emp_skype: emp.emp_skype,
                            emp_discord: emp.emp_discord,
                            emp_hangouts: emp.emp_hangouts,
                            emp_viber: emp.emp_viber,
                            emp_vk: emp.emp_vk,
                            emp_date_enrollment: emp.emp_date_enrollment === null ? null : RecordsReq.getDateString(emp.emp_date_enrollment)
                        }
                    }
                });

                result = {
                    status: STATUS.OK,
                    payload: payload
                };

                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_EMPLOYEES) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};


/**
 * Поиск родителей с фильтрацией
 *
 * body Body_28 Параметры поиска родителя
 * returns inline_response_200_24
 **/
exports.getParents = function (req, body) {
    const METHOD = 'getParents()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_PARENTS: 'NOT_FOUND_PARENTS',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            OK: 'OK'
        };

        let result = {};
        let payload = {};

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

        let std_id;
        if (body.std_id) {
            std_id = body.std_id;
            delete body.std_id;
        }

        const access_params = [T.PARENTS.PRNT_CONFIRM, T.PEOPLE.PEPL_LOGIN, T.PEOPLE.PEPL_SECOND_NAME, T.PEOPLE.PEPL_FIRST_NAME,
            T.PEOPLE.PEPL_LAST_NAME, T.PEOPLE.PEPL_GENDER, T.PEOPLE.PEPL_BIRTHDAY,
            T.PEOPLE.PEPL_PHONE, T.PEOPLE.PEPL_EMAIL];
        Object.keys(body).forEach(param => {
            if (!access_params.some(p => p === param)) {
                delete body[param];
            }
        });

        UsersReq.getParents(knex, body, std_id)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_PARENTS);
                }

                console.log('Found ' + res.length + " Parents");
                payload = res.map(prnt => {
                    return {
                        pepl_id: prnt.pepl_id,
                        pepl_login: prnt.pepl_login,
                        pepl_data: {
                            pepl_second_name: prnt.pepl_second_name,
                            pepl_first_name: prnt.pepl_first_name,
                            pepl_last_name: prnt.pepl_last_name,
                            pepl_gender: prnt.pepl_gender,
                            pepl_birthday: RecordsReq.getDateString(prnt.pepl_birthday),
                            pepl_phone: prnt.pepl_phone,
                            pepl_email: prnt.pepl_email
                        },
                        prnt_data: {
                            prnt_city: prnt.prnt_city,
                            prnt_street: prnt.prnt_street,
                            prnt_home: prnt.prnt_home,
                            prnt_flat: prnt.prnt_flat
                        }
                    }
                });

                result = {
                    status: STATUS.OK,
                    payload: payload
                };

                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_PARENTS) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};


/**
 * Поиск учеников с фильтрацией
 *
 * body Body_26 параметры поиска ученика
 * returns inline_response_200_22
 **/
exports.getStudents = function (req, body) {
    const METHOD = 'getStudents()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_STUDENTS: 'NOT_FOUND_STUDENTS',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            OK: 'OK'
        };

        let result = {};
        let payload = [];

        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (!UsersReq.checkRoles(req.user.roles, [ROLE.ADMIN, ROLE.PSYCHOLOGIST])) {
            console.error('Not Admin or Psychologist');
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        const access_props = [T.STUDENTS.EMP_ID, "std_parallel", "std_graduated", T.STUDENTS.STD_CLASS_LETTER,
            T.PEOPLE.PEPL_LOGIN, T.PEOPLE.PEPL_SECOND_NAME, T.PEOPLE.PEPL_FIRST_NAME,
            T.PEOPLE.PEPL_LAST_NAME, T.PEOPLE.PEPL_GENDER, T.PEOPLE.PEPL_BIRTHDAY,
            T.PEOPLE.PEPL_PHONE, T.PEOPLE.PEPL_EMAIL];
        Object.keys(body).forEach(props => {
            if (!access_props.some(i => i === props)) {
                delete body[props];
            }
        });

        let std_parallel;
        if (body.std_parallel) {
            if (body.std_parallel < 12 && body.std_parallel > 0)
                std_parallel = body.std_parallel;
            delete body.std_parallel;
        }

        let std_graduated = false;
        if (UsersReq.checkRole(req.user.roles, ROLE.ADMIN)) {
            if (body.std_graduated !== undefined) {
                std_graduated = body.std_graduated;
            }
        }
        delete body.std_graduated;

        UsersReq.getStudents(knex, body, std_parallel, std_graduated)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_STUDENTS);
                }

                console.log('Found ' + res.length + ' Students');
                payload = res.map(item => {
                    return {
                        pepl_id: item.pepl_id,
                        pepl_login: item.pepl_login,
                        pepl_data: {
                            pepl_second_name: item.pepl_second_name,
                            pepl_first_name: item.pepl_first_name,
                            pepl_last_name: item.pepl_last_name,
                            pepl_gender: item.pepl_gender,
                            pepl_birthday: RecordsReq.getDateString(item.pepl_birthday),
                            pepl_phone: item.pepl_phone,
                            pepl_email: item.pepl_email,
                        },
                        std_data: {
                            std_class: UsersReq.getParallel(item.std_date_receipt,
                                item.std_stayed_two_year,
                                item.std_date_issue) + item.std_class_letter,
                            std_stayed_two_year: item.std_stayed_two_year,
                            std_date_issue: RecordsReq.getDateString(item.std_date_issue)
                        }
                    }
                });

                result = {
                    status: STATUS.OK,
                    payload: payload
                };
                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_STUDENTS) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};


/**
 * Получение данных пользователя
 *
 * body Body_25 ID пользователя
 * returns inline_response_200_21
 **/
exports.getUser = function (req, body) {
    const METHOD = 'getUser()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_USER: 'NOT_FOUND_USER',
            NOT_FOUND_ROLES: 'NOT_FOUND_ROLES',
            NOT_FOUND_ADDITIONAL_DATA: 'NOT_FOUND_ADDITIONAL_DATA',
            NOT_FOUND_EMP_POSTS: 'NOT_FOUND_EMP_POSTS',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            OK: 'OK'
        };

        let result = {};
        let payload = [];
        let currentRole;

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

        UsersReq.getPeplById(knex, body.pepl_id)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_USER);
                }

                console.log('Found User');
                const pepl = res[0];
                payload = {
                    pepl_data: {
                        pepl_second_name: pepl.pepl_second_name,
                        pepl_first_name: pepl.pepl_first_name,
                        pepl_last_name: pepl.pepl_last_name,
                        pepl_gender: pepl.pepl_gender,
                        pepl_birthday: RecordsReq.getDateString(pepl.pepl_birthday),
                        pepl_phone: pepl.pepl_phone,
                        pepl_email: pepl.pepl_email,
                    }
                };

                return RolesReq.getUserRoles(knex, body.pepl_id);
            })
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_ROLES);
                }

                payload.role_array = res.map(role => role.role_name);

                console.log('Found ' + res.length + ' Roles');
                if (UsersReq.checkRole(payload.role_array, ROLE.STUDENT)) {
                    console.log('This Is Student');
                    currentRole = ROLE.STUDENT;
                    return UsersReq.getStudentByID(knex, body.pepl_id);
                }
                if (UsersReq.checkRole(payload.role_array, ROLE.PARENT)) {
                    console.log('This Is Parent');
                    currentRole = ROLE.PARENT;
                    return UsersReq.getParentById(knex, body.pepl_id);
                }
                if (UsersReq.checkRole(payload.role_array, ROLE.EMPLOYEE)) {
                    console.log('This Is Employee');
                    currentRole = ROLE.EMPLOYEE;
                    return UsersReq.getEmployeeByID(knex, body.pepl_id);
                }
            })
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_ADDITIONAL_DATA);
                }

                switch (currentRole) {
                    case ROLE.STUDENT: {
                        console.log('Found Student Data');
                        const std = res[0];
                        payload.std_data = {
                            std_class: UsersReq.getParallel(std.std_date_receipt,
                                std.std_stayed_two_year,
                                std.std_date_issue) + std.std_class_letter,
                            std_stayed_two_year: std.std_stayed_two_year,
                            std_date_issue: RecordsReq.getDateString(std.std_date_issue)
                        };
                        return;
                    }
                    case ROLE.PARENT: {
                        console.log('Found Parent Data');
                        const prnt = res[0];
                        payload.prnt_data = {
                            prnt_city: prnt.prnt_city,
                            prnt_street: prnt.prnt_street,
                            prnt_home: prnt.prnt_home,
                            prnt_flat: prnt.prnt_flat
                        };
                        return;
                    }
                    case ROLE.EMPLOYEE: {
                        console.log('Found Employee Data');
                        const emp = res[0];
                        payload.emp_data = {
                            emp_skype: emp.emp_skype,
                            emp_discord: emp.emp_discord,
                            emp_hangouts: emp.emp_hangouts,
                            emp_viber: emp.emp_viber,
                            emp_vk: emp.emp_vk,
                            emp_date_enrollment: emp.emp_date_enrollment === null ? null : RecordsReq.getDateString(emp.emp_date_enrollment)
                        };
                        return PostsReq.getEmpPosts(knex, body.pepl_id);
                    }
                }
            })
            .then((res) => {
                if (res !== undefined) {
                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_FOUND_EMP_POSTS);
                    }

                    console.log('Found Emp Posts');
                    payload.emp_data.pst_arr = res.map(pst => pst.pst_name);
                }

                result = {
                    status: STATUS.OK,
                    payload: payload
                };

                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_USER ||
                    err.message === STATUS.NOT_FOUND_ROLES ||
                    err.message === STATUS.NOT_FOUND_ADDITIONAL_DATA ||
                    err.message === STATUS.NOT_FOUND_EMP_POSTS) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};

