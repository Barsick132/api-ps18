const T = require('../constants').TABLES;
const Promise = require('bluebird');

// Закрепление за сотрудником должностей в транзакции
exports.insertEmpPostsTrx = function (knex, trx, emp_id, pst_arr) {
    pst_arr.forEach(item => {
        item.emp_id = emp_id;
    });
    return knex(T.EMP_PST.NAME).transacting(trx).insert(pst_arr).returning('*');
};

// Получить должности, которые есть в БД и переданном массиве,
// но которые при этом не закреплены за данным сотрудником
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

// Закрепление за сотрудником должностей
exports.insertEmpPosts = function (knex, emp_id, pst_arr) {
    pst_arr.forEach(item => {
        item.emp_id = emp_id;
    });
    return knex(T.EMP_PST.NAME).insert(pst_arr).returning('*');
};

// Получить наименования должностей сотрудника
exports.getEmpPosts = function (knex, pepl_id) {
    return knex.column(T.POSTS.PST_NAME).select().from(T.POSTS.NAME).whereIn(T.POSTS.PST_ID, function () {
        this.column(T.POSTS.PST_ID).select().from(T.EMP_PST.NAME).where(T.EMP_PST.EMP_ID, pepl_id);
    })
};

// Получить должности сотрудника с ID и описанием
exports.getEmpPostsFull = function (knex, pepl_id) {
    return knex.select().from(T.POSTS.NAME).whereIn(T.POSTS.PST_ID, function () {
        this.column(T.POSTS.PST_ID).select().from(T.EMP_PST.NAME).where(T.EMP_PST.EMP_ID, pepl_id);
    })
};

// получить ID должностей сотрудника
exports.getEmpPostsId = function (knex, emp_id){
    return knex.column(T.EMP_PST.PST_ID).select().from(T.EMP_PST.NAME).where(T.EMP_PST.EMP_ID, emp_id);
};

// Удалить должности сотрудника
exports.delEmpPosts = function (knex, emp_id, pst_arr) {
  return knex(T.EMP_PST.NAME)
      .whereIn(T.EMP_PST.PST_ID, pst_arr)
      .where(T.EMP_PST.EMP_ID, emp_id)
      .del()
      .returning(T.EMP_PST.PST_ID);
};

// Получить наименования должностей нескольких сотрудников
exports.getSeveralEmpPosts = function (knex, pepl_id_arr) {
    return knex({ep: T.EMP_PST.NAME, pt: T.POSTS.NAME})
        .column(['ep.' + T.EMP_PST.EMP_ID, 'pt.' + T.POSTS.PST_NAME])
        .select()
        .whereIn('ep.' + T.EMP_PST.EMP_ID, pepl_id_arr)
        .andWhereRaw('?? = ??', ['ep.' + T.EMP_PST.PST_ID, 'pt.' + T.POSTS.PST_ID]);
};

// Получить все должности вместе с ID и описанием
exports.getAllPosts = function (knex) {
    return knex.select().from(T.POSTS.NAME);
};

// Добавить в БД должности
exports.insertPosts = function (knex, pst_arr) {
    return knex(T.POSTS.NAME).insert(pst_arr).returning(T.POSTS.PST_ID);
};

// Обновить в БД должности
exports.updPosts = function (knex, pst_arr) {
    return Promise.map(pst_arr, function (item) {
        return knex(T.POSTS.NAME)
            .where(T.POSTS.PST_ID, item.pst_id)
            .update(item)
            .returning(T.POSTS.PST_ID);
    })
};

// Удалить из БД должности
exports.delPosts = function (knex, pst_id_arr) {
    return knex(T.POSTS.NAME).whereIn(T.POSTS.PST_ID, pst_id_arr).del().returning(T.POSTS.PST_ID);
};

// Получить список ID должностей из массива, которые есть в БД
exports.getExistingPosts = function (knex, pst_arr_id) {
  return knex(T.POSTS.NAME)
      .distinct(T.POSTS.PST_ID)
      .columns(T.POSTS.PST_ID)
      .select()
      .whereIn(T.POSTS.PST_ID, pst_arr_id);
};

// Получить список должностей из массива, которые есть в БД,
// но, которые при этом ни за кем не закреплены
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