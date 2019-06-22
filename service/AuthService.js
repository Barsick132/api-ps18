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
const RecordsReq = require('../requests/RecordsReq');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const xl = require('excel4node');

const FILE = './service/AuthService.js';

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

/**
 * Подтверждение регистрации родителей
 *
 * body Body_23 ID родителя и статус подтверждения
 * returns inline_response_200_6
 **/
exports.confirmParentReg = function (req, body) {
    const METHOD = 'confirmParentReg()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_UPDATED_DATA: 'NOT_FOUND_UPDATED_DATA',
            BAD_REQUEST: 'BAD_REQUEST',
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

        AuthReq.setConfirmParentReg(knex, body)
            .then((res) => {
                if (res.status !== undefined) {
                    reject(res);
                    return;
                }

                result = {status: STATUS.OK};
                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                reject(err);
            })
    });
};


/**
 * Получить список запросов на регистрацию
 *
 * returns inline_response_200_19
 **/
exports.getListConfirmReg = function (req) {
    const METHOD = 'getListConfirmReg()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_STUDENT: 'NOT_FOUND_STUDENT',
            NOT_FOUND_TEACHER: 'NOT_FOUND_TEACHER',
            NOT_FOUND_CLASS: 'NOT_FOUND_CLASS',
            NOT_FOUND_CONFIRM_REG: 'NOT_FOUND_CONFIRM_REG',
            NOT_FOUND_PARENTS_ON_CONF: 'NOT_FOUND_PARENTS_ON_CONF',
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

        UsersReq.getOnConfParents(knex)
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_PARENTS_ON_CONF);
                }

                console.log('Found ' + res.length + ' Parents On Conf');
                payload = res.map(prnt => {
                    return {
                        prnt_id: prnt.prnt_id,
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

                return AuthReq.getConfsParentsById(knex, res.map(prnt => prnt.pepl_id));
            })
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_CONFIRM_REG);
                }

                console.log('Found ' + res.length + ' Confirm Reg');
                payload.forEach(item => {
                    item.cr_array = res.filter(cr => cr.prnt_id === item.prnt_id);
                    item.cr_array.forEach(i => {
                        i.auto_check_data = {
                            cr_child_fullname: (i.ch_second_name !== null && i.ch_first_name !== null && i.ch_last_name !== null) ?
                                STATUS.OK : STATUS.NOT_FOUND_STUDENT,
                            cr_teacher_fullname: ((i.tch_second_name !== null && i.tch_first_name !== null && i.tch_last_name !== null) ||
                                (i.tch_second_name === null && i.tch_first_name === null && i.tch_last_name === null && i.std_emp_id === null)) ?
                                STATUS.OK : STATUS.NOT_FOUND_TEACHER,
                            cr_class: (i.std_class_letter !== null && i.std_stayed_two_year !== null && i.std_date_receipt !== null) ?
                                STATUS.OK : STATUS.NOT_FOUND_CLASS,
                            std_id: i.std_id
                        };

                        delete i.prnt_id;
                        delete i.emp_id;
                        delete i.std_id;
                        delete i.ch_second_name;
                        delete i.ch_first_name;
                        delete i.ch_last_name;
                        delete i.tch_second_name;
                        delete i.tch_first_name;
                        delete i.tch_last_name;
                        delete i.std_stayed_two_year;
                        delete i.std_date_receipt;
                        delete i.std_class_letter;
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
                if (err.message === STATUS.NOT_FOUND_PARENTS_ON_CONF) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR};
                }
                reject(result);
            });
    });
};


/**
 * Авторизация пользователей
 *
 * returns inline_response_200_17
 **/
exports.login = function (req) {
    const METHOD = 'login()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            ACCOUNT_UNDER_REVIEW: 'ACCOUNT_UNDER_REVIEW',
            ACCOUNT_REJECT: 'ACCOUNT_REJECT',
            NOT_FOUND_PARENT_INFO: 'NOT_FOUND_PARENT_INFO',
            NOT_AUTH: 'NOT_AUTH',
            OK: 'OK'
        };

        let result = {};

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
    });
};


/**
 * Регистрация сотрудников из xlsx
 *
 * body String Файл в base64
 * returns inline_response_200_18
 **/
exports.registerEmpAndStd = function (req, file) {
    const METHOD = 'registerEmpAndStd';
    console.log(FILE, METHOD);

    const parseGender = function (value) {
        if (value === 'М') {
            return true;
        }
        if (value === 'Ж') {
            return false;
        }
        return undefined;
    };

    const schema1 = {
        'emp_login': {
            prop: 'pepl_login',
            type: String,
            required: true
        },
        'emp_second_name': {
            prop: 'pepl_second_name',
            type: String,
            required: true
        },
        'emp_first_name': {
            prop: 'pepl_first_name',
            type: String,
            required: true
        },
        'emp_last_name': {
            prop: 'pepl_last_name',
            type: String,
            required: true
        },
        'emp_gender': {
            prop: 'pepl_gender',
            required: true,
            parse(value) {
                const gender = parseGender(value);
                if (gender === undefined) {
                    throw new Error('invalid')
                }
                return gender;
            }
        },
        'emp_birthday': {
            prop: 'pepl_birthday',
            required: true,
            type: Date
        },
        'emp_phone': {
            prop: 'pepl_phone',
            type: String,
            required: false
        },
        'emp_email': {
            prop: 'pepl_email',
            type: String,
            required: false
        },
        'emp_skype': {
            prop: 'emp_skype',
            type: String,
            required: false
        },
        'emp_discord': {
            prop: 'emp_discord',
            type: String,
            required: false
        },
        'emp_hangouts': {
            prop: 'emp_hangouts',
            type: String,
            required: false
        },
        'emp_viber': {
            prop: 'emp_viber',
            type: String,
            required: false
        },
        'emp_vk': {
            prop: 'emp_vk',
            type: String,
            required: false
        },
        'emp_date_enrollment': {
            prop: 'emp_date_enrollment',
            type: Date,
            required: false
        },
        'emp_posts': {
            prop: 'emp_posts',
            required: true,
            parse(value) {
                return value.split(', ');
            }
        },
        'emp_psychologist': {
            prop: 'emp_psychologist',
            type: Boolean,
            required: false
        },
        'emp_teacher': {
            prop: 'emp_teacher',
            type: Boolean,
            required: false
        }
    };

    const schema2 = {
        'std_login': {
            prop: 'pepl_login',
            type: String,
            required: true
            // Excel stores dates as integers.
            // E.g. '24/03/2018' === 43183.
            // Such dates are parsed to UTC+0 timezone with time 12:00 .
        },
        'std_second_name': {
            prop: 'pepl_second_name',
            type: String,
            required: true
        },
        'std_first_name': {
            prop: 'pepl_first_name',
            type: String,
            required: true
        },
        'std_last_name': {
            prop: 'pepl_last_name',
            type: String,
            required: true
        },
        'std_gender': {
            prop: 'pepl_gender',
            required: true,
            parse(value) {
                const gender = parseGender(value);
                if (gender === undefined) {
                    throw new Error('invalid')
                }
                return gender;
            }
        },
        'std_birthday': {
            prop: 'pepl_birthday',
            required: true,
            type: Date
        },
        'std_phone': {
            prop: 'pepl_phone',
            type: String,
            required: false
        },
        'std_email': {
            prop: 'pepl_email',
            type: String,
            required: false
        },
        'emp_login': {
            prop: 'emp_login',
            type: String,
            required: false
        },
        'std_class': {
            prop: 'std_class',
            required: true,
            parse(value) {
                const classData = parseClass(value);
                if (classData === null) {
                    throw new Error('invalid')
                }
                return classData;
            }
        },
        'std_stayed_two_year': {
            prop: 'std_stayed_two_year',
            type: Number,
            required: false
        }
    };

    return new Promise(function (resolve, reject) {
        const STATUS = {
            ERROR_SAVING_FILES: 'ERROR_SAVING_FILES',
            ERROR_PARSING_XLSX: 'ERROR_PARSING_XLSX',
            ERROR_SAVE_FILE: 'ERROR_SAVE_FILE',
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

        fs.mkdir('./public/', {recursive: true}, (err) => {
            if (err) {
                result = {status: STATUS.ERROR_SAVING_FILES};
                reject(result);
                return;
            }

            fs.writeFileSync('./public/importEmpAndStd.xlsx', file.buffer);

            let EmpArr = [];
            let StdArr = [];

            readXlsxFile('./public/importEmpAndStd.xlsx', {schema: schema1, sheet: 1})
                .then(({rows, errors}) => {
                    if (!errors.length === 0) {
                        console.error(errors);
                        reject({
                            status: STATUS.ERROR_PARSING_XLSX,
                            payload: errors
                        });
                        return;
                    }
                    console.log('Employees Complete Parsed!');
                    EmpArr = rows;
                    return readXlsxFile('./public/importEmpAndStd.xlsx', {schema: schema2, sheet: 2});
                })
                .then(({rows, errors}) => {
                    if (!errors.length === 0) {
                        console.error(errors);
                        reject({
                            status: STATUS.ERROR_PARSING_XLSX,
                            payload: errors
                        });
                        return;
                    }
                    console.log('Students Complete Parsed!');
                    StdArr = rows;

                    AuthReq.registerEmpAndStd(knex, EmpArr, StdArr)
                        .then(res => {
                            let wb = new xl.Workbook();

                            let ws = wb.addWorksheet('Сотрудники');
                            let ws1 = wb.addWorksheet('Ученики');

                            ws.cell(1, 1).string('Логин');
                            ws.cell(1, 2).string('Пароль');
                            ws.cell(1, 3).string('ФИО');
                            ws.cell(1, 4).string('Должности');

                            res.emps.forEach((emp, i, arr) => {
                                let posts = emp.posts[0].pst_name;
                                if (emp.posts.length > 1) {
                                    for (let k = 1; k < emp.posts.length; k++) {
                                        posts += ', ' + emp.posts[k].pst_name;
                                    }
                                }

                                ws.cell(i + 2, 1).string(emp.accessData.pepl_login);
                                ws.cell(i + 2, 2).string(emp.accessData.pepl_pass);
                                ws.cell(i + 2, 3).string(emp.people.pepl_second_name + ' ' +
                                    emp.people.pepl_first_name + ' ' +
                                    emp.people.pepl_last_name);
                                ws.cell(i + 2, 4).string(posts);
                            });

                            ws1.cell(1, 1).string('Логин');
                            ws1.cell(1, 2).string('Пароль');
                            ws1.cell(1, 3).string('ФИО');
                            ws1.cell(1, 4).string('Класс');

                            res.stds.forEach((std, i, arr) => {
                                ws1.cell(i + 2, 1).string(std.accessData.pepl_login);
                                ws1.cell(i + 2, 2).string(std.accessData.pepl_pass);
                                ws1.cell(i + 2, 3).string(std.people.pepl_second_name + ' ' +
                                    std.people.pepl_first_name + ' ' +
                                    std.people.pepl_last_name);
                                ws1.cell(i + 2, 4).string(UsersReq.getParallel(
                                    std.student.std_date_receipt,
                                    std.student.std_stayed_two_year,
                                    std.student.std_date_issue) +
                                    std.student.std_class_letter);
                            });
                            resolve(wb);
                        })
                        .catch(err => {
                            console.error(err.status);
                            reject(err)
                        })

                })
                .catch(err => {
                    console.error(err);
                    reject({
                        status: STATUS.UNKNOWN_ERROR,
                        payload: err
                    });
                })
        });
    });
};


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

                                                if (body.role_array === undefined || body.role_array.length === 0) {
                                                    role_name = ROLE.EMPLOYEE;
                                                } else {
                                                    if (!UsersReq.checkRole(body.role_array, ROLE.EMPLOYEE)) {
                                                        body.role_array.push(ROLE.EMPLOYEE);
                                                    }
                                                }
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
                                            return RolesReq.addUserRolesTrx(knex, trx, payload.pepl_id, [{role_name: role_name}]);
                                        } else {
                                            payload.role_array = body.role_array;
                                            const req_role_arr = body.role_array.map(item => {
                                                return {role_name: item};
                                            });
                                            return RolesReq.addUserRolesTrx(knex, trx, payload.pepl_id, req_role_arr);
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
