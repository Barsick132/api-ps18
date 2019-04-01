'use strict';

const knex = require('../index').knex;
const UsersReq = require('../requests/UsersReq');
const PostsReq = require('../requests/PostsReq');
const RolesReq = require('../requests/RolesReq');
const ROLE = require('../constants').ROLE;

const FILE = './service/UsersService.js';

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
                            emp_viber: item.emp_hangouts,
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

                return UsersReq.getTeacherClasses(knex, pepl_id_arr);
            })
            .then((res) => {
                if (res.length === 0) {
                    console.log('Not Found Teacher Classes')
                } else {
                    console.log('Teacher Classes Found');
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
 * Получение списка сотрудников доступных для записи
 *
 * returns inline_response_200_22
 **/
exports.getPersonsToBeRec = function (req) {
    const METHOD = 'getPersonsToBeRec()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
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

        UsersReq.getUserToBeRec(knex)
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
                    console.log('Posts Emp Not Found');
                } else {
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
                }

                result = {
                    status: STATUS.OK,
                    payload: payload
                };


                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_USER_TO_BE_REC) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};


/**
 * Привязка ученика к родителю
 *
 * body Body_29 ID ученика и родителя
 * returns inline_response_200_6
 **/
exports.bindParentAndStud = function (body) {
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
 * Поиск сотрудников с фильтрацией
 *
 * body Body_27 Параметры поиска сотрудника
 * returns inline_response_200_23
 **/
exports.getEmployee = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": [{
                "pepl_login": "Admin",
                "emp_data": {
                    "emp_vk": "empadmin",
                    "emp_skype": "emplAdmin",
                    "emp_viber": "9568734554",
                    "emp_hangouts": "admin@gmail.com",
                    "emp_date_enrollment": "1997-11-22",
                    "emp_discord": "emplAdmin#1232"
                },
                "pepl_id": 1,
                "pepl_data": {
                    "pepl_first_name": "Иван",
                    "pepl_gender": true,
                    "pepl_second_name": "Иванов",
                    "pepl_last_name": "Иванович",
                    "pepl_email": "admin@mail.ru",
                    "pepl_phone": "9568734554",
                    "pepl_birthday": "1977-01-19"
                }
            }, {
                "pepl_login": "Admin",
                "emp_data": {
                    "emp_vk": "empadmin",
                    "emp_skype": "emplAdmin",
                    "emp_viber": "9568734554",
                    "emp_hangouts": "admin@gmail.com",
                    "emp_date_enrollment": "1997-11-22",
                    "emp_discord": "emplAdmin#1232"
                },
                "pepl_id": 1,
                "pepl_data": {
                    "pepl_first_name": "Иван",
                    "pepl_gender": true,
                    "pepl_second_name": "Иванов",
                    "pepl_last_name": "Иванович",
                    "pepl_email": "admin@mail.ru",
                    "pepl_phone": "9568734554",
                    "pepl_birthday": "1977-01-19"
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
 * Поиск родителей с фильтрацией
 *
 * body Body_28 Параметры поиска родителя
 * returns inline_response_200_24
 **/
exports.getParent = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": [{
                "pepl_login": "Parent",
                "pepl_id": 2,
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
                "pepl_login": "Parent",
                "pepl_id": 2,
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
 * Поиск учеников с фильтрацией
 *
 * body Body_26 параметры поиска ученика
 * returns inline_response_200_22
 **/
exports.getStudent = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": [{
                "pepl_login": "Student",
                "pepl_id": 3,
                "pepl_data": {
                    "pepl_first_name": "Иван",
                    "pepl_gender": true,
                    "pepl_second_name": "Иванов",
                    "pepl_last_name": "Иванович",
                    "pepl_email": "admin@mail.ru",
                    "pepl_phone": "9568734554",
                    "pepl_birthday": "1977-01-19"
                },
                "std_data": {
                    "std_finished": false,
                    "std_stayed_two_year": 0,
                    "std_class_letter": "Б",
                    "std_year_first": 2012,
                    "emp_id": 1
                }
            }, {
                "pepl_login": "Student",
                "pepl_id": 3,
                "pepl_data": {
                    "pepl_first_name": "Иван",
                    "pepl_gender": true,
                    "pepl_second_name": "Иванов",
                    "pepl_last_name": "Иванович",
                    "pepl_email": "admin@mail.ru",
                    "pepl_phone": "9568734554",
                    "pepl_birthday": "1977-01-19"
                },
                "std_data": {
                    "std_finished": false,
                    "std_stayed_two_year": 0,
                    "std_class_letter": "Б",
                    "std_year_first": 2012,
                    "emp_id": 1
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
 * Получение данных пользователя
 *
 * body Body_25 ID пользователя
 * returns inline_response_200_21
 **/
exports.getUser = function (req, body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": {
                "emp_data": {
                    "emp_vk": "empadmin",
                    "emp_skype": "emplAdmin",
                    "emp_viber": "9568734554",
                    "emp_hangouts": "admin@gmail.com",
                    "emp_date_enrollment": "1997-11-22",
                    "emp_discord": "emplAdmin#1232"
                },
                "role_array": [{
                    "role_name": "Admin"
                }, {
                    "role_name": "Admin"
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
                },
                "std_data": {
                    "std_finished": false,
                    "std_stayed_two_year": 0,
                    "std_class_letter": "Б",
                    "std_year_first": 2012,
                    "emp_id": 1
                }
            },
            "status": "OK"
        };
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
}

