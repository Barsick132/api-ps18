const ROLE = require('../constants').ROLE;
const T = require('../constants').TABLES;

// Получить список ролей пользователя
exports.getUserRoles = function (knex, pepl_id) {
    return knex.column(T.ROLE.ROLE_NAME).select().from(T.ROLE.NAME).where(T.ROLE.PEPL_ID, pepl_id);
};

// Добавление ролей пользователю в транзакции
exports.addUserRolesTrx = function (knex, trx, pepl_id, role_arr) {
    role_arr.forEach(item => {
        item.pepl_id = pepl_id;
    });
    return knex(T.ROLE.NAME).transacting(trx).insert(role_arr).returning([T.ROLE.PEPL_ID, T.ROLE.ROLE_NAME]);
};

// Добавление ролей пользователю
exports.addUserRoles = function (knex, pepl_id, role_arr) {
    role_arr.forEach(item => {
        item.pepl_id = pepl_id;
    });
    return knex(T.ROLE.NAME).insert(role_arr).returning(T.ROLE.ROLE_NAME);
};

exports.delUserRoles = function (knex, pepl_id, role_arr) {
    return knex(T.ROLE.NAME)
        .where(T.ROLE.PEPL_ID, pepl_id)
        .whereIn(T.ROLE.ROLE_NAME, role_arr)
        .del()
        .returning(T.ROLE.ROLE_NAME);
};

// Проверить наличие роли у пользователя
exports.checkRole = function (knex, pepl_id, role_name) {
    return knex(T.ROLE.NAME).whereRaw(T.ROLE.PEPL_ID, pepl_id).andWhereRaw(T.ROLE.ROLE_NAME, role_name);
};

// Получить список всех ролей
exports.getAllRoles = function () {
    return Object.keys(ROLE).map(i => {
        return ROLE[i];
    });
};

// Получить роли нескольких пользователей
exports.getSeveralUserRoles = function (knex, pepl_id_arr) {
    return knex({r: T.ROLE.NAME})
        .select()
        .whereIn('r.' + T.ROLE.PEPL_ID, pepl_id_arr);
};