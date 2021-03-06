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
                        let expansion = file.file.originalname.split('.');
                        expansion = expansion[expansion.length-1];
                        return knex(T.FILE.NAME)
                            .transacting(trx)
                            .insert({
                                tst_id: res[0].tst_id,
                                file_name: file.file_name,
                                file_path: '/',
                                file_size: file.file.size,
                                file_expansion: expansion
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
                    if (err.code === "23505") {
                        result = {status: STATUS.AVAILABLE_TESTS_ALREADY_EXISTS};
                    }
                    if (err.code === "23503") {
                        result = {status: STATUS.NOT_FOUND_TST_ID_FROM_ARR};
                    }
                    reject(result);
                    trx.rollback(err);
                })
        })
    })
};

exports.delTests = function (knex, tst_id_arr) {
    const STATUS = {
        TESTS_RESULTS_ARE_TIED_TO_THE_TEST: 'TESTS_RESULTS_ARE_TIED_TO_THE_TEST',
        NOT_FOUND_DELETED_FILES: 'NOT_FOUND_DELETED_FILES',
        NOT_FOUND_DELETED_TESTS: 'NOT_FOUND_DELETED_TESTS',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };

    let result = {};
    let tst_id_arr_new = [];

    return new Promise((resolve, reject) => {
        knex.transaction(trx => {
            return Promise.map(tst_id_arr, tst_id => {
                return knex(T.FILE.NAME)
                    .transacting(trx)
                    .del()
                    .where(T.FILE.TST_ID, tst_id)
                    .whereExists(function () {
                        this.select()
                            .from(T.TESTS.NAME)
                            .where(T.TESTS.TST_ID, tst_id)
                            .andWhere(T.TESTS.TST_ONLINE, false);
                    })
                    .returning([T.FILE.FILE_ID, T.FILE.TST_ID]);
            })
                .then(res => {
                    res = res.filter(arr => arr.length !== 0);

                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_FOUND_DELETED_FILES);
                    }

                    result = {file_arr: res};

                    res.forEach(file => {
                        if (!tst_id_arr_new.some(item => item === file[0].tst_id)) {
                            tst_id_arr_new.push(file[0].tst_id);
                        }
                    });

                    return knex(T.AVAILABLE_TESTS.NAME)
                        .transacting(trx)
                        .del()
                        .whereIn(T.AVAILABLE_TESTS.TST_ID, tst_id_arr_new);
                })
                .then(res => {
                    return knex(T.TESTS.NAME)
                        .transacting(trx)
                        .del()
                        .whereIn(T.TESTS.TST_ID, tst_id_arr_new)
                        .returning(T.TESTS.TST_ID);
                })
                .then(res => {
                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_FOUND_DELETED_TESTS);
                    }

                    result.tst_id_arr = res;
                    resolve(result);

                    trx.commit();
                })
                .catch(err => {
                    if (err.message === STATUS.NOT_FOUND_DELETED_TESTS ||
                        err.message === STATUS.NOT_FOUND_DELETED_FILES) {
                        result = {status: err.message};
                    } else {
                        result = {status: STATUS.UNKNOWN_ERROR};
                    }
                    if (err.code === "23503") {
                        result = {status: STATUS.TESTS_RESULTS_ARE_TIED_TO_THE_TEST}
                    }
                    reject(result);
                    trx.rollback(err);
                });
        });
    });


};

exports.getTestsResult = function (knex, body) {
    const STATUS = {
        BAD_REQUEST: 'BAD_REQUEST',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR',
        NOT_FOUND_RESULT_FILES: 'NOT_FOUND_RESULT_FILES'
    };

    let result = {};

    return new Promise((resolve, reject) => {
        return new Promise((resolve, reject) => {
            if (body.tst_id !== undefined) {
                return knex({file: T.FILE.NAME, tr: T.TEST_RESULTS.NAME})
                    .select('tr.' + T.TEST_RESULTS.TR_ID, 'tr.' + T.TEST_RESULTS.STD_ID,
                        'file.' + T.FILE.FILE_ID, 'file.' + T.FILE.FILE_NAME, 'file.' + T.FILE.FILE_PATH,
                        'file.' + T.FILE.FILE_SIZE, 'file.' + T.FILE.FILE_EXPANSION, 'file.' + T.FILE.FILE_DT)
                    .whereRaw('?? = ??', ['tr.' + T.TEST_RESULTS.TR_ID, 'file.' + T.FILE.TR_ID])
                    .where('tr.' + T.TEST_RESULTS.TST_ID, body.tst_id)
                    .orderBy(T.FILE.FILE_ID, T.FILE.TR_ID)
                    .then(res => resolve(res))
                    .catch(err => reject(err));
            } else {
                if (body.std_id !== undefined) {
                    return knex({file: T.FILE.NAME, tr: T.TEST_RESULTS.NAME})
                        .select('tr.' + T.TEST_RESULTS.TR_ID, 'tr.' + T.TEST_RESULTS.TST_ID,
                            'file.' + T.FILE.FILE_ID, 'file.' + T.FILE.FILE_NAME, 'file.' + T.FILE.FILE_PATH,
                            'file.' + T.FILE.FILE_SIZE, 'file.' + T.FILE.FILE_EXPANSION, 'file.' + T.FILE.FILE_DT)
                        .where('tr.' + T.TEST_RESULTS.STD_ID, body.std_id)
                        .whereRaw('?? = ??', ['tr.' + T.TEST_RESULTS.TR_ID, 'file.' + T.FILE.TR_ID])
                        .orderBy(T.FILE.FILE_ID, T.FILE.TR_ID)
                        .then(res => resolve(res))
                        .catch(err => reject(err));
                } else {
                    reject({message: STATUS.BAD_REQUEST});
                }
            }
        })
            .then(res => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_RESULT_FILES)
                }

                console.log('Found ' + res.length + ' result files');
                resolve(res);
            })
            .catch(err => {
                if (err.message === STATUS.BAD_REQUEST ||
                    err.message === STATUS.NOT_FOUND_RESULT_FILES) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            });
    });
};

exports.addTestResult = function (knex, body) {
    return new Promise((resolve, reject) => {
        const STATUS = {
            FILE_AND_TEST_NAMES_MUST_BE_UNIQUE: 'FILE_AND_TEST_NAMES_MUST_BE_UNIQUE',
            NOT_FOUND_ADDED_FILES: 'NOT_FOUND_ADDED_FILES',
            NOT_ADDED_ERROR: 'NOT_ADDED_ERROR',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        let result = {};

        knex.transaction(trx => {
            return knex(T.TEST_RESULTS.NAME)
                .transacting(trx)
                .insert({
                    tst_id: body.tst_id,
                    std_id: body.std_id
                })
                .returning([T.TEST_RESULTS.TR_ID])
                .then(res => {
                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_ADDED_ERROR);
                    }

                    console.log('Test Result Created');
                    return Promise.map(body.files, file => {
                        let expansion = file.file.originalname.split('.');
                        expansion = expansion[expansion.length-1];
                        return knex(T.FILE.NAME)
                            .transacting(trx)
                            .insert({
                                tr_id: res[0].tr_id,
                                file_name: file.file_name,
                                file_path: '/',
                                file_size: file.file.size,
                                file_expansion: expansion
                            })
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

exports.delTestsResult = function (knex, tr_id_arr) {
    const STATUS = {
        NOT_FOUND_DELETED_FILES: 'NOT_FOUND_DELETED_FILES',
        NOT_FOUND_DELETED_TESTS_RESULT: 'NOT_FOUND_DELETED_TESTS_RESULT',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };

    let result = {};
    let tr_id_arr_new = [];

    return new Promise((resolve, reject) => {
        knex.transaction(trx => {
            return Promise.map(tr_id_arr, tr_id => {
                return knex(T.FILE.NAME)
                    .transacting(trx)
                    .del()
                    .where(T.FILE.TR_ID, tr_id)
                    .whereExists(function () {
                        this.select()
                            .from(T.TEST_RESULTS.NAME)
                            .where(T.TEST_RESULTS.TR_ID, tr_id);
                    })
                    .returning([T.FILE.FILE_ID, T.FILE.TR_ID]);
            })
                .then(res => {
                    res = res.filter(arr => arr.length !== 0);

                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_FOUND_DELETED_FILES);
                    }

                    result = {file_arr: res};

                    res.forEach(file => {
                        if (!tr_id_arr_new.some(item => item === file[0].tr_id)) {
                            tr_id_arr_new.push(file[0].tr_id);
                        }
                    });

                    return knex(T.TEST_RESULTS.NAME)
                        .transacting(trx)
                        .del()
                        .whereIn(T.TEST_RESULTS.TR_ID, tr_id_arr_new)
                        .returning(T.TEST_RESULTS.TR_ID);
                })
                .then(res => {
                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_FOUND_DELETED_TESTS_RESULT);
                    }

                    result.tr_id_arr = res;
                    resolve(result);

                    trx.commit();
                })
                .catch(err => {
                    if (err.message === STATUS.NOT_FOUND_DELETED_TESTS_RESULT ||
                        err.message === STATUS.NOT_FOUND_DELETED_FILES) {
                        result = {status: err.message};
                    } else {
                        result = {status: STATUS.UNKNOWN_ERROR};
                    }
                    reject(result);
                    trx.rollback(err);
                });
        });
    });
};