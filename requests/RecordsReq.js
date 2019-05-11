const FILE = './requests/RecordsReq.js';
const ROLE = require('../constants').ROLE;
const T = require('../constants').TABLES;
const PERIOD_FIX = require('../constants').PERIOD_FIX;
const CONTACT_NAME = require('../constants').CONTACT_NAME;
const Promise = require('bluebird');
const _ = require('underscore');

/**
 *
 * Полезные функции
 *
 */

exports.dateClass = class dateClass {
    constructor(year, month, day) {
        this.year = year;
        this.month = month;
        this.day = day;
    }

    dateMore(objDate) {
        if (this.year > objDate.year) {
            return true;
        }
        if (this.year < objDate.year) {
            return false;
        }
        if (this.month > objDate.month) {
            return true;
        }
        if (this.month < objDate.month) {
            return false;
        }
        if (this.day > objDate.day) {
            return true;
        }
        if (this.day < objDate.day) {
            return false;
        }
        return undefined;
    }

    toString() {
        let month = this.month.toString();
        month = month.length === 2 ? month : "0" + month;
        let day = this.day.toString();
        day = day.length === 2 ? day : "0" + day;
        return this.year + "-" + month + "-" + day;
    }

    subtractDays(days) {
        const new_dt = new Date(this.year, this.month - 1, this.day - days);
        return new dateClass(new_dt.getFullYear(),
            new_dt.getMonth() + 1,
            new_dt.getDate());
    }

    addDays(days) {
        const new_dt = new Date(this.year, this.month - 1, this.day + days);
        return new dateClass(new_dt.getFullYear(),
            new_dt.getMonth() + 1,
            new_dt.getDate());
    }

    subtractMonth(month) {
        const new_dt = new Date(this.year, this.month - 1 - month, this.day);
        return new dateClass(new_dt.getFullYear(),
            new_dt.getMonth() + 1,
            new_dt.getDate());
    }

    addMonth(month) {
        const new_dt = new Date(this.year, this.month - 1 + month, this.day);
        return new dateClass(new_dt.getFullYear(),
            new_dt.getMonth() + 1,
            new_dt.getDate());
    }
};

exports.daysInMonth = function daysInMonth(year, month) {
    return 33 - new Date(year, month, 33).getDate();
};

exports.getDateString = function getDateString(date) {
    let month = (date.getMonth() + 1).toString();
    month = month.length === 2 ? month : "0" + month;
    let day = date.getDate().toString();
    day = day.length === 2 ? day : "0" + day;
    return date.getFullYear() + "-" +
        month + "-" + day;
};

exports.getDateWithTime = function getDateWithString(date) {
    let options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    return date.toLocaleDateString('ca', options);
};

exports.getDateObj = function getDateObj(date) {
    const regex = new RegExp('^(\\d{4})-(\\d{1,2})-(\\d{1,2})$');
    let match = date.match(regex);

    if (match) {
        let year = parseInt(match[1]);
        let month = parseInt(match[2]);
        let day = parseInt(match[3]);
        if (year >= 1900 && year <= 2100 &&
            month >= 1 && month < 12 &&
            day >= 1 && day <= this.daysInMonth(year, month)) {
            return new this.dateClass(year, month, day);
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }
};

exports.timeClass = class timeClass {

    constructor(hours, minutes, timeMinute) {
        if (hours !== undefined && minutes !== undefined) {
            this.hours = hours;
            this.minutes = minutes;
            this.timeMinute = hours * 60 + minutes;
        }

        if (timeMinute !== undefined) {
            this.hours = Math.floor(timeMinute / 60);
            this.minutes = timeMinute - this.hours * 60;
            this.timeMinute = timeMinute;
        }
    }

    addUTC(UTC_Min) {
        this.timeMinute += UTC_Min;
        if (this.timeMinute >= 60 * 24) this.timeMinute -= 60 * 24;
        this.hours = Math.floor(this.timeMinute / 60);
        this.minutes = this.timeMinute - this.hours * 60;
    }

    delUTC(UTC_Min) {
        this.timeMinute -= UTC_Min;
        if (this.timeMinute <= 0) this.timeMinute += 60 * 24;
        this.hours = Math.floor(this.timeMinute / 60);
        this.minutes = this.timeMinute - this.hours * 60;
    }

    getTimePlus(plus_min) {
        let timeMinute = this.timeMinute + plus_min;
        if (timeMinute >= 60 * 24) timeMinute -= 60 * 24;
        return new timeClass(undefined, undefined, timeMinute);
    }

    getTimeString() {
        return this.hours + ":" + this.minutes + ":00"
    }
};

exports.getTimeObj = function getTimeObj(time) {
    const regex = new RegExp('^(\\d{1,2}):(\\d{1,2})(:(\\d{1,2}))?$');
    let match = time.match(regex);

    if (match) {
        let hours = parseInt(match[1]);
        let minutes = parseInt(match[2]);
        if (hours >= 0 && hours <= 24 &&
            minutes >= 0 && minutes < 60) {
            return new this.timeClass(hours, minutes);
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }
};

// Удалить повторяющиеся объекты по параметру
exports.removeDuplicates = function removeDuplicates(myArr, prop) {
    return myArr.filter((obj, pos, arr) => {
        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    });
};

// Проверка повторяющихся объектов по параметру
exports.checkDuplicates = function checkDuplicates(array, prop) {
    return (new Set(array.map(item => item[prop]))).size !== array.length;
};

// Функция получения валидных рабочих дней
// wd_arr_upd - массив со ВСЕМИ рабочими днями, которые хочет обновить пользователь
// wd_arr_upd_from_db - массив с рабочими днями из БД, которые хочет обновить пользователь,
// которые принадлежает ему
exports.getValidUpdWD = function getValidUpdWD(wd_arr_upd, wd_arr_upd_from_db) {
    let valid_wd_arr = [];
    wd_arr_upd.forEach(item => {
        let db_item = wd_arr_upd_from_db.find(i => i.wd_id === item.wd_id);

        if (!db_item) return;

        let new_item = {
            wd_id: item.wd_id,
            wd_time_begin: item.wd_time_begin ? item.wd_time_begin : db_item.wd_time_begin,
            wd_time_end: item.wd_time_end ? item.wd_time_end : db_item.wd_time_end,
            wd_break_begin: item.wd_break_begin !== undefined ? item.wd_break_begin : db_item.wd_break_begin,
            wd_break_end: item.wd_break_end !== undefined ? item.wd_break_end : db_item.wd_break_end,
            wd_duration: item.wd_duration ? item.wd_duration : db_item.wd_duration
        };

        const wd_item = this.getValidWD(new_item);
        if (wd_item) {
            valid_wd_arr.push(wd_item);
        }
    });
    return valid_wd_arr;
};

exports.getValidAddWD = function getValidAddWD(wd_arr_add) {
    let valid_wd_arr = [];
    wd_arr_add.forEach(item => {
        const wd_item = this.getValidWD(item);
        if (wd_item) {
            valid_wd_arr.push(wd_item);
        }
    });
    return valid_wd_arr;
};

exports.getValidWD = function getValidWD(wd_item) {
    const wtbObj = this.getTimeObj(wd_item.wd_time_begin);
    const wteObj = this.getTimeObj(wd_item.wd_time_end);

    if (wtbObj && wteObj) {
        // Получаем объекты времени
        let MyUTC = undefined;
        if (wtbObj.timeMinute > wteObj.timeMinute) {
            // Если время начала приема больше времени окончания
            // приводим время к одним суткам
            MyUTC = 24 * 60 - wtbObj.timeMinute;
            wtbObj.addUTC(MyUTC);
            wteObj.addUTC(MyUTC);
        }
        if (wtbObj.timeMinute < wteObj.timeMinute &&
            (wteObj.timeMinute - wtbObj.timeMinute) % wd_item.wd_duration === 0) {
            // Убеждаемся в том, что теперь время начала приема меньше
            // времени окончания приема. Тут же делаем проверку на кратность
            // времени приема
            if (wd_item.wd_break_begin && wd_item.wd_break_end) {
                // Если указано время перерыва
                const wbbObj = this.getTimeObj(wd_item.wd_break_begin);
                const wbeObj = this.getTimeObj(wd_item.wd_break_end);

                if (MyUTC) {
                    // Если до этого производился сдвиг,
                    // то сдвигаем и время перерыва
                    wbbObj.addUTC(MyUTC);
                    wbeObj.addUTC(MyUTC);
                }
                if (wbbObj.timeMinute < wbeObj.timeMinute &&
                    wbbObj.timeMinute >= wtbObj.timeMinute &&
                    wbeObj.timeMinute <= wteObj.timeMinute &&
                    (wbeObj.timeMinute - wbbObj.timeMinute) % wd_item.wd_duration === 0 &&
                    (wbbObj.timeMinute - wtbObj.timeMinute) % wd_item.wd_duration === 0) {
                    // Если все эти условия выполняются, то можно производить обновление
                    if (MyUTC) {
                        // Предварительно уберем сдвиги
                        wtbObj.delUTC(MyUTC);
                        wteObj.delUTC(MyUTC);
                        wbbObj.delUTC(MyUTC);
                        wbeObj.delUTC(MyUTC);
                    }

                    wd_item.wd_time_begin = wtbObj.getTimeString();
                    wd_item.wd_time_end = wteObj.getTimeString();
                    wd_item.wd_break_begin = wbbObj.getTimeString();
                    wd_item.wd_break_end = wbeObj.getTimeString();
                    return wd_item;
                }
            }
            if (!wd_item.wd_break_begin && !wd_item.wd_break_end) {
                // Если не указано время перерыва
                if (MyUTC) {
                    // Предварительно уберем сдвиги
                    wtbObj.delUTC(MyUTC);
                    wteObj.delUTC(MyUTC);
                }

                wd_item.wd_time_begin = wtbObj.getTimeString();
                wd_item.wd_time_end = wteObj.getTimeString();
                return wd_item;
            }
        }
    }
    return undefined;
};

// Получение списка таймпоинтов (записей для одного рабочего дня)
exports.getRecordsForOneWD = function getRecordsForOneWD(wd) {
    let rec_arr = [];
    // Создать список wd_id, rec_time
    const wtbObj = this.getTimeObj(wd.wd_time_begin);
    const wteObj = this.getTimeObj(wd.wd_time_end);

    let diffT = wteObj.timeMinute - wtbObj.timeMinute;
    if (diffT < 0)
        diffT += 60 * 24;
    const N = diffT / wd.wd_duration;

    if (wd.wd_break_begin && wd.wd_break_end) {
        const wbbObj = this.getTimeObj(wd.wd_break_begin);
        const wbeObj = this.getTimeObj(wd.wd_break_end);

        for (let i = 0; i < N; i++) {
            let rec_time = wtbObj.getTimePlus(i * wd.wd_duration);

            if ((wbbObj.timeMinute < wbeObj.timeMinute &&
                rec_time.timeMinute >= wbbObj.timeMinute &&
                rec_time.timeMinute < wbeObj.timeMinute) ||
                (wbbObj.timeMinute > wbeObj.timeMinute &&
                    (rec_time.timeMinute >= wbbObj.timeMinute ||
                        rec_time.timeMinute < wbeObj.timeMinute))) {
                continue;
            }

            rec_arr.push({
                wd_id: wd.wd_id,
                rec_time: rec_time.getTimeString(),
                rec_online: false,
                rec_not_come: false
            })
        }
    }
    if (!wd.wd_break_begin && !wd.wd_break_end) {
        for (let i = 0; i < N; i++) {
            let rec_time = wtbObj.getTimePlus(i * wd.wd_duration);

            rec_arr.push({
                wd_id: wd.wd_id,
                rec_time: rec_time.getTimeString(),
                rec_online: false,
                rec_not_come: false
            })
        }
    }
    return rec_arr;
};

// Функция генерации таймпоинтов (записей) для рабочих дней
exports.getRecordsForWDs = function getRecordsForWDs(wd_arr) {
    let rec_arr = [];
    wd_arr.forEach(item => {
        // Создать список wd_id, rec_time
        const wtbObj = this.getTimeObj(item.wd_time_begin);
        const wteObj = this.getTimeObj(item.wd_time_end);

        let diffT = wteObj.timeMinute - wtbObj.timeMinute;
        if (diffT < 0)
            diffT += 60 * 24;
        const N = diffT / item.wd_duration;

        if (item.wd_break_begin && item.wd_break_end) {
            const wbbObj = this.getTimeObj(item.wd_break_begin);
            const wbeObj = this.getTimeObj(item.wd_break_end);

            for (let i = 0; i < N; i++) {
                let rec_time = wtbObj.getTimePlus(i * item.wd_duration);

                if ((wbbObj.timeMinute < wbeObj.timeMinute &&
                    rec_time.timeMinute >= wbbObj.timeMinute &&
                    rec_time.timeMinute < wbeObj.timeMinute) ||
                    (wbbObj.timeMinute > wbeObj.timeMinute &&
                        (rec_time.timeMinute >= wbbObj.timeMinute ||
                            rec_time.timeMinute < wbeObj.timeMinute))) {
                    continue;
                }

                rec_arr.push({
                    wd_id: item.wd_id,
                    rec_time: rec_time.getTimeString(),
                    rec_online: false,
                    rec_not_come: false
                })
            }
        }
        if (!item.wd_break_begin && !item.wd_break_end) {
            for (let i = 0; i < N; i++) {
                let rec_time = wtbObj.getTimePlus(i * item.wd_duration);

                rec_arr.push({
                    wd_id: item.wd_id,
                    rec_time: rec_time.getTimeString(),
                    rec_online: false,
                    rec_not_come: false
                })
            }
        }
    });
    return rec_arr;
};

exports.getWdWithRecForUpd = function getWdWithRecForUpd(wd_arr_valid, wd_with_rec) {
    let result = [];
    wd_arr_valid.forEach(item => {
        // 1. Создаем таймпоинты;
        let rec_arr = this.getRecordsForOneWD(item);
        // 2. Проверяем стыковку записей;
        if (wd_with_rec.every(i => {
            return !(i.wd_id === item.wd_id &&
                !rec_arr.some(rec => {
                    return this.getTimeObj(rec.rec_time).timeMinute === this.getTimeObj(i.rec_time).timeMinute;
                }));
        })) {
            // Все записи удовлетвыоряют условиям
            // Удаляем из rec_arr те записи, на которых записаны люди
            wd_with_rec.forEach(i => {
                if (i.wd_id === item.wd_id) {
                    for (let k = 0; k < rec_arr.length; k++) {
                        if (this.getTimeObj(rec_arr[k].rec_time).timeMinute === this.getTimeObj(i.rec_time).timeMinute) {
                            rec_arr.splice(k, 1);
                            k--;
                        }
                    }
                }
            });
            result.push({
                wd_obj: item,
                rec_arr: rec_arr
            })
        }
    });
    return result;
};

/**
 *
 * Запросы к БД
 *
 */

// Метод удаления рабочих дней
exports.delWorkingDays = (knex, emp_id, wd_arr_del) => {
    return new Promise((resolve, reject) => {
        const STATUS = {
            NOT_FOUND_WD_WITHOUT_REC: 'NOT_FOUND_WD_WITHOUT_REC',
            NOT_FOUND_WD_RELEVANT_PERSONAL_ID: 'NOT_FOUND_WD_RELEVANT_PERSONAL_ID',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        if (wd_arr_del === undefined || wd_arr_del.length === 0) {
            resolve(undefined);
            return;
        }

        let result = {};

        knex.transaction((trx) => {
            return knex({wd: T.WORKING_DAYS.NAME, rec: T.RECORDS.NAME})
                .distinct('wd.' + T.WORKING_DAYS.WD_ID)
                .columns('wd.' + T.WORKING_DAYS.WD_ID)
                .select()
                .whereIn('wd.' + T.WORKING_DAYS.WD_ID, wd_arr_del)
                .andWhere('wd.' + T.WORKING_DAYS.EMP_ID, emp_id)
                .andWhereRaw('?? = ??', ['wd.' + T.WORKING_DAYS.WD_ID, 'rec.' + T.RECORDS.WD_ID])
                .whereNotNull('rec.' + T.RECORDS.PEPL_ID)
                .then((res) => {
                    if (res.length !== 0) {
                        wd_arr_del = wd_arr_del.filter(item => !res.some(i => i.wd_id === item));
                    }

                    if (wd_arr_del.length === 0) {
                        throw new Error(STATUS.NOT_FOUND_WD_WITHOUT_REC);
                    }

                    console.log('Free Working Days Found');
                    return knex(T.WORKING_DAYS.NAME)
                        .columns(T.WORKING_DAYS.WD_ID)
                        .select()
                        .whereIn(T.WORKING_DAYS.WD_ID, wd_arr_del)
                        .andWhere(T.WORKING_DAYS.EMP_ID, emp_id);
                })
                .then((res) => {
                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_FOUND_WD_RELEVANT_PERSONAL_ID);
                    }

                    wd_arr_del = res.map(item => item.wd_id);

                    console.log('Free WD Relative Personal ID Found');
                    return knex(T.RECORDS.NAME)
                        .transacting(trx)
                        .whereIn(T.RECORDS.WD_ID, wd_arr_del)
                        .del();
                })
                .then((res) => {
                    console.log('Deleted ' + res + ' Records');
                    return knex(T.WORKING_DAYS.NAME)
                        .transacting(trx)
                        .whereIn(T.WORKING_DAYS.WD_ID, wd_arr_del)
                        .del()
                        .returning(T.WORKING_DAYS.WD_ID)
                })
                .then((res) => {
                    console.log('Deleted ' + res.length + ' Working Days');
                    resolve(res);

                    trx.commit();
                })
                .catch((err) => {
                    if (err.message === STATUS.NOT_FOUND_WD_WITHOUT_REC ||
                        err.message === STATUS.NOT_FOUND_WD_RELEVANT_PERSONAL_ID)
                        result = {status: err.message};
                    else
                        result = {status: STATUS.UNKNOWN_ERROR};
                    resolve(result);

                    trx.rollback(err);
                })
        });
    })
};

// Метод обновления рабочих дней
exports.updWorkingDays = (knex, emp_id, wd_arr_upd) => {
    return new Promise((resolve, reject) => {
        const STATUS = {
            FOUND_DUPLICATE_ID: 'FOUND_DUPLICATE_ID',
            NOT_FOUND_WD_FOR_UPD: 'NOT_FOUND_WD_FOR_UPD',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        if (wd_arr_upd === undefined || wd_arr_upd.length === 0) {
            resolve(undefined);
            return;
        }

        if (this.checkDuplicates(wd_arr_upd, "wd_id")) {
            resolve({status: STATUS.FOUND_DUPLICATE_ID});
            return;
        }

        let result = {};
        let wd_id_arr = wd_arr_upd.map(item => item.wd_id); // Массив всех переданных ID раб. дней
        let wd_with_rec = []; // Массив рабочих дней, на которые есть записи
        let wd_arr_upd_without_rec = []; // Массив рабочих дней с пустыми записями, подготовленный для обновления
        let wd_id_updated_without_rec = []; // Массив ID рабочих дней с пустыми записями, которые удалось обновить
        let wd_id_updated_with_rec = []; // Массив ID рабочих дней с записями, которые удалось обновить

        knex.transaction((trx) => {
            return knex({wd: T.WORKING_DAYS.NAME, rec: T.RECORDS.NAME})
                .select()
                .whereIn('wd.' + T.WORKING_DAYS.WD_ID, wd_id_arr)
                .andWhere('wd.' + T.WORKING_DAYS.EMP_ID, emp_id)
                .andWhereRaw('?? = ??', ['wd.' + T.WORKING_DAYS.WD_ID, 'rec.' + T.RECORDS.WD_ID])
                .whereNotNull('rec.' + T.RECORDS.PEPL_ID)
                .then((res) => {
                    if (res.length !== 0) {
                        console.log('Busy Working Days Found');
                        wd_with_rec = res;
                    } else {
                        console.log('Busy Working Days Not Found');
                    }

                    return knex(T.WORKING_DAYS.NAME)
                        .select()
                        .whereIn(T.WORKING_DAYS.WD_ID, wd_id_arr)
                        .whereNotIn(T.WORKING_DAYS.WD_ID, res.map(item => item.wd_id))
                        .andWhere(T.WORKING_DAYS.EMP_ID, emp_id);

                })
                .then((res) => {
                    if (res.length === 0) {
                        if (wd_with_rec.length === 0) {
                            throw new Error(STATUS.NOT_FOUND_WD_FOR_UPD);
                        } else {
                            return;
                        }
                    }

                    // Скрещиваем wd_arr_upd и res и получаем только валидные
                    // для обновления записи
                    wd_arr_upd_without_rec = this.getValidUpdWD(wd_arr_upd, res);

                    if (wd_arr_upd_without_rec.length === 0) {
                        // Не было найдено ни одного раб. дня
                        // без записей для обновления
                        console.log('Not Found WD Without Rec For Upd');
                        return;
                    }

                    return knex(T.RECORDS.NAME)
                        .transacting(trx)
                        .whereIn(T.RECORDS.WD_ID, wd_arr_upd_without_rec.map(item => item.wd_id))
                        .del()
                        .returning(T.RECORDS.WD_ID);
                })
                .then((res) => {
                    if (!res) return;

                    console.log('Clear Empty Records For WD Without Rec');
                    return Promise.map(wd_arr_upd_without_rec, function (item) {
                        return knex(T.WORKING_DAYS.NAME)
                            .transacting(trx)
                            .where(T.WORKING_DAYS.WD_ID, item.wd_id)
                            .update(item)
                            .returning(T.WORKING_DAYS.WD_ID);
                    })
                })
                .then((res) => {
                    if (!res) return;
                    // Для обновленных раб. дней создаем таймпоинты
                    console.log('Successful Update WD');
                    let rec_arr = this.getRecordsForWDs(wd_arr_upd_without_rec);

                    return knex(T.RECORDS.NAME)
                        .transacting(trx)
                        .insert(rec_arr)
                        .returning(T.RECORDS.WD_ID);
                })
                .then((res) => {
                    if (res) {
                        if (res.length !== 0) {
                            wd_id_updated_without_rec = _.uniq(res);
                            console.log('Updated ' + wd_id_updated_without_rec.length + ' Working Days Without Rec');
                        } else {
                            console.log('Not Found Updating Working Days Without Rec');
                        }
                    }

                    let wd_with_rec_WDonly = this.removeDuplicates(wd_with_rec.map(item => {
                        return {
                            wd_id: item.wd_id,
                            emp_id: item.emp_id,
                            wd_date: item.wd_date,
                            wd_time_begin: item.wd_time_begin,
                            wd_time_end: item.wd_time_end,
                            wd_break_begin: item.wd_break_begin,
                            wd_break_end: item.wd_break_end,
                            wd_duration: item.wd_duration
                        }
                    }), "wd_id");
                    let validUpdWD = this.getValidUpdWD(wd_arr_upd, wd_with_rec_WDonly);

                    if (validUpdWD.length === 0) {
                        if (wd_id_updated_without_rec.length === 0)
                            throw new Error(STATUS.NOT_FOUND_WD_FOR_UPD);
                        else {
                            console.log('Not Found Valid WD With Rec');
                            return;
                        }
                    }

                    // Получаем WD, которые нужно обновить с пустыми записями, которые нужно будет добавить
                    wd_with_rec = this.getWdWithRecForUpd(validUpdWD, wd_with_rec);

                    if (wd_with_rec.length === 0) {
                        if (wd_id_updated_without_rec.length === 0)
                            throw new Error(STATUS.NOT_FOUND_WD_FOR_UPD);
                        else {
                            console.log('Not Found Matching WD With Rec');
                            return;
                        }
                    }

                    // Делаем запрос на обновление записей wd
                    return knex(T.RECORDS.NAME)
                        .transacting(trx)
                        .whereIn(T.RECORDS.WD_ID, wd_with_rec.map(item => item.wd_obj.wd_id))
                        .whereNull(T.RECORDS.PEPL_ID)
                        .del()
                        .returning(T.RECORDS.WD_ID);
                })
                .then((res) => {
                    if (!res) return;

                    console.log('Clear Empty Records For WD With Rec');
                    return Promise.map(wd_with_rec, function (item) {
                        return knex(T.WORKING_DAYS.NAME)
                            .transacting(trx)
                            .where(T.WORKING_DAYS.WD_ID, item.wd_obj.wd_id)
                            .update(item.wd_obj)
                            .returning(T.WORKING_DAYS.WD_ID);
                    });
                })
                .then((res) => {
                    if (!res) return;

                    console.log('Successful Update WD With Rec');
                    return Promise.map(wd_with_rec, function (item) {
                        return knex(T.RECORDS.NAME)
                            .transacting(trx)
                            .insert(item.rec_arr)
                            .returning(T.RECORDS.WD_ID);
                    })
                })
                .then((res) => {
                    if (res) {
                        if (res.length !== 0) {
                            wd_id_updated_with_rec = res.map(item => item[0]);
                            console.log('Updated ' + wd_id_updated_with_rec.length + ' Working Days With Rec');
                        } else {
                            console.log('Not Found Updating Working Days With Rec');
                        }
                    }

                    result = wd_id_updated_without_rec.concat(wd_id_updated_with_rec);
                    resolve(result);
                })
                .then(() => {
                    trx.commit();
                })
                .catch((err) => {
                    if (err.message === STATUS.NOT_FOUND_WD_FOR_UPD)
                        result = {status: err.message};
                    else
                        result = {status: STATUS.UNKNOWN_ERROR};
                    resolve(result);

                    trx.rollback(err);
                });
        });
    })
};

// Метод добавления рабочих дней
exports.insertWorkingDays = (knex, emp_id, wd_arr_add) => {
    return new Promise((resolve, reject) => {
        const STATUS = {
            NOT_FOUND_WORKING_DAYS_MORE_CURRENT: 'NOT_FOUND_WORKING_DAYS_MORE_CURRENT',
            NOT_FOUND_NEW_WORKING_DAYS: 'NOT_FOUND_NEW_WORKING_DAYS',
            NOT_FOUND_VALID_WORKING_DAYS: 'NOT_FOUND_VALID_WORKING_DAYS',
            FOUND_DUPLICATE_DATE: 'FOUND_DUPLICATE_DATE',
            NOT_FOUND_ADDED_WORKING_DAYS: 'NOT_FOUND_ADDED_WORKING_DAYS',
            NOT_FOUND_ADDED_RECORDS: 'NOT_FOUND_ADDED_RECORDS',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        if (wd_arr_add === undefined || wd_arr_add.length === 0) {
            resolve(undefined);
            return;
        }
        console.log('Found Working Days For Add');

        // Проверяем наличие дублирующихся записей
        if (this.checkDuplicates(wd_arr_add, "wd_date")) {
            resolve({status: STATUS.FOUND_DUPLICATE_DATE});
            return;
        }
        console.log('Not Found Duplicate Working Days');

        // Удаляем даты, которые меньше текущей
        const currentDate = new Date();
        let cdObj = new this.dateClass(currentDate.getUTCFullYear(),
            currentDate.getUTCMonth() + 1, currentDate.getUTCDate());
        for (let i = 0; i < wd_arr_add.length; i++) {
            const dt = this.getDateObj(wd_arr_add[i].wd_date);
            const resComparison = cdObj.dateMore(dt);
            if (dt !== undefined && resComparison) {
                // Удаляем дату, если она меньше текущей
                wd_arr_add.splice(i, 1);
                i--;
            }
        }
        if (wd_arr_add.length === 0) {
            resolve({status: STATUS.NOT_FOUND_WORKING_DAYS_MORE_CURRENT});
            return;
        }
        console.log('Found Working Days More Current');

        let result = {};
        let added_wd = [];


        knex.transaction((trx) => {
            wd_arr_add = wd_arr_add.map(item => {
                return {
                    emp_id: emp_id,
                    wd_date: item.wd_date,
                    wd_time_begin: item.wd_data.wd_time_begin,
                    wd_time_end: item.wd_data.wd_time_end,
                    wd_break_begin: item.wd_data.wd_break_begin,
                    wd_break_end: item.wd_data.wd_break_end,
                    wd_duration: item.wd_data.wd_duration
                }
            });
            const validAddWD = this.getValidAddWD(wd_arr_add);

            if (validAddWD.length === 0) {
                resolve({status: STATUS.NOT_FOUND_VALID_WORKING_DAYS});
                return;
            }
            console.log('Found Valid Working Days');

            return knex(T.WORKING_DAYS.NAME)
                .transacting(trx)
                .select()
                .whereIn(T.WORKING_DAYS.WD_DATE, validAddWD.map(item => item.wd_date))
                .andWhere(T.WORKING_DAYS.EMP_ID, emp_id)
                .then((res) => {
                    if (res.length !== 0) {
                        for (let i = 0; i < validAddWD.length; i++) {
                            if (res.some(item => {
                                const validDT = this.getDateObj(validAddWD[i].wd_date);
                                const itemDT = this.getDateObj(this.getDateString(item.wd_date));
                                return validDT.dateMore(itemDT) === undefined;
                            })) {
                                validAddWD.splice(i, 1);
                                i--;
                            }
                        }

                        if (validAddWD.length === 0) {
                            throw new Error(STATUS.NOT_FOUND_NEW_WORKING_DAYS);
                        }
                    }
                    console.log('Found New Working Days');

                    return knex(T.WORKING_DAYS.NAME)
                        .transacting(trx)
                        .insert(validAddWD)
                        .returning('*');
                })
                .then((res) => {
                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_FOUND_ADDED_WORKING_DAYS);
                    }

                    console.log('Added ' + res.length + ' Working Days');
                    added_wd = res;

                    const rec_arr = this.getRecordsForWDs(res);
                    return knex(T.RECORDS.NAME)
                        .transacting(trx)
                        .insert(rec_arr)
                        .returning(T.RECORDS.WD_ID);
                })
                .then((res) => {
                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_FOUND_ADDED_RECORDS);
                    }

                    console.log('Added ' + res.length + ' Records');

                    result = added_wd.map(item => {
                        return this.getDateString(item.wd_date);
                    });
                    resolve(result);
                })
                .then(() => {
                    trx.commit();
                })
                .catch((err) => {
                    if (err.message === STATUS.NOT_FOUND_ADDED_WORKING_DAYS ||
                        err.message === STATUS.NOT_FOUND_ADDED_RECORDS ||
                        err.message === STATUS.NOT_FOUND_NEW_WORKING_DAYS)
                        result = {status: err.message};
                    else
                        result = {status: STATUS.UNKNOWN_ERROR};
                    resolve(result);

                    trx.rollback(err);
                })
        })
    });
};

// Метод получения рабочих дней с записями
exports.getEmpGraphic = (knex, objRequest) => {
    const STATUS = {
        NOT_FOUND_WD: 'NOT_FOUND_WD',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };

    let result = {};
    let wd = [];

    return new Promise((resolve, reject) => {
        const getWD = () => {
            if (objRequest.wd_period_begin !== undefined &&
                objRequest.wd_period_end !== undefined)
                return knex(T.WORKING_DAYS.NAME)
                    .select()
                    .where(T.WORKING_DAYS.EMP_ID, objRequest.emp_id)
                    .andWhereBetween(T.WORKING_DAYS.WD_DATE, [objRequest.wd_period_begin, objRequest.wd_period_end])
                    .orderBy(T.WORKING_DAYS.WD_DATE);


            if (objRequest.wd_period_begin === undefined &&
                objRequest.wd_period_end !== undefined)
                return knex(T.WORKING_DAYS.NAME)
                    .select()
                    .where(T.WORKING_DAYS.EMP_ID, objRequest.emp_id)
                    .andWhereNot(T.WORKING_DAYS.WD_DATE, '>', objRequest.wd_period_end)
                    .orderBy(T.WORKING_DAYS.WD_DATE);
            if (objRequest.wd_period_begin !== undefined &&
                objRequest.wd_period_end === undefined)
                return knex(T.WORKING_DAYS.NAME)
                    .select()
                    .where(T.WORKING_DAYS.EMP_ID, objRequest.emp_id)
                    .andWhereNot(T.WORKING_DAYS.WD_DATE, '<', objRequest.wd_period_begin)
                    .orderBy(T.WORKING_DAYS.WD_DATE);
        };

        getWD()
            .then((res) => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_WD);
                }

                wd = res;
                if (objRequest.personal) {
                    return knex(T.RECORDS.NAME)
                        .select()
                        .whereIn(T.RECORDS.WD_ID, res.map(item => item.wd_id))
                        .orderBy(T.RECORDS.WD_ID, T.RECORDS.REC_TIME);
                } else {
                    return knex(T.RECORDS.NAME)
                        .select()
                        .whereIn(T.RECORDS.WD_ID, res.map(item => item.wd_id))
                        .whereNull(T.RECORDS.PEPL_ID)
                        .orderBy(T.RECORDS.WD_ID, T.RECORDS.REC_TIME);
                }
            })
            .then((res) => {
                if (res.length === 0) {
                    resolve(wd.map(item => {
                        return {
                            wd_data: item,
                            rec_arr: []
                        }
                    }));
                    return;
                }

                if (objRequest.wd_time_begin === undefined &&
                    objRequest.wd_time_end === undefined) {
                    result = wd.map(item => {
                        let rec_arr = [];
                        item.wd_date = this.getDateObj(this.getDateString(item.wd_date)).toString();
                        res.forEach(rec => {
                            if (rec.wd_id === item.wd_id) {
                                rec_arr.push(rec);
                            }
                        });

                        return {
                            wd_data: item,
                            rec_arr: rec_arr
                        }
                    })
                }

                if (objRequest.wd_time_begin !== undefined &&
                    objRequest.wd_time_end === undefined) {
                    result = wd.map(item => {
                        let rec_arr = [];
                        let objWdDate = this.getDateObj(this.getDateString(item.wd_date));
                        item.wd_date = objWdDate.toString();
                        let objDateBegin = this.getDateObj(objRequest.wd_period_begin);
                        if (objWdDate.dateMore(objDateBegin) === undefined) {
                            res.forEach(rec => {
                                if (rec.wd_id === item.wd_id &&
                                    this.getTimeObj(rec.rec_time).timeMinute >= this.getTimeObj(objRequest.wd_time_begin).timeMinute) {
                                    rec_arr.push(rec);
                                }
                            });
                        } else {
                            res.forEach(rec => {
                                if (rec.wd_id === item.wd_id) {
                                    rec_arr.push(rec);
                                }
                            });
                        }
                        return {
                            wd_data: item,
                            rec_arr: rec_arr
                        }
                    })
                }

                if (objRequest.wd_time_begin === undefined &&
                    objRequest.wd_time_end !== undefined) {
                    result = wd.map(item => {
                        let rec_arr = [];
                        let objWdDate = this.getDateObj(this.getDateString(item.wd_date));
                        item.wd_date = objWdDate.toString();
                        let objDateEnd = this.getDateObj(objRequest.wd_period_end);
                        if (objWdDate.dateMore(objDateEnd) === undefined) {
                            res.forEach(rec => {
                                if (rec.wd_id === item.wd_id &&
                                    this.getTimeObj(rec.rec_time).timeMinute <= this.getTimeObj(objRequest.wd_time_end).timeMinute) {
                                    rec_arr.push(rec);
                                }
                            });
                        } else {
                            res.forEach(rec => {
                                if (rec.wd_id === item.wd_id) {
                                    rec_arr.push(rec);
                                }
                            });
                        }
                        return {
                            wd_data: item,
                            rec_arr: rec_arr
                        }
                    })
                }

                resolve(result);
            })
            .catch((err) => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_WD) {
                    result = {status: err.message}
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                resolve(result);
            });
    })
};

exports.getPersonalRecords = function (knex, objRequest, pepl_id) {
    const STATUS = {
        NOT_FOUND_VALID_RECORDS: 'NOT_FOUND_VALID_RECORDS',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };

    let result = {};

    return new Promise((resolve, reject) => {
        const getRecords = () => {
            // Указаны обе даты
            if (objRequest.wd_period_begin !== undefined &&
                objRequest.wd_period_end !== undefined) {
                return knex({atb: 'all_timepoints_busy'})
                    .select()
                    .where('atb.pepl_id', pepl_id)
                    .andWhereBetween('atb.wd_date', [objRequest.wd_period_begin, objRequest.wd_period_end])
                    .orderBy('wd_date', 'rec_time');
            }
            // Указана дата начала
            if (objRequest.wd_period_begin !== undefined &&
                objRequest.wd_period_end === undefined) {
                // Время не указано
                if (objRequest.wd_time_begin === undefined &&
                    objRequest.wd_time_end === undefined) {
                    return knex({atb: 'all_timepoints_busy'})
                        .select()
                        .where('atb.pepl_id', pepl_id)
                        .andWhereNot('atb.wd_date', '<', objRequest.wd_period_begin)
                        .orderBy('wd_date', 'rec_time');
                }
                // Указано время начала
                if (objRequest.wd_time_begin !== undefined &&
                    objRequest.wd_time_end === undefined) {
                    return knex({atb: 'all_timepoints_busy'})
                        .select()
                        .where('atb.pepl_id', pepl_id)
                        .where(function () {
                            this.whereNot('atb.wd_date', '<', objRequest.wd_period_begin)
                                .orWhere('atb.wd_date',  objRequest.wd_period_begin)
                                .andWhereNot('atb.rec_time', '<', objRequest.wd_time_begin)
                        })
                        .orderBy('wd_date', 'rec_time');
                }
            }
            // Указана дата окончания
            if (objRequest.wd_period_begin === undefined &&
                objRequest.wd_period_end !== undefined) {
                // Время не указано
                if (objRequest.wd_time_begin === undefined &&
                    objRequest.wd_time_end === undefined) {
                    return knex({atb: 'all_timepoints_busy'})
                        .select()
                        .where('atb.pepl_id', pepl_id)
                        .andWhereNot('atb.wd_date', '>', objRequest.wd_period_end)
                        .orderBy('wd_date', 'rec_time');
                }
                // Указано время окончания
                if (objRequest.wd_time_begin === undefined &&
                    objRequest.wd_time_end !== undefined) {
                    return knex({atb: 'all_timepoints_busy'})
                        .select()
                        .where('atb.pepl_id', pepl_id)
                        .where(function () {
                            this.whereNot('atb.wd_date', '>', objRequest.wd_period_end)
                                .orWhere('atb.wd_date',  objRequest.wd_period_end)
                                .andWhereNot('atb.rec_time', '>', objRequest.wd_time_end)
                        })
                        .orderBy('wd_date', 'rec_time');
                }
            }
        };

        getRecords()
            .then(res => {
                if(res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_VALID_RECORDS);
                }

                result = [];
                res.forEach(item => {
                    let indexWd = result.findIndex(wd => wd.wd_id === item.wd_id);
                    let record = {
                        rec_id: item.rec_id,
                        emp_fullname: item.emp_fullname,
                        rec_data: {
                            pepl_id: item.pepl_id,
                            rec_time: item.rec_time,
                            rec_online: item.rec_online,
                            rec_not_come: item.rec_not_come,
                            cont_name: item.cont_name,
                            cont_value: item.cont_value
                        }
                    };

                    if(indexWd !== -1){
                        result[indexWd].rec_array.push(record)
                    }else {
                        let wd = {
                            wd_id: item.wd_id,
                            wd_date: this.getDateString(item.wd_date),
                            rec_array: [record]
                        };
                        result.push(wd);
                    }
                });

                resolve(result);
            })
            .catch(err => {
                if(err.message === STATUS.NOT_FOUND_VALID_RECORDS){
                    result = {status: err.message}
                }else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }

                reject(result);
            });
    })
};

// Метод регистрации записи к себе или к кому-то
exports.setToRecord = (knex, body, pepl_id) => {
    return new Promise((resolve, reject) => {
        const STATUS = {
            NOT_FOUND_UPDATED_RECORD: 'NOT_FOUND_UPDATED_RECORD',
            CAN_ONLY_REC_A_CLIENT_TO_YOURSELF: 'CAN_ONLY_REC_A_CLIENT_TO_YOURSELF',
            NOT_FOUND_CONT_NAME: 'NOT_FOUND_CONT_NAME',
            NOT_FOUND_SKYPE_AT_EMP: 'NOT_FOUND_SKYPE_AT_EMP',
            NOT_FOUND_DISCORD_AT_EMP: 'NOT_FOUND_DISCORD_AT_EMP',
            NOT_FOUND_HANGOUTS_AT_EMP: 'NOT_FOUND_HANGOUTS_AT_EMP',
            NOT_FOUND_VIBER_AT_EMP: 'NOT_FOUND_VIBER_AT_EMP',
            NOT_FOUND_VK_AT_EMP: 'NOT_FOUND_VK_AT_EMP',
            CAN_NOT_SIGN_UP_TO_YOURSELF: 'CAN_NOT_SIGN_UP_TO_YOURSELF',
            NOT_FOUND_EMP_TO_BE_REC: 'NOT_FOUND_EMP_TO_BE_REC',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        let result = {};
        let emp_wd = {};

        return knex({p: T.PEOPLE.NAME, e: T.EMPLOYEES.NAME, rec: T.RECORDS.NAME, wd: T.WORKING_DAYS.NAME})
            .distinct('p.*', 'e.*', 'wd.*')
            .select('p.*', 'e.*', 'wd.*')
            .where('rec.' + T.RECORDS.REC_ID, body.rec_id)
            .whereNull('rec.' + T.RECORDS.PEPL_ID)
            .where(function () {
                this.whereRaw('?? > current_date', ['wd.' + T.WORKING_DAYS.WD_DATE])
                    .orWhereRaw('?? = current_date', ['wd.' + T.WORKING_DAYS.WD_DATE])
                    .andWhereRaw('?? > current_time', ['rec.' + T.RECORDS.REC_TIME])
            })
            .whereRaw('?? = ??', ['rec.' + T.RECORDS.WD_ID, 'wd.' + T.WORKING_DAYS.WD_ID])
            .whereRaw('?? = ??', ['wd.' + T.WORKING_DAYS.EMP_ID, 'e.' + T.EMPLOYEES.EMP_ID])
            .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'e.' + T.EMPLOYEES.EMP_ID])
            .then(res => {
                if (res.length !== 1) {
                    throw new Error(STATUS.NOT_FOUND_EMP_TO_BE_REC);
                }

                emp_wd = res[0];
                let rec_pepl_id;
                if (body.pepl_id === undefined) {
                    if (emp_wd.pepl_id === pepl_id) {
                        throw new Error(STATUS.CAN_NOT_SIGN_UP_TO_YOURSELF);
                    }
                    rec_pepl_id = pepl_id;
                } else {
                    if (body.pepl_id === pepl_id && emp_wd.pepl_id === pepl_id) {
                        throw new Error(STATUS.CAN_NOT_SIGN_UP_TO_YOURSELF);
                    }
                    if (body.pepl_id !== pepl_id && emp_wd.pepl_id !== pepl_id) {
                        throw new Error(STATUS.CAN_ONLY_REC_A_CLIENT_TO_YOURSELF);
                    }
                    rec_pepl_id = body.pepl_id;
                }

                let rec_obj = {
                    pepl_id: rec_pepl_id
                };
                if (body.rec_online) {
                    rec_obj.rec_online = true;

                    switch (body.cont_name) {
                        case CONTACT_NAME.SKYPE: {
                            if (emp_wd.emp_skype) {
                                rec_obj.cont_name = body.cont_name;
                                if (body.cont_value !== undefined) {
                                    rec_obj.cont_value = body.cont_value;
                                } else {
                                    rec_obj.cont_value = null;
                                }
                                break;
                            } else {
                                throw new Error(STATUS.NOT_FOUND_SKYPE_AT_EMP);
                            }
                        }
                        case CONTACT_NAME.DISCORD: {
                            if (emp_wd.emp_discord) {
                                rec_obj.cont_name = body.cont_name;
                                if (body.cont_value !== undefined) {
                                    rec_obj.cont_value = body.cont_value;
                                } else {
                                    rec_obj.cont_value = null;
                                }
                                break;
                            } else {
                                throw new Error(STATUS.NOT_FOUND_DISCORD_AT_EMP);
                            }
                        }
                        case CONTACT_NAME.HANGOUTS: {
                            if (emp_wd.emp_hangouts) {
                                rec_obj.cont_name = body.cont_name;
                                if (body.cont_value !== undefined) {
                                    rec_obj.cont_value = body.cont_value;
                                } else {
                                    rec_obj.cont_value = null;
                                }
                                break;
                            } else {
                                throw new Error(STATUS.NOT_FOUND_HANGOUTS_AT_EMP);
                            }
                        }
                        case CONTACT_NAME.VIBER: {
                            if (emp_wd.emp_viber) {
                                rec_obj.cont_name = body.cont_name;
                                if (body.cont_value !== undefined) {
                                    rec_obj.cont_value = body.cont_value;
                                } else {
                                    rec_obj.cont_value = null;
                                }
                                break;
                            } else {
                                throw new Error(STATUS.NOT_FOUND_VIBER_AT_EMP);
                            }
                        }
                        case CONTACT_NAME.VK: {
                            if (emp_wd.emp_vk) {
                                rec_obj.cont_name = body.cont_name;
                                if (body.cont_value !== undefined) {
                                    rec_obj.cont_value = body.cont_value;
                                } else {
                                    rec_obj.cont_value = null;
                                }
                                break;
                            } else {
                                throw new Error(STATUS.NOT_FOUND_VK_AT_EMP);
                            }
                        }
                        default: {
                            throw new Error(STATUS.NOT_FOUND_CONT_NAME)
                        }
                    }
                } else {
                    rec_obj.rec_online = false;

                    rec_obj.cont_name = CONTACT_NAME.PHONE;
                    if (body.cont_value !== undefined) {
                        // Клиент указал номер для связи
                        rec_obj.cont_value = body.cont_value;
                    } else {
                        rec_obj.cont_value = null;
                    }
                }

                return knex(T.RECORDS.NAME)
                    .update(rec_obj)
                    .where(T.RECORDS.REC_ID, body.rec_id)
                    .returning('*');
            })
            .then(res => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_UPDATED_RECORD);
                }

                console.log('Updated ' + res.length + ' Records');
                let rec = res[0];
                result = {
                    pepl_id: rec.pepl_id,
                    emp_id: emp_wd.emp_id,
                    wd_date: this.getDateString(emp_wd.wd_date),
                    rec_time: rec.rec_time,
                    wd_duration: emp_wd.wd_duration,
                    rec_online: rec.rec_online,
                    cont_name: rec.cont_name
                };

                if (rec.cont_value !== null) {
                    result.cont_value = rec.cont_value;
                } else {
                    switch (result.cont_name) {
                        case CONTACT_NAME.SKYPE: {
                            result.emp_cont_value = emp_wd.emp_skype;
                            break;
                        }
                        case CONTACT_NAME.DISCORD: {
                            result.emp_cont_value = emp_wd.emp_discord;
                            break;
                        }
                        case CONTACT_NAME.HANGOUTS: {
                            result.emp_cont_value = emp_wd.emp_hangouts;
                            break;
                        }
                        case CONTACT_NAME.VIBER: {
                            result.emp_cont_value = emp_wd.emp_viber;
                            break;
                        }
                        case CONTACT_NAME.VK: {
                            result.emp_cont_value = emp_wd.emp_vk;
                            break;
                        }
                        case CONTACT_NAME.PHONE: {
                            result.emp_cont_value = emp_wd.pepl_phone;
                            break;
                        }
                    }
                }

                resolve(result);
            })
            .catch(err => {
                if (err.message === STATUS.NOT_FOUND_EMP_TO_BE_REC ||
                    err.message === STATUS.NOT_FOUND_UPDATED_RECORD ||
                    err.message === STATUS.CAN_NOT_SIGN_UP_TO_YOURSELF ||
                    err.message === STATUS.CAN_ONLY_REC_A_CLIENT_TO_YOURSELF ||
                    err.message === STATUS.NOT_FOUND_SKYPE_AT_EMP ||
                    err.message === STATUS.NOT_FOUND_DISCORD_AT_EMP ||
                    err.message === STATUS.NOT_FOUND_HANGOUTS_AT_EMP ||
                    err.message === STATUS.NOT_FOUND_VIBER_AT_EMP ||
                    err.message === STATUS.NOT_FOUND_VK_AT_EMP ||
                    err.message === STATUS.NOT_FOUND_CONT_NAME) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR};
                }
                reject(result);
            })
    })
};

// Отменить запись
exports.cancelRecord = function (knex, rec_id, pepl_id) {
    return new Promise((resolve, reject) => {
        const STATUS = {
            NOT_FOUND_UPDATED_REC: 'NOT_FOUND_UPDATED_REC',
            CAN_ONLY_REC_A_CLIENT_TO_YOURSELF: 'CAN_ONLY_REC_A_CLIENT_TO_YOURSELF',
            CAN_NOT_SIGN_UP_TO_YOURSELF: 'CAN_NOT_SIGN_UP_TO_YOURSELF',
            NOT_FOUND_EMP_WD_REC: 'NOT_FOUND_EMP_WD_REC',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        let result = {};

        return knex({p: T.PEOPLE.NAME, e: T.EMPLOYEES.NAME, rec: T.RECORDS.NAME, wd: T.WORKING_DAYS.NAME})
            .select()
            .where('rec.' + T.RECORDS.REC_ID, rec_id)
            .where(function () {
                this.where('rec.' + T.RECORDS.PEPL_ID, pepl_id)
                    .orWhere('e.' + T.WORKING_DAYS.EMP_ID, pepl_id)
                    .whereNotNull('rec.' + T.RECORDS.PEPL_ID)
            })
            .where(function () {
                this.whereRaw('?? > current_date', ['wd.' + T.WORKING_DAYS.WD_DATE])
                    .orWhereRaw('?? = current_date', ['wd.' + T.WORKING_DAYS.WD_DATE])
                    .andWhereRaw('?? > current_time', ['rec.' + T.RECORDS.REC_TIME])
            })
            .whereRaw('?? = ??', ['rec.' + T.RECORDS.WD_ID, 'wd.' + T.WORKING_DAYS.WD_ID])
            .whereRaw('?? = ??', ['wd.' + T.WORKING_DAYS.EMP_ID, 'e.' + T.EMPLOYEES.EMP_ID])
            .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'e.' + T.EMPLOYEES.EMP_ID])
            .then(res => {
                if (res.length !== 1) {
                    throw new Error(STATUS.NOT_FOUND_EMP_WD_REC);
                }

                console.log('Found Emp Wd Rec');
                return knex(T.RECORDS.NAME)
                    .update({
                        pepl_id: null,
                        rec_online: false,
                        rec_not_come: false,
                        cont_name: null,
                        cont_value: null,
                    })
                    .where(T.RECORDS.REC_ID, rec_id)
                    .returning('*');
            })
            .then(res => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_UPDATED_REC);
                }

                console.log('Updated ' + res.length + ' Rec');
                result = res;
                resolve(result);
            })
            .catch(err => {
                if (err.message === STATUS.NOT_FOUND_EMP_WD_REC ||
                    err.message === STATUS.CAN_NOT_SIGN_UP_TO_YOURSELF ||
                    err.message === STATUS.CAN_ONLY_REC_A_CLIENT_TO_YOURSELF ||
                    err.message === STATUS.NOT_FOUND_UPDATED_REC
                ) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR};
                }
                reject(result);
            })
    });
};

// Метод, позволяющий отметить, что пользователь не явился по записи
exports.skipRecord = (knex, rec_id, pepl_id) => {
    return new Promise((resolve, reject) => {
        const STATUS = {
            NOT_FOUND_UPDATED_REC: 'NOT_FOUND_UPDATED_REC',
            NOT_FOUND_SKIPED_REC: 'NOT_FOUND_SKIPED_REC',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        let result = {};

        return knex({p: T.PEOPLE.NAME, wd: T.WORKING_DAYS.NAME, rec: T.RECORDS.NAME})
            .select('p.' + T.PEOPLE.PEPL_ID + ' as emp_id', 'wd.' + T.WORKING_DAYS.WD_DATE, 'rec.*')
            .whereRaw('?? = ??', ['wd.' + T.WORKING_DAYS.EMP_ID, 'p.' + T.PEOPLE.PEPL_ID])
            .whereRaw('?? = ??', ['wd.' + T.WORKING_DAYS.WD_ID, 'rec.' + T.RECORDS.WD_ID])
            .whereNotNull('rec.' + T.RECORDS.PEPL_ID)
            .where(function () {
                this.whereRaw('?? < current_date', ['wd.' + T.WORKING_DAYS.WD_DATE])
                    .orWhereRaw('?? = current_date', ['wd.' + T.WORKING_DAYS.WD_DATE])
                    .andWhereRaw('?? < current_time', ['rec.' + T.RECORDS.REC_TIME])
            })
            .andWhere('rec.' + T.RECORDS.REC_ID, rec_id)
            .andWhere('p.' + T.PEOPLE.PEPL_ID, pepl_id)
            .andWhere('rec.' + T.RECORDS.REC_NOT_COME, false)
            .then(res => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_SKIPED_REC);
                }

                console.log('Found Rec To Skip');
                return knex(T.RECORDS.NAME)
                    .update(T.RECORDS.REC_NOT_COME, true)
                    .where(T.RECORDS.REC_ID, rec_id)
                    .returning('*');
            })
            .then(res => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_UPDATED_REC);
                }

                console.log('Updated ' + res.length + ' Rec');
                result = res;
                resolve(result);
            })
            .catch(err => {
                if (err.message === STATUS.NOT_FOUND_SKIPED_REC ||
                    err.message === STATUS.NOT_FOUND_UPDATED_REC
                ) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR};
                }
                reject(result);
            })
    })
};

// Перенос записи
exports.moveRecord = (knex, rec_id, new_rec_id, pepl_id) => {
    return new Promise((resolve, reject) => {
        const STATUS = {
            YOU_CAN_TRANSFER_ONLY_YOUR_REC: 'YOU_CAN_TRANSFER_ONLY_YOUR_REC',
            REC_ARE_NOT_SUITABLE_FOR_TRANSFER: 'REC_ARE_NOT_SUITABLE_FOR_TRANSFER',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        let result = {};

        let old_rec = {};
        let new_rec = {};

        knex.transaction(trx => {
            return knex({p: T.PEOPLE.NAME, wd: T.WORKING_DAYS.NAME, rec: T.RECORDS.NAME})
                .transacting(trx)
                .select('p.' + T.PEOPLE.PEPL_ID + ' as emp_id', 'wd.' + T.WORKING_DAYS.WD_DATE, 'wd.' + T.WORKING_DAYS.WD_DURATION, 'rec.*')
                .whereRaw('?? = ??', ['wd.' + T.WORKING_DAYS.EMP_ID, 'p.' + T.PEOPLE.PEPL_ID])
                .whereRaw('?? = ??', ['wd.' + T.WORKING_DAYS.WD_ID, 'rec.' + T.RECORDS.WD_ID])
                .where(function () {
                    this.whereRaw('?? > current_date', ['wd.' + T.WORKING_DAYS.WD_DATE])
                        .orWhereRaw('?? = current_date', ['wd.' + T.WORKING_DAYS.WD_DATE])
                        .andWhereRaw('?? > current_time', ['rec.' + T.RECORDS.REC_TIME])
                })
                .where(function () {
                    this.whereNotNull('rec.' + T.RECORDS.PEPL_ID)
                        .andWhere('rec.' + T.RECORDS.REC_ID, rec_id)
                        .orWhere('rec.' + T.RECORDS.REC_ID, new_rec_id)
                        .whereNull('rec.' + T.RECORDS.PEPL_ID)
                })
                .orderBy(['wd.' + T.WORKING_DAYS.WD_DATE, 'rec.' + T.RECORDS.REC_TIME])
                .then(res => {
                    if (res.length !== 2) {
                        throw new Error(STATUS.REC_ARE_NOT_SUITABLE_FOR_TRANSFER);
                    }

                    old_rec = res.find(rec => rec.rec_id === rec_id);
                    new_rec = res.find(rec => rec.rec_id === new_rec_id);

                    if ((old_rec.pepl_id === pepl_id || old_rec.emp_id !== pepl_id || new_rec.emp_id !== pepl_id) &&
                        (old_rec.pepl_id !== pepl_id || new_rec.emp_id === pepl_id || old_rec.emp_id !== new_rec.emp_id)) {
                        // Перенос клиента или своей записи
                        throw new Error(STATUS.YOU_CAN_TRANSFER_ONLY_YOUR_REC);
                    }

                    return knex(T.RECORDS.NAME)
                        .transacting(trx)
                        .update({
                            pepl_id: old_rec.pepl_id,
                            rec_online: old_rec.rec_online,
                            rec_not_come: old_rec.rec_not_come,
                            cont_name: old_rec.cont_name,
                            cont_value: old_rec.cont_value
                        })
                        .where(T.RECORDS.REC_ID, new_rec_id);
                })
                .then(res => {
                    return knex(T.RECORDS.NAME)
                        .transacting(trx)
                        .update({
                            pepl_id: null,
                            rec_online: false,
                            rec_not_come: false,
                            cont_name: null,
                            cont_value: null
                        })
                        .where(T.RECORDS.REC_ID, rec_id);
                })
                .then(res => {
                    result = {
                        pepl_id: old_rec.pepl_id,
                        emp_id: new_rec.emp_id,
                        wd_date: this.getDateString(new_rec.wd_date),
                        rec_time: new_rec.rec_time,
                        wd_duration: new_rec.wd_duration,
                        rec_online: old_rec.rec_online,
                        cont_name: old_rec.cont_name,
                        cont_value: old_rec.cont_value
                    };
                    resolve(result);

                    trx.commit()
                })
                .catch(err => {
                    if (err.message === STATUS.REC_ARE_NOT_SUITABLE_FOR_TRANSFER ||
                        err.message === STATUS.YOU_CAN_TRANSFER_ONLY_YOUR_REC
                    ) {
                        result = {status: err.message};
                    } else {
                        result = {status: STATUS.UNKNOWN_ERROR};
                    }
                    reject(result);

                    trx.rollback(err);
                })
        })
    })
};

// Изменение данных записи
exports.changeRecord = (knex, body, pepl_id) => {
    return new Promise((resolve, reject) => {
        const STATUS = {
            NOT_FOUND_UPDATED_RECORD: 'NOT_FOUND_UPDATED_RECORD',
            CAN_ONLY_REC_A_CLIENT_TO_YOURSELF: 'CAN_ONLY_REC_A_CLIENT_TO_YOURSELF',
            NOT_FOUND_CONT_NAME: 'NOT_FOUND_CONT_NAME',
            NOT_FOUND_SKYPE_AT_EMP: 'NOT_FOUND_SKYPE_AT_EMP',
            NOT_FOUND_DISCORD_AT_EMP: 'NOT_FOUND_DISCORD_AT_EMP',
            NOT_FOUND_HANGOUTS_AT_EMP: 'NOT_FOUND_HANGOUTS_AT_EMP',
            NOT_FOUND_VIBER_AT_EMP: 'NOT_FOUND_VIBER_AT_EMP',
            NOT_FOUND_VK_AT_EMP: 'NOT_FOUND_VK_AT_EMP',
            CAN_NOT_SIGN_UP_TO_YOURSELF: 'CAN_NOT_SIGN_UP_TO_YOURSELF',
            NOT_FOUND_VALID_REC: 'NOT_FOUND_VALID_REC',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        let result = {};
        let emp_wd = {};

        return knex({p: T.PEOPLE.NAME, e: T.EMPLOYEES.NAME, rec: T.RECORDS.NAME, wd: T.WORKING_DAYS.NAME})
            .distinct('p.*', 'e.*', 'wd.*')
            .select('p.*', 'e.*', 'wd.*')
            .where('rec.' + T.RECORDS.REC_ID, body.rec_id)
            .andWhere('rec.' + T.RECORDS.PEPL_ID, pepl_id)
            .andWhere('p.' + T.PEOPLE.PEPL_ID, '<>', pepl_id)
            .where(function () {
                this.whereRaw('?? > current_date', ['wd.' + T.WORKING_DAYS.WD_DATE])
                    .orWhereRaw('?? = current_date', ['wd.' + T.WORKING_DAYS.WD_DATE])
                    .andWhereRaw('?? > current_time', ['rec.' + T.RECORDS.REC_TIME])
            })
            .whereRaw('?? = ??', ['rec.' + T.RECORDS.WD_ID, 'wd.' + T.WORKING_DAYS.WD_ID])
            .whereRaw('?? = ??', ['wd.' + T.WORKING_DAYS.EMP_ID, 'e.' + T.EMPLOYEES.EMP_ID])
            .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'e.' + T.EMPLOYEES.EMP_ID])
            .then(res => {
                if (res.length !== 1) {
                    throw new Error(STATUS.NOT_FOUND_VALID_REC);
                }

                emp_wd = res[0];
                let rec_obj = {};

                if (body.rec_online) {
                    rec_obj.rec_online = true;

                    switch (body.cont_name) {
                        case CONTACT_NAME.SKYPE: {
                            if (emp_wd.emp_skype) {
                                rec_obj.cont_name = body.cont_name;
                                if (body.cont_value !== undefined) {
                                    rec_obj.cont_value = body.cont_value;
                                } else {
                                    rec_obj.cont_value = null;
                                }
                                break;
                            } else {
                                throw new Error(STATUS.NOT_FOUND_SKYPE_AT_EMP);
                            }
                        }
                        case CONTACT_NAME.DISCORD: {
                            if (emp_wd.emp_discord) {
                                rec_obj.cont_name = body.cont_name;
                                if (body.cont_value !== undefined) {
                                    rec_obj.cont_value = body.cont_value;
                                } else {
                                    rec_obj.cont_value = null;
                                }
                                break;
                            } else {
                                throw new Error(STATUS.NOT_FOUND_DISCORD_AT_EMP);
                            }
                        }
                        case CONTACT_NAME.HANGOUTS: {
                            if (emp_wd.emp_hangouts) {
                                rec_obj.cont_name = body.cont_name;
                                if (body.cont_value !== undefined) {
                                    rec_obj.cont_value = body.cont_value;
                                } else {
                                    rec_obj.cont_value = null;
                                }
                                break;
                            } else {
                                throw new Error(STATUS.NOT_FOUND_HANGOUTS_AT_EMP);
                            }
                        }
                        case CONTACT_NAME.VIBER: {
                            if (emp_wd.emp_viber) {
                                rec_obj.cont_name = body.cont_name;
                                if (body.cont_value !== undefined) {
                                    rec_obj.cont_value = body.cont_value;
                                } else {
                                    rec_obj.cont_value = null;
                                }
                                break;
                            } else {
                                throw new Error(STATUS.NOT_FOUND_VIBER_AT_EMP);
                            }
                        }
                        case CONTACT_NAME.VK: {
                            if (emp_wd.emp_vk) {
                                rec_obj.cont_name = body.cont_name;
                                if (body.cont_value !== undefined) {
                                    rec_obj.cont_value = body.cont_value;
                                } else {
                                    rec_obj.cont_value = null;
                                }
                                break;
                            } else {
                                throw new Error(STATUS.NOT_FOUND_VK_AT_EMP);
                            }
                        }
                        default: {
                            throw new Error(STATUS.NOT_FOUND_CONT_NAME)
                        }
                    }
                } else {
                    rec_obj.rec_online = false;

                    rec_obj.cont_name = CONTACT_NAME.PHONE;
                    if (body.cont_value !== undefined) {
                        // Клиент указал номер для связи
                        rec_obj.cont_value = body.cont_value;
                    } else {
                        rec_obj.cont_value = null;
                    }
                }

                return knex(T.RECORDS.NAME)
                    .update(rec_obj)
                    .where(T.RECORDS.REC_ID, body.rec_id)
                    .returning('*');
            })
            .then(res => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_UPDATED_RECORD);
                }

                console.log('Updated ' + res.length + ' Records');
                let rec = res[0];
                result = {
                    pepl_id: rec.pepl_id,
                    emp_id: emp_wd.emp_id,
                    wd_date: this.getDateString(emp_wd.wd_date),
                    rec_time: rec.rec_time,
                    wd_duration: emp_wd.wd_duration,
                    rec_online: rec.rec_online,
                    cont_name: rec.cont_name
                };

                if (rec.cont_value !== null) {
                    result.cont_value = rec.cont_value;
                } else {
                    switch (result.cont_name) {
                        case CONTACT_NAME.SKYPE: {
                            result.emp_cont_value = emp_wd.emp_skype;
                            break;
                        }
                        case CONTACT_NAME.DISCORD: {
                            result.emp_cont_value = emp_wd.emp_discord;
                            break;
                        }
                        case CONTACT_NAME.HANGOUTS: {
                            result.emp_cont_value = emp_wd.emp_hangouts;
                            break;
                        }
                        case CONTACT_NAME.VIBER: {
                            result.emp_cont_value = emp_wd.emp_viber;
                            break;
                        }
                        case CONTACT_NAME.VK: {
                            result.emp_cont_value = emp_wd.emp_vk;
                            break;
                        }
                        case CONTACT_NAME.PHONE: {
                            result.emp_cont_value = emp_wd.pepl_phone;
                            break;
                        }
                    }
                }

                resolve(result);
            })
            .catch(err => {
                if (err.message === STATUS.NOT_FOUND_VALID_REC ||
                    err.message === STATUS.NOT_FOUND_UPDATED_RECORD ||
                    err.message === STATUS.CAN_NOT_SIGN_UP_TO_YOURSELF ||
                    err.message === STATUS.CAN_ONLY_REC_A_CLIENT_TO_YOURSELF ||
                    err.message === STATUS.NOT_FOUND_SKYPE_AT_EMP ||
                    err.message === STATUS.NOT_FOUND_DISCORD_AT_EMP ||
                    err.message === STATUS.NOT_FOUND_HANGOUTS_AT_EMP ||
                    err.message === STATUS.NOT_FOUND_VIBER_AT_EMP ||
                    err.message === STATUS.NOT_FOUND_VK_AT_EMP ||
                    err.message === STATUS.NOT_FOUND_CONT_NAME) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR};
                }
                reject(result);
            })
    })
};

// Запрос информации одной конкретной записи с проверкой на принадлежность
exports.getOneRecord = function (knex, rec_id, pepl_id) {
    return new Promise((resolve, reject) => {
        const STATUS = {
            NOT_FOUND_VALID_REC: 'NOT_FOUND_VALID_REC',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        let result = {};

        return knex({p: T.PEOPLE.NAME, e: T.EMPLOYEES.NAME, rec: T.RECORDS.NAME, wd: T.WORKING_DAYS.NAME})
            .distinct('rec.' + T.RECORDS.PEPL_ID, 'wd.' + T.WORKING_DAYS.WD_DATE, 'rec.' + T.RECORDS.REC_TIME,
                'wd.' + T.WORKING_DAYS.WD_DURATION, 'rec.' + T.RECORDS.REC_ONLINE, 'rec.' + T.RECORDS.CONT_NAME,
                'rec.' + T.RECORDS.CONT_VALUE, 'e.*')
            .select({
                pepl_id: 'rec.' + T.RECORDS.PEPL_ID,
                wd_date: 'wd.' + T.WORKING_DAYS.WD_DATE,
                rec_time: 'rec.' + T.RECORDS.REC_TIME,
                wd_duration: 'wd.' + T.WORKING_DAYS.WD_DURATION,
                rec_online: 'rec.' + T.RECORDS.REC_ONLINE,
                cont_name: 'rec.' + T.RECORDS.CONT_NAME,
                cont_value: 'rec.' + T.RECORDS.CONT_VALUE
            }, 'e.*')
            .where('rec.' + T.RECORDS.REC_ID, rec_id)
            .where(function () {
                this.where('rec.' + T.RECORDS.PEPL_ID, pepl_id)
                    .orWhere('p.' + T.PEOPLE.PEPL_ID, pepl_id)
            })
            .whereRaw('?? = ??', ['rec.' + T.RECORDS.WD_ID, 'wd.' + T.WORKING_DAYS.WD_ID])
            .whereRaw('?? = ??', ['wd.' + T.WORKING_DAYS.EMP_ID, 'e.' + T.EMPLOYEES.EMP_ID])
            .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'e.' + T.EMPLOYEES.EMP_ID])
            .then(res => {
                if (res.length !== 1) {
                    throw new Error(STATUS.NOT_FOUND_VALID_REC);
                }

                console.log('Found Record');
                let emp_wd = res[0];
                result = {
                    pepl_id: emp_wd.pepl_id,
                    emp_id: emp_wd.emp_id,
                    wd_date: this.getDateString(emp_wd.wd_date),
                    rec_time: emp_wd.rec_time,
                    wd_duration: emp_wd.wd_duration,
                    rec_online: emp_wd.rec_online,
                    cont_name: emp_wd.cont_name
                };

                if (emp_wd.cont_value !== null) {
                    result.cont_value = emp_wd.cont_value;
                } else {
                    switch (result.cont_name) {
                        case CONTACT_NAME.SKYPE: {
                            result.emp_cont_value = emp_wd.emp_skype;
                            break;
                        }
                        case CONTACT_NAME.DISCORD: {
                            result.emp_cont_value = emp_wd.emp_discord;
                            break;
                        }
                        case CONTACT_NAME.HANGOUTS: {
                            result.emp_cont_value = emp_wd.emp_hangouts;
                            break;
                        }
                        case CONTACT_NAME.VIBER: {
                            result.emp_cont_value = emp_wd.emp_viber;
                            break;
                        }
                        case CONTACT_NAME.VK: {
                            result.emp_cont_value = emp_wd.emp_vk;
                            break;
                        }
                        case CONTACT_NAME.PHONE: {
                            result.emp_cont_value = emp_wd.pepl_phone;
                            break;
                        }
                    }
                }

                resolve(result);
            })
            .catch(err => {
                if (err.message === STATUS.NOT_FOUND_VALID_REC) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR};
                }
                reject(result);
            })
    })
};

// Получение информации о зарегистрированных записях на конкретный день
exports.getRecordsFromWD = function (knex, wd_id, pepl_id) {
    return new Promise((resolve, reject) => {
        const STATUS = {
            NOT_FOUND_RECORDS_AT_WD: 'NOT_FOUND_RECORDS_AT_WD',
            NOT_FOUND_VALID_WD: 'NOT_FOUND_VALID_WD',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        let result = {};
        let emp_wd = {};

        return knex({p: T.PEOPLE.NAME, e: T.EMPLOYEES.NAME, wd: T.WORKING_DAYS.NAME})
            .distinct('p.*', 'e.*', 'wd.*')
            .select('p.*', 'e.*', 'wd.*')
            .where('wd.' + T.WORKING_DAYS.WD_ID, wd_id)
            .where('p.' + T.PEOPLE.PEPL_ID, pepl_id)
            .whereRaw('?? = ??', ['wd.' + T.WORKING_DAYS.EMP_ID, 'e.' + T.EMPLOYEES.EMP_ID])
            .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'e.' + T.EMPLOYEES.EMP_ID])
            .then(res => {
                if (res.length !== 1) {
                    throw new Error(STATUS.NOT_FOUND_VALID_WD);
                }

                console.log('Found Valid WD');
                emp_wd = res[0];
                return knex(T.RECORDS.NAME)
                    .select()
                    .where(T.RECORDS.WD_ID, wd_id)
                    .whereNotNull(T.RECORDS.PEPL_ID)
                    .orderBy(T.RECORDS.REC_TIME);
            })
            .then(res => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_RECORDS_AT_WD);
                }

                console.log('Found ' + res.length + ' Rec At WD');
                result = {
                    wd_id: emp_wd.wd_id,
                    wd_date: this.getDateString(emp_wd.wd_date),
                    wd_data: {
                        wd_time_begin: emp_wd.wd_time_begin,
                        wd_time_end: emp_wd.wd_time_end,
                        wd_break_begin: emp_wd.wd_break_begin,
                        wd_break_end: emp_wd.wd_break_end,
                        wd_duration: emp_wd.wd_duration
                    }
                };

                result.rec_array = res.map(rec => {
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
                });

                resolve(result);
            })
            .catch(err => {
                if (err.message === STATUS.NOT_FOUND_VALID_WD ||
                    err.message === STATUS.NOT_FOUND_RECORDS_AT_WD) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR};
                }
                reject(result);
            })
    })
};

// Получить журнал записей
exports.getJournal = function (knex, body, pepl_id) {
    return new Promise((resolve, reject) => {
        const STATUS = {
            NOT_FOUND_VALID_VISITS: 'NOT_FOUND_VALID_VISITS',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            BAD_REQUEST: 'BAD_REQUEST'
        };

        let result = {};

        return new Promise((resolve, reject) => {
            if (body.byDate !== undefined && (
                body.byDate.vst_date_begin !== undefined ||
                body.byDate.vst_date_end !== undefined)) {
                if (body.byDate.vst_date_begin !== undefined && body.byDate.vst_date_end !== undefined) {
                    return knex(T.VISITS.NAME)
                        .where(T.VISITS.EMP_ID, pepl_id)
                        .andWhereRaw('??::date <= ?', [T.VISITS.VST_DT, body.byDate.vst_date_end])
                        .andWhereRaw('??::date >= ?', [T.VISITS.VST_DT, body.byDate.vst_date_begin])
                        .orderBy(T.VISITS.VST_DT, 'desc')
                        .then(res => resolve(res))
                        .catch(err => reject(err));
                } else {
                    if (body.byDate.vst_date_begin !== undefined) {
                        return knex(T.VISITS.NAME)
                            .where(T.VISITS.EMP_ID, pepl_id)
                            .andWhereRaw('??::date >= ?', [T.VISITS.VST_DT, body.byDate.vst_date_begin])
                            .orderBy(T.VISITS.VST_DT, 'desc')
                            .then(res => resolve(res))
                            .catch(err => reject(err));
                    } else {
                        return knex(T.VISITS.NAME)
                            .where(T.VISITS.EMP_ID, pepl_id)
                            .andWhereRaw('??::date <= ?', [T.VISITS.VST_DT, body.byDate.vst_date_end])
                            .orderBy(T.VISITS.VST_DT, 'desc')
                            .then(res => resolve(res))
                            .catch(err => reject(err));
                    }
                }
            } else {
                if (body.inCount !== undefined && body.inCount.vst_N !== undefined) {
                    if (body.inCount.vst_F !== undefined) {
                        return knex(T.VISITS.NAME)
                            .where(T.VISITS.EMP_ID, pepl_id)
                            .orderBy(T.VISITS.VST_DT, 'desc')
                            .limit(body.inCount.vst_N)
                            .offset(body.inCount.vst_F)
                            .then(res => resolve(res))
                            .catch(err => reject(err));
                    } else {
                        return knex(T.VISITS.NAME)
                            .where(T.VISITS.EMP_ID, pepl_id)
                            .orderBy(T.VISITS.VST_DT, 'desc')
                            .limit(body.inCount.vst_N)
                            .offset(body.inCount.vst_F)
                            .then(res => resolve(res))
                            .catch(err => reject(err));
                    }
                } else {
                    throw new Error(STATUS.BAD_REQUEST);
                }
            }
        })
            .then(res => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_VALID_VISITS);
                }

                console.log('Found ' + res.length + ' Visits');
                resolve(res);
            })
            .catch(err => {
                if (err.message === STATUS.NOT_FOUND_VALID_VISITS ||
                    err.message === STATUS.BAD_REQUEST) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR};
                }
                reject(result);
            })


    })
};

// Удаление, изменение, добавление записей в журнале
exports.setJournal = function (knex, vst_arr_del, vst_arr_upd, vst_arr_add, pepl_id) {
    return new Promise((resolve, reject) => {
        const STATUS = {
            NOT_FOUND_DELETED_REC: 'NOT_FOUND_DELETED_REC',
            NOT_FOUND_UPDATED_REC: 'NOT_FOUND_UPDATED_REC',
            NOT_FOUND_ADDED_REC: 'NOT_FOUND_ADDED_REC',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            OK: 'OK'
        };

        let result = {};

        knex.transaction(trx => {
            return new Promise((resolve, reject) => {
                if (vst_arr_del !== undefined && vst_arr_del.length > 0) {
                    return knex(T.VISITS.NAME)
                        .transacting(trx)
                        .where(T.VISITS.EMP_ID, pepl_id)
                        .whereIn(T.VISITS.VST_ID, vst_arr_del.map(vst => vst.vst_id))
                        .del()
                        .returning(T.VISITS.VST_ID)
                        .then(res => resolve(res));
                } else {
                    reject(undefined);
                }
            })
                .then(res => {
                    result.vst_arr_del = {};
                    if (res === undefined || res.length === 0) {
                        console.error(STATUS.NOT_FOUND_DELETED_REC);
                        result.vst_arr_del.status = STATUS.NOT_FOUND_DELETED_REC
                    } else {
                        console.log('Deleted ' + res.length + ' Visits');
                        result.vst_arr_del = {
                            status: STATUS.OK,
                            vst_id_del: res
                        }
                    }

                    if (vst_arr_upd !== undefined && vst_arr_upd.length > 0) {
                        return Promise.map(vst_arr_upd, (upd_obj) => {
                            if (upd_obj.rec_data !== undefined && upd_obj.rec_data.rec_id) {
                                // Тут можно к объекту запроса добавить еще повод, проблему и результат
                                // Затем делаем запрос на обновление с проверкой
                                let req_upd_params = ['vst_reason', 'vst_problem', 'vst_result'];
                                let req_upd_obj = {
                                    rec_id: upd_obj.rec_data.rec_id
                                };
                                Object.keys(upd_obj).forEach(param => {
                                    if (req_upd_params.some(p => p === param)) {
                                        req_upd_obj[param] = upd_obj[param];
                                    }
                                });


                                let subQuery = function (column) {
                                    return knex('visits_history')
                                        .select(column)
                                        .where('emp_id', pepl_id)
                                        .andWhere('rec_id', req_upd_obj.rec_id);
                                };

                                return knex(T.VISITS.NAME)
                                    .update(
                                        {
                                            rec_id: req_upd_obj.rec_id,
                                            vst_reason: req_upd_obj.vst_reason,
                                            vst_problem: req_upd_obj.vst_problem,
                                            vst_result: req_upd_obj.vst_result,
                                            vst_dt: subQuery('vst_dt'),
                                            vst_age: subQuery('vst_age'),
                                            vst_gender: subQuery('vst_gender'),
                                            vst_name: subQuery('vst_name'),
                                            vst_consultant: subQuery('vst_consultant')
                                        }
                                    )
                                    .transacting(trx)
                                    .where(T.VISITS.VST_ID, upd_obj.vst_id)
                                    .andWhere(T.VISITS.EMP_ID, pepl_id)
                                    .whereExists(function () {
                                        this.select()
                                            .from('history_timepoints as ht')
                                            .where('ht.rec_id', req_upd_obj.rec_id)
                                            .andWhere('ht.emp_id', pepl_id)
                                            .whereNotNull('ht.pepl_id')
                                    })
                                    .returning('*');
                            } else {
                                // Если привязка к записи не меняется, то собираем объект из тех параметров, что имеются
                                // Объект должен содержать хотя бы одно изменение
                                let req_upd_params = ['vst_reason', 'vst_problem', 'vst_result'];
                                let req_upd_params2 = ['vst_dt', 'vst_age', 'vst_gender', 'vst_name', 'vst_consultant'];
                                let req_upd_obj = {};
                                Object.keys(upd_obj).forEach(param => {
                                    if (req_upd_params.some(p => p === param)) {
                                        req_upd_obj[param] = upd_obj[param];
                                    }
                                });
                                if (upd_obj.vst_data !== undefined) {
                                    Object.keys(upd_obj.vst_data).forEach(param => {
                                        if (req_upd_params2.some(p => p === param)) {
                                            req_upd_obj[param] = upd_obj.vst_data[param];
                                            req_upd_obj.rec_id = null;
                                        }
                                    });
                                }

                                if (Object.keys(req_upd_obj).length === 0) {
                                    return;
                                }

                                return knex(T.VISITS.NAME)
                                    .update(req_upd_obj)
                                    .transacting(trx)
                                    .where(T.VISITS.VST_ID, upd_obj.vst_id)
                                    .andWhere(T.VISITS.EMP_ID, pepl_id)
                                    .returning('*');
                            }
                        })
                    } else {
                        return undefined;
                    }
                })
                .then(res => {
                    result.vst_arr_upd = {};
                    if (res === undefined || res.length === 0 || !res.some(item => item !== undefined &&
                        item.length > 0 &&
                        item[0] !== undefined)) {
                        console.error(STATUS.NOT_FOUND_UPDATED_REC);
                        result.vst_arr_upd.status = STATUS.NOT_FOUND_UPDATED_REC
                    } else {
                        console.log('Updated ' + res.length + ' Visits');
                        res = res.filter(item => item !== undefined && item.length > 0 && item[0] !== undefined);
                        result.vst_arr_upd = {
                            status: STATUS.OK,
                            vst_id_upd: res.map(item => item[0].vst_id)
                        }
                    }

                    if (vst_arr_add !== undefined && vst_arr_add.length > 0) {
                        return Promise.map(vst_arr_add, (add_obj) => {
                            if (add_obj.rec_data !== undefined && add_obj.rec_data.rec_id) {
                                // Тут можно к объекту запроса добавить еще повод, проблему и результат
                                // Затем делаем запрос на добавление с проверкой
                                let req_add_params = ['vst_reason', 'vst_problem', 'vst_result'];
                                let req_add_obj = {
                                    rec_id: add_obj.rec_data.rec_id
                                };
                                Object.keys(add_obj).forEach(param => {
                                    if (req_add_params.some(p => p === param)) {
                                        req_add_obj[param] = add_obj[param];
                                    }
                                });


                                let subQuery = function (column) {
                                    return knex('visits_history')
                                        .select(column)
                                        .where('emp_id', pepl_id)
                                        .andWhere('rec_id', req_add_obj.rec_id);
                                };

                                return knex(T.VISITS.NAME)
                                    .insert(
                                        {
                                            rec_id: req_add_obj.rec_id,
                                            vst_reason: req_add_obj.vst_reason,
                                            vst_problem: req_add_obj.vst_problem,
                                            vst_result: req_add_obj.vst_result,
                                            vst_dt: subQuery('vst_dt'),
                                            vst_age: subQuery('vst_age'),
                                            vst_gender: subQuery('vst_gender'),
                                            vst_name: subQuery('vst_name'),
                                            vst_consultant: subQuery('vst_consultant'),
                                            emp_id: pepl_id
                                        }
                                    )
                                    .transacting(trx)
                                    .whereExists(function () {
                                        this.select()
                                            .from('history_timepoints as ht')
                                            .where('ht.rec_id', req_add_obj.rec_id)
                                            .andWhere('ht.emp_id', pepl_id)
                                            .whereNotNull('ht.pepl_id')
                                    })
                                    .returning('*');
                            } else {
                                // Если привязка к записи не меняется, то собираем объект из тех параметров, что имеются
                                // Объект должен содержать хотя бы одно изменение
                                let req_add_params = ['vst_reason', 'vst_problem', 'vst_result'];
                                let req_add_params2 = ['vst_dt', 'vst_age', 'vst_gender', 'vst_name', 'vst_consultant'];
                                let req_add_obj = {};
                                Object.keys(add_obj).forEach(param => {
                                    if (req_add_params.some(p => p === param)) {
                                        req_add_obj[param] = add_obj[param];
                                    }
                                });
                                if (add_obj.vst_data !== undefined) {
                                    Object.keys(add_obj.vst_data).forEach(param => {
                                        if (req_add_params2.some(p => p === param)) {
                                            req_add_obj[param] = add_obj.vst_data[param];
                                            req_add_obj.rec_id = null;
                                        }
                                    });
                                }

                                if (Object.keys(req_add_obj).length === 0) {
                                    return;
                                }

                                req_add_obj.emp_id = pepl_id;

                                return knex(T.VISITS.NAME)
                                    .insert(req_add_obj)
                                    .transacting(trx)
                                    .returning('*');
                            }
                        })
                    } else {
                        return undefined;
                    }
                })
                .then(res => {
                    result.vst_arr_add = {};
                    if (res === undefined || res.length === 0 || !res.some(item => item !== undefined &&
                        item.length > 0 &&
                        item[0] !== undefined)) {
                        console.error(STATUS.NOT_FOUND_ADDED_REC);
                        result.vst_arr_add.status = STATUS.NOT_FOUND_ADDED_REC
                    } else {
                        console.log('Added ' + res.length + ' Visits');
                        res = res.filter(item => item !== undefined && item.length > 0 && item[0] !== undefined);
                        result.vst_arr_add = {
                            status: STATUS.OK,
                            vst_add_res: res.map(item => {
                                return {
                                    rec_id: item[0].rec_id,
                                    vst_dt: this.getDateWithTime(item[0].vst_dt)
                                }
                            })
                        }
                    }

                    resolve(result);
                })
                .then(res => {
                    trx.commit();
                })
                .catch(err => {
                    result = {status: STATUS.UNKNOWN_ERROR};
                    reject(result);

                    trx.rollback(err);
                })
        });
    });
};
