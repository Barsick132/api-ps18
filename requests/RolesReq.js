const roles = require('../constants').ROLE;
const T = require('../constants').TABLES;

exports.getUserRoles = function (knex, pepl_id) {
    return knex.column(T.ROLE.ROLE_NAME).select().from(T.ROLE.NAME).where(T.ROLE.PEPL_ID, pepl_id);
};

exports.addUserRoles = function (knex, trx, pepl_id, role_arr) {
    role_arr.forEach(item => {
        item.pepl_id = pepl_id;
    });
    return knex(T.ROLE.NAME).transacting(trx).insert(role_arr).returning([T.ROLE.PEPL_ID, T.ROLE.ROLE_NAME]);
};

exports.checkRole = function (knex, pepl_id, role_name) {
    return knex(T.ROLE.NAME).whereRaw(T.ROLE.PEPL_ID, pepl_id).andWhereRaw(T.ROLE.ROLE_NAME, role_name);
};

exports.getAllRoles = function () {
    return Object.keys(roles).map(i => {
        return roles[i];
    });
};

exports.getSeveralUserRoles = function (knex, pepl_id_arr) {
    return knex({r: T.ROLE.NAME})
        .select()
        .whereIn('r.' + T.ROLE.PEPL_ID, pepl_id_arr);
};