const T = require('../constants').TABLES;

exports.insertEmpPostsTrx = function (knex, trx, emp_id, pst_arr) {
    pst_arr.forEach(item => {
        item.emp_id = emp_id;
    });
    return knex(T.EMP_PST.NAME).transacting(trx).insert(pst_arr).returning('*');
};

exports.getOriginalPosts = function (knex, emp_id, pst_arr) {
    return knex(T.POSTS.NAME)
        .distinct(T.POSTS.PST_ID)
        .columns(T.POSTS.PST_ID)
        .select()
        .whereIn(T.POSTS.PST_ID, pst_arr)
        .whereNotIn(T.POSTS.PST_ID, function () {
            this.columns(T.EMP_PST.PST_ID)
                .select()
                .from(T.EMP_PST.NAME)
                .whereIn(T.EMP_PST.PST_ID, pst_arr)
                .andWhere(T.EMP_PST.EMP_ID, emp_id);
        });
};

exports.insertEmpPosts = function (knex, emp_id, pst_arr) {
    pst_arr.forEach(item => {
        item.emp_id = emp_id;
    });
    return knex(T.EMP_PST.NAME).insert(pst_arr).returning('*');
};

exports.getEmpPosts = function (knex, pepl_id) {
    return knex.column(T.POSTS.PST_NAME).select().from(T.POSTS.NAME).whereIn(T.POSTS.PST_ID, function () {
        this.column(T.POSTS.PST_ID).select().from(T.EMP_PST.NAME).where(T.EMP_PST.EMP_ID, pepl_id);
    })
};

exports.getEmpPostsFull = function (knex, pepl_id) {
    return knex.select().from(T.POSTS.NAME).whereIn(T.POSTS.PST_ID, function () {
        this.column(T.POSTS.PST_ID).select().from(T.EMP_PST.NAME).where(T.EMP_PST.EMP_ID, pepl_id);
    })
};

exports.getEmpPostsId = function (knex, emp_id){
    return knex.column(T.EMP_PST.PST_ID).select().from(T.EMP_PST.NAME).where(T.EMP_PST.EMP_ID, emp_id);
};

exports.delEmpPosts = function (knex, emp_id, pst_arr) {
  return knex(T.EMP_PST.NAME)
      .whereIn(T.EMP_PST.PST_ID, pst_arr)
      .where(T.EMP_PST.EMP_ID, emp_id)
      .del()
      .returning(T.EMP_PST.PST_ID);
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
    return knex(T.POSTS.NAME).whereIn(T.POSTS.PST_ID, pst_id_arr).del().returning(T.POSTS.PST_ID);
};

exports.getRemovablePosts = function (knex, postsArr) {
    return knex(T.POSTS.NAME)
        .distinct(T.POSTS.PST_ID)
        .columns(T.POSTS.PST_ID)
        .select()
        .whereIn(T.POSTS.PST_ID, postsArr)
        .whereNotIn(T.POSTS.PST_ID, function () {
            this.columns('ep.' + T.EMP_PST.PST_ID)
                .select()
                .from({pst: T.POSTS.NAME, ep: T.EMP_PST.NAME})
                .whereIn('pst.' + T.EMP_PST.PST_ID, postsArr)
                .whereRaw('?? = ??', ['pst.' + T.POSTS.PST_ID, 'ep.' + T.EMP_PST.PST_ID])
        });
};