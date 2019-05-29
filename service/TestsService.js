'use strict';

const knex = require('../index').knex;
const UsersReq = require('../requests/UsersReq');
const TestsReq = require('../requests/TestsReq');
const FilesReq = require('../requests/FilesReq');
const ROLE = require('../constants').ROLE;
const fs = require('fs');
const async = require('async');
const rimraf = require("rimraf");

const FILE = './service/TestsService.js';

/**
 * Открытие/Закрытие доступа к тестам ученикам
 *
 * body Body_7 ID теста, ID студента и статус открытия доступа
 * returns inline_response_200_6
 **/
exports.accessTests = function (req, body) {
    const METHOD = 'accessTests()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            OK: 'OK'
        };

        let result = {};
        let payload = {};

        // Проверка аутентификации пользователя
        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (!UsersReq.checkRole(req.user.roles, ROLE.PSYCHOLOGIST)) {
            console.error('Not ' + ROLE.PSYCHOLOGIST);
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        TestsReq.accessTests(knex, body)
            .then(res => {
                result = {
                    status: STATUS.OK,
                    payload: res
                };

                resolve(result);
            })
            .catch(err => {
                console.error(err.status);
                reject(err);
            });
    });
};


/**
 * Добавить оффлайн тест
 *
 * body Body_4 Имя теста и файлы
 * returns inline_response_200_5
 **/
exports.addTest = function (req, body) {
    const METHOD = 'addTest()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            ERROR_SAVING_FILES: 'ERROR_SAVING_FILES',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            OK: 'OK'
        };

        let result = {};
        let payload = {};

        // Проверка аутентификации пользователя
        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (!UsersReq.checkRole(req.user.roles, ROLE.PSYCHOLOGIST)) {
            console.error('Not ' + ROLE.PSYCHOLOGIST);
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        TestsReq.addTest(knex, body)
            .then(res => {
                res.forEach(file_db => {
                    let file = body.files.find(file_info => file_info.file_name === file_db.file_name);
                    if (file !== undefined) {
                        file_db.file = file.file;
                    }
                });

                let dir = './public/tst/' + res[0].tst_id + '/';
                payload.tst_id = res[0].tst_id;
                payload.tst_name = body.tst_name;

                fs.mkdir(dir, {recursive: true}, (err) => {
                    if (err) {
                        result = {status: STATUS.ERROR_SAVING_FILES};
                        reject(result);

                        FilesReq.delFilesById(knex, res.map(file => file.file_id))
                            .then(res => {
                                console.log('Deleted ' + res.length + ' files');
                            })
                            .catch(err => {
                                console.error('Error deleted files');
                            });
                    }
                    async.each(res, function (file, callback) {

                        fs.writeFile(dir + file.file_id,
                            file.file.buffer, function (err) {
                                if (err) {
                                    console.log(err);
                                    callback(err);
                                } else {
                                    console.log(file.file_path + '/' + file.file_name + ' was updated.');
                                    callback();
                                }
                            });

                    }, function (err) {

                        if (err) {
                            // One of the iterations produced an error.
                            // All processing will now stop.
                            result = {status: STATUS.ERROR_SAVING_FILES};
                            reject(result);

                            FilesReq.delFilesById(knex, res.map(file => file.file_id))
                                .then(res => {
                                    console.log('Deleted ' + res.length + ' files');
                                })
                                .catch(err => {
                                    console.error('Error deleted files');
                                })
                        } else {
                            console.log('All files have been processed successfully');
                            payload.file_arr = [];
                            res.forEach(file_db => {
                                payload.file_arr.push({
                                    file_id: file_db.file_id,
                                    file_name: file_db.file_name,
                                    file_path: file_db.file_path,
                                    file_dt: file_db.file_dt,
                                    file_size: file_db.file_size,
                                    file_mimetype: file_db.file_mimetype
                                })
                            });

                            result = {
                                status: STATUS.OK,
                                payload: payload
                            };

                            resolve(result);
                        }
                    });
                });
            })
            .catch(err => {
                console.error(err.status);
                reject(err);
            })
    });
};


/**
 * Добавление результатов тестирований
 *
 * body Body_8 ID теста, ID студента и файлы с результатами
 * returns inline_response_200_8
 **/
exports.addTestResult = function (req, body) {
    const METHOD = 'addTestResult()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            ERROR_SAVING_FILES: 'ERROR_SAVING_FILES',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            OK: 'OK'
        };

        let result = {};
        let payload = {};

        // Проверка аутентификации пользователя
        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (!UsersReq.checkRole(req.user.roles, ROLE.PSYCHOLOGIST)) {
            console.error('Not ' + ROLE.PSYCHOLOGIST);
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        TestsReq.addTestResult(knex, body)
            .then(res => {
                res.forEach(file_db => {
                    let file = body.files.find(file_info => file_info.file_name === file_db.file_name);
                    if (file !== undefined) {
                        file_db.file = file.file;
                    }
                });

                let dir = './public/tr/' + res[0].tr_id + '/';
                payload.tr_id = res[0].tr_id;
                payload.tst_id = body.tst_id;
                payload.std_id = body.std_id;

                fs.mkdir(dir, {recursive: true}, (err) => {
                    if (err) {
                        result = {status: STATUS.ERROR_SAVING_FILES};
                        reject(result);

                        FilesReq.delFilesById(knex, res.map(file => file.file_id))
                            .then(res => {
                                console.log('Deleted ' + res.length + ' files');
                            })
                            .catch(err => {
                                console.error('Error deleted files');
                            });
                    }
                    async.each(res, function (file, callback) {

                        fs.writeFile(dir + file.file_id,
                            file.file.buffer, function (err) {
                                if (err) {
                                    console.log(err);
                                    callback(err);
                                } else {
                                    console.log(file.file_path + '/' + file.file_name + ' was updated.');
                                    callback();
                                }
                            });

                    }, function (err) {

                        if (err) {
                            // One of the iterations produced an error.
                            // All processing will now stop.
                            result = {status: STATUS.ERROR_SAVING_FILES};
                            reject(result);

                            FilesReq.delFilesById(knex, res.map(file => file.file_id))
                                .then(res => {
                                    console.log('Deleted ' + res.length + ' files');
                                })
                                .catch(err => {
                                    console.error('Error deleted files');
                                })
                        } else {
                            console.log('All files have been processed successfully');
                            payload.file_arr = [];
                            res.forEach(file_db => {
                                payload.file_arr.push({
                                    file_id: file_db.file_id,
                                    file_name: file_db.file_name,
                                    file_path: file_db.file_path,
                                    file_dt: file_db.file_dt,
                                    file_size: file_db.file_size,
                                    file_mimetype: file_db.file_mimetype
                                })
                            });

                            result = {
                                status: STATUS.OK,
                                payload: payload
                            };

                            resolve(result);
                        }
                    });
                });
            })
            .catch(err => {
                console.error(err.status);
                reject(err);
            })
    });
};


/**
 * Изменение названия теста
 *
 * body Body_6 ID теста и его новое имя
 * returns inline_response_200_6
 **/
exports.changeTestName = function (req, body) {
    const METHOD = 'changeTestName()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            NOT_FOUND_UPDATED_TESTS: 'NOT_FOUND_UPDATED_TESTS',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            OK: 'OK'
        };

        let result = {};
        let payload = {};

        // Проверка аутентификации пользователя
        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (!UsersReq.checkRole(req.user.roles, ROLE.PSYCHOLOGIST)) {
            console.error('Not ' + ROLE.PSYCHOLOGIST);
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        TestsReq.changeTestName(knex, body)
            .then(res => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_UPDATED_TESTS);
                }

                result = {status: STATUS.OK};
                resolve(result);
            })
            .catch(err => {
                if (err.message === STATUS.NOT_FOUND_UPDATED_TESTS) {
                    result = {status: STATUS.NOT_FOUND_UPDATED_TESTS};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR};
                }
                reject(result);
            });
    });
};


/**
 * Удаление теста с файлами
 *
 * body Body_5 ID теста
 * returns inline_response_200_6
 **/
exports.delTests = function (req, body) {
    const METHOD = 'delTests()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            ERROR_DELETED_FILES: 'ERROR_DELETED_FILES',
            NOT_FOUND_DELETED_TESTS: 'NOT_FOUND_DELETED_TESTS',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            OK: 'OK'
        };

        let result = {};
        let payload = {};

        // Проверка аутентификации пользователя
        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (!UsersReq.checkRole(req.user.roles, ROLE.PSYCHOLOGIST)) {
            console.error('Not ' + ROLE.PSYCHOLOGIST);
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        TestsReq.delTests(knex, body.tst_id_arr)
            .then(res => {
                console.log('Deleted ' + res.tst_id_arr.length + ' Tests');

                let file_arr = [];
                res.file_arr.forEach(arr => {
                    arr.forEach(item => file_arr.push(item));
                });

                async.each(res.file_arr, function (file, callback) {
                    let dir = './public/tst/' + file[0].tst_id + '/';
                    rimraf(dir, function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('Directory ' + dir + ' was deleted.');
                        }
                        callback();
                    });
                    /*fs.unlink(dir + file.file_id,
                        function (err) {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log(file.file_id + ' was deleted.');
                            }
                            callback();
                        });*/

                }, function (err) {

                    if (err) {
                        // One of the iterations produced an error.
                        // All processing will now stop.
                        console.error(STATUS.ERROR_DELETED_FILES);
                    } else {
                        console.log('All files have been processed successfully');
                    }
                    payload = [];

                    result = {
                        status: STATUS.OK,
                        payload: res.tst_id_arr
                    };

                    resolve(result);
                });
            })
            .catch(err => {
                console.log(err.status);
                reject(err);
            })
    });
};


/**
 * Удаление результатов тестирования вместе с фалами
 *
 * body Body_10 ID результата тестирования
 * returns inline_response_200_6
 **/
exports.delTestsResult = function (req, body) {
    const METHOD = 'delTestsResult()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            ERROR_DELETED_FILES: 'ERROR_DELETED_FILES',
            NOT_FOUND_DELETED_TESTS: 'NOT_FOUND_DELETED_TESTS',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            OK: 'OK'
        };

        let result = {};
        let payload = {};

        // Проверка аутентификации пользователя
        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (!UsersReq.checkRole(req.user.roles, ROLE.PSYCHOLOGIST)) {
            console.error('Not ' + ROLE.PSYCHOLOGIST);
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        TestsReq.delTestsResult(knex, body.tr_id_arr)
            .then(res => {
                console.log('Deleted ' + res.tr_id_arr.length + ' Tests Result');

                let file_arr = [];
                res.file_arr.forEach(arr => {
                    arr.forEach(item => file_arr.push(item));
                });

                async.each(res.file_arr, function (file, callback) {
                    let dir = './public/tr/' + file[0].tr_id + '/';
                    rimraf(dir, function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('Directory ' + dir + ' was deleted.');
                        }
                        callback();
                    });
                    /*fs.unlink(dir + file.file_id,
                        function (err) {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log(file.file_id + ' was deleted.');
                            }
                            callback();
                        });*/

                }, function (err) {

                    if (err) {
                        // One of the iterations produced an error.
                        // All processing will now stop.
                        console.error(STATUS.ERROR_DELETED_FILES);
                    } else {
                        console.log('All files have been processed successfully');
                    }
                    payload = [];

                    result = {
                        status: STATUS.OK,
                        payload: res.tr_id_arr
                    };

                    resolve(result);
                });
            })
            .catch(err => {
                console.log(err.status);
                reject(err);
            })
    });
};


/**
 * Просмотр списка тестирований
 *
 * returns inline_response_200_7
 **/
exports.getTests = function (req) {
    const METHOD = 'getTests()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            OK: 'OK'
        };

        let result = {};

        // Проверка аутентификации пользователя
        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        let role = req.user.roles.find(role => role === ROLE.PSYCHOLOGIST);
        if (role === undefined) {
            role = req.user.roles.find(role => role === ROLE.STUDENT);
        }
        if (role === undefined) {
            console.error('Not ' + ROLE.PSYCHOLOGIST + ' and Not ' + ROLE.STUDENT);
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        let body = {
            pepl_id: req.user.pepl_id,
            role: role
        };

        TestsReq.getTests(knex, body)
            .then(res => {
                result = {
                    status: STATUS.OK,
                    payload: res
                };

                resolve(result);
            })
            .catch(err => {
                console.error(err.status);
                reject(err);
            })
    });
};


/**
 * Поиск результатов тестирований по по тестам и ученикам
 *
 * body Body_9 ID теста и/или ID студента
 * returns inline_response_200_9
 **/
exports.getTestResult = function (req, body) {
    const METHOD = 'getTestResult()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            NOT_ACCESS: 'NOT_ACCESS',
            NOT_AUTH: 'NOT_AUTH',
            OK: 'OK'
        };

        let result = {};
        let payload = {};

        // Проверка аутентификации пользователя
        if (!req.isAuthenticated()) {
            console.error('Not Authenticated');
            reject({status: STATUS.NOT_AUTH});
            return;
        }

        if (!UsersReq.checkRole(req.user.roles, ROLE.PSYCHOLOGIST)) {
            console.error('Not ' + ROLE.PSYCHOLOGIST);
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        TestsReq.getTestResult(knex, body)
            .then(res => {
                let new_res = [];
                if (res[0].std_id !== undefined) {
                    res.forEach(item => {
                        let index = new_res.findIndex(i => i.std_id === item.std_id);
                        if (index !== -1) {
                            new_res[index].file_arr.push({
                                tr_id: item.tr_id,
                                file_id: item.file_id,
                                file_name: item.file_name,
                                file_path: item.file_path,
                                file_size: item.file_size,
                                file_mimetype: item.file_mimetype,
                                file_dt: item.file_dt
                            })
                        } else {
                            new_res.push({
                                std_id: item.std_id,
                                file_arr: [{
                                    tr_id: item.tr_id,
                                    file_id: item.file_id,
                                    file_name: item.file_name,
                                    file_path: item.file_path,
                                    file_size: item.file_size,
                                    file_mimetype: item.file_mimetype,
                                    file_dt: item.file_dt
                                }]
                            })
                        }
                    })
                }
                if (res[0].tst_id !== undefined) {
                    res.forEach(item => {
                        let index = new_res.findIndex(i => i.tst_id === item.tst_id);
                        if (index !== -1) {
                            new_res[index].file_arr.push({
                                tr_id: item.tr_id,
                                file_id: item.file_id,
                                file_name: item.file_name,
                                file_path: item.file_path,
                                file_size: item.file_size,
                                file_mimetype: item.file_mimetype,
                                file_dt: item.file_dt
                            })
                        } else {
                            new_res.push({
                                tst_id: item.tst_id,
                                file_arr: [{
                                    tr_id: item.tr_id,
                                    file_id: item.file_id,
                                    file_name: item.file_name,
                                    file_path: item.file_path,
                                    file_size: item.file_size,
                                    file_mimetype: item.file_mimetype,
                                    file_dt: item.file_dt
                                }]
                            })
                        }
                    })
                }

                result = {
                    status: STATUS.OK,
                    payload: new_res
                };

                resolve(result);
            })
            .catch(err => {
                console.error(err.status);
                reject(err);
            });
    });
};

