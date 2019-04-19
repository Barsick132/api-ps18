'use strict';

const knex = require('../index').knex;
const UsersReq = require('../requests/UsersReq');
const RecordsReq = require('../requests/RecordsReq');
const ROLE = require('../constants').ROLE;
const PERIOD_FIX = require('../constants').PERIOD_FIX;

const FILE = './service/RecordsService.js';

/**
 * Отмена записи
 *
 * body Body_14 ID записи
 * returns inline_response_200_6
 **/
exports.cancelRecord = function (req, body) {
    const METHOD = 'cancelRecord()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            ACCOUNT_REJECT: 'ACCOUNT_REJECT',
            ACCOUNT_UNDER_REVIEW: 'ACCOUNT_UNDER_REVIEW',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            OK: 'OK'
        };

        let result = {};

        // Проверка аутентификации пользователя
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

        RecordsReq.cancelRecord(knex, body.rec_id, req.user.pepl_id)
            .then(res => {
                result = {
                    status: STATUS.OK
                };

                resolve(result);
            })
            .catch(err => {
                console.error(err.status);
                reject(err);
            })
    });
};


/**
 * Изменить тип записи и контакты
 *
 * body Body_17 ID записи и/или ID онлайн статуса и/или контактные данные
 * returns inline_response_200_6
 **/
exports.changeRecord = function (body) {
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
 * Получение записей за период или последние N с шагом F
 *
 * body Body_21 Либо получаем записи за период, либо фильтруем по количеству
 * returns inline_response_200_15
 **/
exports.getJournal = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": [{
                "vst_problem": "Угнетение учениками",
                "vst_name": "Тарасов Семен Львович",
                "vst_id": 1,
                "vst_consultant": "Иванов Иван иванович",
                "vst_reason": "Стресс",
                "vst_result": "Стресс",
                "rec_id": 7,
                "vst_age": 13,
                "vst_dt": "2019-03-03T11:00:00.000Z",
                "vst_gender": true
            }, {
                "vst_problem": "Угнетение учениками",
                "vst_name": "Тарасов Семен Львович",
                "vst_id": 1,
                "vst_consultant": "Иванов Иван иванович",
                "vst_reason": "Стресс",
                "vst_result": "Стресс",
                "rec_id": 7,
                "vst_age": 13,
                "vst_dt": "2019-03-03T11:00:00.000Z",
                "vst_gender": true
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
 * Получение сведений об одной записи
 *
 * body Body_18 ID записи
 * returns inline_response_200_12
 **/
exports.getOneRecord = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": {
                "rec_time": "12:00:00",
                "rec_online": true,
                "wd_date": "2019-03-03",
                "pepl_id": 3,
                "cont_value": "student132",
                "wd_duration": 30,
                "emp_id": 1,
                "cont_name": "skype"
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


/**
 * Получить зарегистрированные записи по рабочему дню
 *
 * body Body_19 ID рабочего дня
 * returns inline_response_200_13
 **/
exports.getRecordsFromWD = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": [{
                "rec_time": "12:00:00",
                "rec_online": true,
                "wd_date": "2019-03-03",
                "pepl_id": 3,
                "cont_value": "student132",
                "rec_id": 9,
                "wd_duration": 30,
                "emp_id": 1,
                "cont_name": "skype"
            }, {
                "rec_time": "12:00:00",
                "rec_online": true,
                "wd_date": "2019-03-03",
                "pepl_id": 3,
                "cont_value": "student132",
                "rec_id": 9,
                "wd_duration": 30,
                "emp_id": 1,
                "cont_name": "skype"
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
 * Получение график работы пользователя с записями
 *
 * body Body_11 ID сотрудника
 * returns inline_response_200_10
 **/
exports.getEmpGraphic = function (req, body) {
    const METHOD = 'getEmpGraphic()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            ACCOUNT_UNDER_REVIEW: 'ACCOUNT_UNDER_REVIEW',
            ACCOUNT_REJECT: 'ACCOUNT_REJECT',
            NOT_AUTH: 'NOT_AUTH',
            PERIOD_IS_NOT_VALID: 'PERIOD_IS_NOT_VALID',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            OK: 'OK'
        };

        let result = {};
        let payload = [];

        // Проверка аутентификации пользователя
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

        // Смотрим кто делает запрос, клиент или
        // это запрос личных данных
        let objRequest = {};
        const checkPeriodFix = (wd_history, wd_period_fix) => {
            let wpf;
            if (wd_period_fix) {
                let period_fix_arr = Object.keys(PERIOD_FIX).map(key => PERIOD_FIX[key]);
                if (!period_fix_arr.some(item => item === wd_period_fix)) {
                    wpf = PERIOD_FIX.MONTH;
                } else {
                    wpf = wd_period_fix;
                }
            } else {
                wpf = PERIOD_FIX.MONTH;
            }

            const currentDate = new Date();
            let cdObj = new RecordsReq.dateClass(currentDate.getUTCFullYear(),
                currentDate.getUTCMonth() + 1, currentDate.getUTCDate());
            let ctObj = new RecordsReq.timeClass(currentDate.getUTCHours(),
                currentDate.getUTCMinutes());

            if (wd_history) {
                objRequest.wd_period_end = cdObj.toString();
                objRequest.wd_time_end = ctObj.getTimeString();
                switch (wpf) {
                    case PERIOD_FIX.WEEK: {
                        objRequest.wd_period_begin = cdObj.subtractDays(7).toString();
                        break;
                    }
                    case PERIOD_FIX.MONTH: {
                        objRequest.wd_period_begin = cdObj.subtractMonth(1).toString();
                        break;
                    }
                    case PERIOD_FIX.THREE_MONTH: {
                        objRequest.wd_period_begin = cdObj.subtractMonth(3).toString();
                        break;
                    }
                }
            } else {
                objRequest.wd_period_begin = cdObj.toString();
                objRequest.wd_time_begin = ctObj.getTimeString();
                switch (wpf) {
                    case PERIOD_FIX.WEEK: {
                        objRequest.wd_period_end = cdObj.addDays(7).toString();
                        break;
                    }
                    case PERIOD_FIX.MONTH: {
                        objRequest.wd_period_end = cdObj.addMonth(1).toString();
                        break;
                    }
                    case PERIOD_FIX.THREE_MONTH: {
                        objRequest.wd_period_end = cdObj.addMonth(3).toString();
                        break;
                    }
                }
            }


        };

        if (body.emp_id === undefined || body.emp_id === req.user.pepl_id) {
            // Запрошены личные данные
            objRequest.personal = true;
            objRequest.emp_id = req.user.pepl_id;
            if (body.wd_period_begin || body.wd_period_end) {
                if (body.wd_period_begin && body.wd_period_end) {
                    // Указаны обе даты
                    let dtObjBegin = RecordsReq.getDateObj(body.wd_period_begin);
                    let dtObjEnd = RecordsReq.getDateObj(body.wd_period_end);
                    const resComparison = dtObjEnd.dateMore(dtObjBegin);
                    if (dtObjBegin && dtObjEnd && resComparison === false) {
                        console.error('Date Begin More Date End');
                        reject({status: STATUS.PERIOD_IS_NOT_VALID});
                        return;
                    }
                    objRequest.wd_period_begin = body.wd_period_begin;
                    objRequest.wd_period_end = body.wd_period_end;
                }
                if (body.wd_period_begin && !body.wd_period_end) {
                    // Указана лишь дата начальная
                    objRequest.wd_period_begin = body.wd_period_begin;
                }
                if (!body.wd_period_begin && body.wd_period_end) {
                    // Указана лишь дата конечная
                    objRequest.wd_period_end = body.wd_period_end;
                }
            } else {
                let wd_history = body.wd_history !== undefined ? body.wd_history : false;
                checkPeriodFix(wd_history, body.wd_period_fix);
            }
        } else {
            // Запрошены данные сотрудника
            objRequest.personal = false;
            objRequest.emp_id = body.emp_id;
            checkPeriodFix(false, body.wd_period_fix);
        }

        RecordsReq.getEmpGraphic(knex, objRequest)
            .then((res) => {
                if(res.status!==undefined){
                    reject(res);
                    return;
                }

                console.log('Successful Receipt Graphic');
                payload = res.map(item => {
                    return {
                        wd_id: item.wd_data.wd_id,
                        wd_date: item.wd_data.wd_date,
                        rec_array: item.rec_arr.map(rec => {
                            return {
                                rec_id: rec.rec_id,
                                rec_data: {
                                    pepl_id: rec.pepl_id,
                                    rec_time: rec.rec_time,
                                    rec_online: rec.rec_online,
                                    rec_not_come: rec.rec_not_come,
                                    cont_name: rec.cont_name,
                                    cont_value: rec.cont_value
                                }
                            }
                        }),
                        wd_data: {
                            wd_time_begin: item.wd_data.wd_time_begin,
                            wd_time_end: item.wd_data.wd_time_end,
                            wd_break_begin: item.wd_data.wd_break_begin,
                            wd_break_end: item.wd_data.wd_break_end,
                            wd_duration: item.wd_data.wd_duration
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
                console.error(err.status);
                reject(err);
            })
    });
};


/**
 * Перенос записи на другое время или день
 *
 * body Body_16 ID записи и ID записи на которую переносим
 * returns inline_response_200_12
 **/
exports.moveRecord = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": {
                "rec_time": "12:00:00",
                "rec_online": true,
                "wd_date": "2019-03-03",
                "pepl_id": 3,
                "cont_value": "student132",
                "wd_duration": 30,
                "emp_id": 1,
                "cont_name": "skype"
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


/**
 * Добавление/Удаление/Изменение записей в журнал посещений
 *
 * body Body_20 Массив ID записей в журнале (визитов), которые нужно удалить и/или массив визитов, которые нужно добавить, и/или массив визитов, которые нужно отредактировать
 * returns inline_response_200_14
 **/
exports.setJournal = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": {
                "vst_arr_upd": [{
                    "vst_status": "OK",
                    "vst_id": 1
                }, {
                    "vst_status": "OK",
                    "vst_id": 1
                }],
                "vst_arr_del": [{
                    "vst_status": "OK",
                    "vst_id": 1
                }, {
                    "vst_status": "OK",
                    "vst_id": 1
                }],
                "vst_arr_add": [{
                    "vst_data": {
                        "vst_dt": "2019-03-03T11:00:00.000Z"
                    },
                    "vst_status": "OK",
                    "rec_data": {
                        "rec_id": 7
                    }
                }, {
                    "vst_data": {
                        "vst_dt": "2019-03-03T11:00:00.000Z"
                    },
                    "vst_status": "OK",
                    "rec_data": {
                        "rec_id": 7
                    }
                }]
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


/**
 * Записаться на прием к сотруднику
 *
 * body Body_13 ID человека, ID записи, статус Онлайн, способ связи, личный контакт
 * returns inline_response_200_12
 **/
exports.setToRecord = function (req, body) {
    const METHOD = 'setToRecord()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            ACCOUNT_REJECT: 'ACCOUNT_REJECT',
            ACCOUNT_UNDER_REVIEW: 'ACCOUNT_UNDER_REVIEW',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            OK: 'OK'
        };

        let result = {};

        // Проверка аутентификации пользователя
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

        RecordsReq.setToRecord(knex, body, req.user.pepl_id)
            .then(res => {
                result = {
                    status: STATUS.OK,
                    payload: res
                };

                resolve(result);
            })
            .catch(err => {
                console.error(err.status);
                reject(err);
            });
    });
};


/**
 *
 * Установка личного графика работы (Employee)
 *
 **/
exports.setPersonalGraphic = function (req, body) {
    const METHOD = 'setPersonalGraphic()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_DATA: 'NOT_FOUND_DATA',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            OK: 'OK'
        };

        let result = {};
        let payload = {};

        // Проверка аутентификации пользователя
        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (!UsersReq.checkRole(req.user.roles, ROLE.EMPLOYEE)) {
            console.error('Not ' + ROLE.EMPLOYEE);
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        if (!body.wd_arr_del && !body.wd_arr_add && !body.wd_arr_upd) {
            console.error('Not Found Data');
            reject({status: STATUS.NOT_FOUND_DATA});
            return;
        }

        let wd_arr_del = [];
        if (body.wd_arr_del) {
            wd_arr_del = body.wd_arr_del.map(item => {
                return item.wd_id;
            })
        }

        RecordsReq.delWorkingDays(knex, req.user.pepl_id, wd_arr_del)
            .then((res) => {
                if (res) {
                    if (res.status) {
                        payload.wd_del_res = {
                            status: res.status
                        };
                    } else {
                        console.log('Deleted ' + res.length + ' String');
                        payload.wd_del_res = {
                            status: STATUS.OK,
                            wd_id_del: res
                        };
                    }
                }

                return RecordsReq.updWorkingDays(knex, req.user.pepl_id, body.wd_arr_upd);
            })
            .then((res) => {
                if (res) {
                    if (res.status) {
                        payload.wd_upd_res = {
                            status: res.status
                        };
                    } else {
                        console.log('Updated ' + res.length + ' Working Days');
                        payload.wd_upd_res = {
                            status: STATUS.OK,
                            wd_id_upd: res
                        };
                    }
                }

                return RecordsReq.insertWorkingDays(knex, req.user.pepl_id, body.wd_arr_add);
            })
            .then((res) => {
                if (res) {
                    if (res.status) {
                        payload.wd_add_res = {
                            status: res.status
                        }
                    } else {
                        payload.wd_add_res = {
                            status: STATUS.OK,
                            wd_id_add: res
                        }
                    }
                }

                result = {
                    status: STATUS.OK,
                    payload: payload
                };
                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                result = {status: STATUS.UNKNOWN_ERROR};
                reject(result)
            })
    });
};


/**
 * Отметить, что клиент не явился по записи
 *
 * body Body_15 ID записи
 * returns inline_response_200_6
 **/
exports.skipRecord = function (body) {
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

