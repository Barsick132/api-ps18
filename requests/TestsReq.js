const T = require('../constants').TABLES;
const Promise = require('bluebird');
const ROLE = require('../constants').ROLE;

exports.addTest = function (knex, body) {
    return new Promise((resolve, reject) => {
        const STATUS = {
            FILE_AND_TEST_NAMES_MUST_BE_UNIQUE: 'FILE_AND_TEST_NAMES_MUST_BE_UNIQUE',
            NOT_FOUND_ADDED_FILES: 'NOT_FOUND_ADDED_FILES',
            NOT_ADDED_ERROR: 'NOT_ADDED_ERROR',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        let result = {};

        knex.transaction(trx => {
            return knex(T.TESTS.NAME)
                .transacting(trx)
                .insert({
                    tst_name: body.tst_name,
                    tst_online: false
                })
                .returning([T.TESTS.TST_ID])
                .then(res => {
                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_ADDED_ERROR);
                    }

                    console.log('Test Created');
                    return Promise.map(body.files, file => {
                        return knex(T.FILE.NAME)
                            .transacting(trx)
                            .insert({
                                tst_id: res[0].tst_id,
                                file_name: file.file_name,
                                file_path: '/',
                                file_size: file.file.size,
                                file_mimetype: file.file.mimetype
                            })
                            /*.whereNotExists(function () {
                                this.select()
                                    .from(T.FILE.NAME)
                                    .where(T.FILE.FILE_NAME, file.file_name)
                                    .andWhere(T.FILE.TST_ID, res[0].tst);
                            })*/
                            .returning('*');
                    })
                })
                .then(res => {
                    res = res.filter(arr => arr.length !== 0);
                    res = res.map(arr => arr[0]);

                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_FOUND_ADDED_FILES);
                    }

                    resolve(res);

                    trx.commit();
                })
                .catch(err => {
                    if (err.message === STATUS.NOT_ADDED_ERROR ||
                        err.message === STATUS.NOT_FOUND_ADDED_FILES) {
                        result = {status: err.message}
                    } else {
                        result = {status: STATUS.UNKNOWN_ERROR}
                    }
                    if (err.constraint === 'uniq_name') {
                        result = {status: STATUS.FILE_AND_TEST_NAMES_MUST_BE_UNIQUE}
                    }
                    reject(result);
                    trx.rollback(err);
                });
        })
    });
};

exports.getTests = function (knex, body) {
    return new Promise((resolve, reject) => {
        const STATUS = {
            NOT_FOUND_TESTS: 'NOT_FOUND_TESTS',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        let result = {};

        return new Promise((resolve, reject) => {
            if (body.role === ROLE.PSYCHOLOGIST) {
                return knex(T.TESTS.NAME)
                    .select()
                    .orderBy(T.TESTS.TST_ID)
                    .then(res => resolve(res))
                    .catch(err => reject(err));
            }
            if (body.role === ROLE.STUDENT) {
                return knex({t: T.TESTS.NAME, at: T.AVAILABLE_TESTS.NAME})
                    .select('t.*')
                    .whereRaw('?? = ??', ['t.' + T.TESTS.TST_ID, 'at.' + T.AVAILABLE_TESTS.TST_ID])
                    .andWhere(T.AVAILABLE_TESTS.STD_ID, body.pepl_id)
                    .orderBy(T.TESTS.TST_ID)
                    .then(res => resolve(res))
                    .catch(err => reject(err));
            }
        })
            .then(res => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_TESTS);
                }

                resolve(res);
            })
            .catch(err => {
                if (err.message === STATUS.NOT_FOUND_TESTS) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR};
                }
                reject(result);
            })
    });
};

exports.changeTestName = function (knex, body) {
    return knex(T.TESTS.NAME)
        .update({tst_name: body.tst_name})
        .where(T.TESTS.TST_ID, body.tst_id)
        .returning(T.TESTS.TST_ID);
};

exports.accessTests = function (knex, body) {
    const STATUS = {
        AVAILABLE_TESTS_ALREADY_EXISTS: 'AVAILABLE_TESTS_ALREADY_EXISTS',
        NOT_FOUND_TST_ID_FROM_ARR: 'NOT_FOUND_TST_ID_FROM_ARR',
        NOT_ADDED_OR_DELETED_AT: 'NOT_ADDED_OR_DELETED_AT',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };

    let result = {};

    return new Promise((resolve, reject) => {
        knex.transaction(trx => {
            return new Promise((resolve, reject) => {
                if (body.tst_open_access) {
                    let reqArr = body.tst_id_arr.map(id => {
                        return {
                            std_id: body.std_id,
                            tst_id: id
                        }
                    });
                    return knex(T.AVAILABLE_TESTS.NAME)
                        .transacting(trx)
                        .insert(reqArr)
                        .returning(T.AVAILABLE_TESTS.TST_ID)
                        .then(res => resolve(res))
                        .catch(err => reject(err));
                } else {
                    return knex(T.AVAILABLE_TESTS.NAME)
                        .del()
                        .where(T.AVAILABLE_TESTS.STD_ID, body.std_id)
                        .whereIn(T.AVAILABLE_TESTS.TST_ID, body.tst_id_arr)
                        .returning(T.AVAILABLE_TESTS.TST_ID)
                        .then(res => resolve(res))
                        .catch(err => reject(err));
                }
            })
                .then(res => {
                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_ADDED_OR_DELETED_AT);
                    }

                    resolve(res);
                    trx.commit();
                })
                .catch(err => {
                    if (err.message === STATUS.NOT_ADDED_OR_DELETED_AT) {
                        result = {status: err.message};
                    } else {
                        result = {status: STATUS.UNKNOWN_ERROR};
                    }
                    if(err.code === "23505"){
                        result = {status: STATUS.AVAILABLE_TESTS_ALREADY_EXISTS};
                    }
                    if(err.code === "23503"){
                        result = {status: STATUS.NOT_FOUND_TST_ID_FROM_ARR};
                    }
                    reject(result);
                    trx.rollback(err);
                })
        })
    })
};