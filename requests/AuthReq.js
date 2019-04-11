const T = require('../constants').TABLES;
const crypto = require('crypto');

/**
 *
 *  Полезные функции
 *
 */

exports.encryptPassword = function encryptPassword(password, salt) {
    return crypto.createHmac('sha1', salt).update(password).digest('hex');
};

exports.getSaltAndHashPass = function getSaltAndHashPass (pass) {
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