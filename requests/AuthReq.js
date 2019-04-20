const T = require('../constants').TABLES;
const ROLE = require('../constants').ROLE;
const crypto = require('crypto');

/**
 *
 *  Полезные функции
 *
 */

exports.encryptPassword = function encryptPassword(password, salt) {
    return crypto.createHmac('sha1', salt).update(password).digest('hex');
};

exports.getSaltAndHashPass = function getSaltAndHashPass(pass) {
    const salt = crypto.randomBytes(32).toString('base64');
    const hash_pass = crypto.createHmac('sha1', salt).update(pass).digest('hex');
    return {
        pepl_salt: salt,
        pepl_hash_pass: hash_pass
    }
};


/**
 *
 *  Методы для работы с БД
 *
 */

// Запрос всех подтверждений регистрации с проверками по ученикам, их классным руководителям и классам
exports.getConfsParentsById = (knex, prnt_id_arr) => {
    return knex
        .distinct()
        .select()
        .from(function () {
            this.select()
                .from({cr: T.CONFIRM_REG.NAME})
                .whereIn('cr.' + T.CONFIRM_REG.PRNT_ID, prnt_id_arr)
                .leftOuterJoin(function () {
                    this.select({
                        ch_second_name: 'p.' + T.PEOPLE.PEPL_SECOND_NAME,
                        ch_first_name: 'p.' + T.PEOPLE.PEPL_FIRST_NAME,
                        ch_last_name: 'p.' + T.PEOPLE.PEPL_LAST_NAME,
                        std_id: 's.' + T.STUDENTS.STD_ID,
                        std_emp_id: 's.' + T.STUDENTS.EMP_ID,
                        std_date_receipt: 's.' + T.STUDENTS.STD_DATE_RECEIPT,
                        std_stayed_two_year: 's.' + T.STUDENTS.STD_STAYED_TWO_YEAR,
                        std_class_letter: 's.' + T.STUDENTS.STD_CLASS_LETTER
                    })
                        .from({p: T.PEOPLE.NAME, s: T.STUDENTS.NAME, r: T.ROLE.NAME, sp: T.STD_PRNT.NAME})
                        .whereRaw('?? = ?? and ?? = ?', ['r.' + T.ROLE.PEPL_ID, 'p.' + T.PEOPLE.PEPL_ID, 'r.' + T.ROLE.ROLE_NAME, ROLE.STUDENT])
                        .andWhereRaw('?? = ??', ['s.' + T.STUDENTS.STD_ID, 'p.' + T.PEOPLE.PEPL_ID])
                        .as('studs')
                }, function () {
                    this.on('cr.' + T.CONFIRM_REG.CR_SECOND_CHILD, 'studs.ch_second_name')
                        .andOn('cr.' + T.CONFIRM_REG.CR_FIRST_CHILD, 'studs.ch_first_name')
                        .andOn('cr.' + T.CONFIRM_REG.CR_LAST_CHILD, 'studs.ch_last_name')
                        .andOn(knex.raw('?? = case when extract(month from current_date) < 9 then ' +
                            'extract(year from current_date) - extract(year from ??) - ?? else ' +
                            'extract (year from current_date) - extract(year from ??) - ?? + 1 end ' +
                            '|| ??',
                            ['cr.' + T.CONFIRM_REG.CR_CLASS, 'studs.' + T.STUDENTS.STD_DATE_RECEIPT, 'studs.' + T.STUDENTS.STD_STAYED_TWO_YEAR,
                                'studs.' + T.STUDENTS.STD_DATE_RECEIPT, 'studs.' + T.STUDENTS.STD_STAYED_TWO_YEAR, 'studs.' + T.STUDENTS.STD_CLASS_LETTER]))
                })
                .as('child_pepl')
        })
        .leftOuterJoin(function () {
            this.select({
                    emp_id: 'p.' + T.PEOPLE.PEPL_ID,
                    tch_second_name: 'p.' + T.PEOPLE.PEPL_SECOND_NAME,
                    tch_first_name: 'p.' + T.PEOPLE.PEPL_FIRST_NAME,
                    tch_last_name: 'p.' + T.PEOPLE.PEPL_LAST_NAME
                })
                .from({p: T.PEOPLE.NAME, r: T.ROLE.NAME})
                .whereRaw('?? = ??', ['r.' + T.ROLE.PEPL_ID, 'p.' + T.PEOPLE.PEPL_ID])
                .andWhereRaw('?? = ?', ['r.' + T.ROLE.ROLE_NAME, ROLE.TEACHER])
                .as('teachs')
        }, function () {
            this.on('child_pepl.' + T.CONFIRM_REG.CR_SECOND_TEACHER, 'teachs.tch_second_name')
                .andOn('child_pepl.' + T.CONFIRM_REG.CR_FIRST_TEACHER, 'teachs.tch_first_name')
                .andOn('child_pepl.' + T.CONFIRM_REG.CR_LAST_TEACHER, 'teachs.tch_last_name')
                .andOn('child_pepl.std_emp_id', 'teachs.emp_id')
        });
};

exports.setConfirmParentReg = function (knex, body) {

    return new Promise((resolve, reject) => {
        const STATUS = {
            BAD_REQUEST: 'BAD_REQUEST',
            NOT_FOUND_ADDED_DATA: 'NOT_FOUND_ADDED_DATA',
            NOT_FOUND_UPDATED_PARENT: 'NOT_FOUND_UPDATED_PARENT',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        let result = {};

        if (body.prnt_confirm === 1 && body.std_id_arr !== undefined && body.std_id_arr.length !== 0) {
            const prnt_std_arr = body.std_id_arr.map(std_id => {
                return {
                    prnt_id: body.prnt_id,
                    std_id: std_id
                }
            });

            knex.transaction(function (trx) {
                return knex(T.STD_PRNT.NAME)
                    .transacting(trx)
                    .insert(prnt_std_arr)
                    .returning('*')
                    .then((res) => {
                        if (res.length === 0) {
                            throw new Error(STATUS.NOT_FOUND_ADDED_DATA);
                        }

                        console.log('Added ' + res.length + ' Records');
                        return knex(T.PARENTS.NAME)
                            .transacting(trx)
                            .update({prnt_confirm: 1})
                            .where(T.PARENTS.PRNT_ID, body.prnt_id)
                            .returning(T.PARENTS.PRNT_ID);
                    })
                    .then((res) => {
                        if (res.length === 0) {
                            throw new Error(STATUS.NOT_FOUND_UPDATED_PARENT);
                        }

                        console.log('Updated Parent');
                        resolve(res);
                        trx.commit();
                    })
                    .catch((err) => {
                        if (err.message === STATUS.NOT_FOUND_ADDED_DATA ||
                            err.message === STATUS.NOT_FOUND_UPDATED_PARENT)
                            result = {status: err.message};
                        else
                            result = {status: STATUS.UNKNOWN_ERROR};
                        resolve(result);

                        trx.rollback(err);
                    })
            })
        } else {
            if (body.prnt_confirm === 2) {
                return knex(T.PARENTS.NAME)
                    .update({prnt_confirm: 2})
                    .where(T.PARENTS.PRNT_ID, body.prnt_id)
                    .returning(T.PARENTS.PRNT_ID)
                    .then((res) => {
                        if (res.length === 0) {
                            throw new Error(STATUS.NOT_FOUND_UPDATED_PARENT);
                        }

                        console.log('Updated Parent');
                        resolve(res);
                    })
                    .catch((err) => {
                        if (err.message === STATUS.NOT_FOUND_UPDATED_PARENT)
                            result = {status: err.message};
                        else
                            result = {status: STATUS.UNKNOWN_ERROR};
                        resolve(result);
                    });
            }else {
                result = {status: STATUS.BAD_REQUEST};
                resolve(result);
            }
        }
    });
};

exports.insertPepl = function (knex, trx, pepl_data) {
    return knex(T.PEOPLE.NAME).transacting(trx).insert(pepl_data).returning([T.PEOPLE.PEPL_ID, T.PEOPLE.PEPL_LOGIN]);
};

exports.insertStd = function (knex, trx, std_data) {
    return knex(T.STUDENTS.NAME).transacting(trx).insert(std_data).returning(T.STUDENTS.STD_ID);
};

exports.insertEmp = function (knex, trx, emp_data) {
    return knex(T.EMPLOYEES.NAME).transacting(trx).insert(emp_data).returning(T.EMPLOYEES.EMP_ID);
};

exports.insertPrnt = function (knex, trx, prnt_data) {
    return knex(T.PARENTS.NAME).transacting(trx).insert(prnt_data).returning(T.PARENTS.PRNT_ID);
};

exports.insertConfirmReg = (knex, trx, prnt_id, cr_arr) => {
    cr_arr.forEach(item => {
        item.prnt_id = prnt_id;
    });
    return knex(T.CONFIRM_REG.NAME).transacting(trx).insert(cr_arr).returning(T.CONFIRM_REG.CR_ID);
};