const T = require('../constants').TABLES;

exports.insertEmpPosts = function (knex, trx, emp_id, pst_arr) {
    pst_arr.forEach(item => {
        item.emp_id = emp_id;
    });
    return knex(T.EMP_PST.NAME).transacting(trx).insert(pst_arr).returning('*');
};

exports.getEmpPosts = function (knex, pepl_id) {
    return knex.column(T.POSTS.PST_NAME).select().from(T.POSTS.NAME).whereIn(T.POSTS.PST_ID, function () {
        this.column(T.POSTS.PST_ID).select().from(T.EMP_PST.NAME).where(T.EMP_PST.EMP_ID, pepl_id);
    })
};

exports.getSeveralEmpPosts = function (knex, pepl_id_arr) {
    return knex({ep: T.EMP_PST.NAME, pt: T.POSTS.NAME})
        .column(['ep.' + T.EMP_PST.EMP_ID, 'pt.' + T.POSTS.PST_NAME])
        .select()
        .whereIn('ep.' + T.EMP_PST.EMP_ID, pepl_id_arr)
        .andWhereRaw('?? = ??', ['ep.' + T.EMP_PST.PST_ID, 'pt.' + T.POSTS.PST_ID]);
};

exports.getAllPosts = function (knex) {
    return knex.select().from(T.POSTS.NAME);
};

exports.insertPosts = function (knex, pst_arr) {
    return knex(T.POSTS.NAME).insert(pst_arr).returning(T.POSTS.PST_ID);
};

exports.delPosts = function (knex, pst_id_arr) {
    return knex(T.POSTS.NAME).whereIn(T.POSTS.PST_ID, pst_id_arr).del();
};