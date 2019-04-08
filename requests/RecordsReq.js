const FILE = './requests/RecordsReq.js';
const ROLE = require('../constants').ROLE;
const T = require('../constants').TABLES;
const PERIOD_FIX = require('../constants').PERIOD_FIX;
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
 * Метод удаления рабочих дней
 *
 */
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

/**
 *
 * Метод обновления рабочих дней
 *
 */
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

/**
 *
 * Метод добавления рабочих дней
 *
 */
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

/**
 *
 * Метод получения рабочих дней с записями
 *
 */
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