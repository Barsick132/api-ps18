const T = require('../constants').TABLES;
const Promise = require('bluebird');

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
                    if(err.constraint === 'uniq_name') {
                        result = {status: STATUS.FILE_AND_TEST_NAMES_MUST_BE_UNIQUE}
                    }
                    reject(result);
                    trx.rollback(err);
                });
        })
    });
};