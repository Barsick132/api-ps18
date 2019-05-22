'use strict';

const knex = require('../index').knex;
const UsersReq = require('../requests/UsersReq');
const TestsReq = require('../requests/TestsReq');
const FilesReq = require('../requests/FilesReq');
const ROLE = require('../constants').ROLE;
const fs = require('fs');
const async = require('async');

const FILE = './service/TestsService.js';

/**
 * Открытие/Закрытие доступа к тестам ученикам
 *
 * body Body_7 ID теста, ID студента и статус открытия доступа
 * returns inline_response_200_6
 **/
exports.accessTest = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "status": "OK"
        };
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
}


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
exports.addTestResult = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": {
                "tr_id": 1
            },
            "status": "OK"
        };
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Изменение названия теста
 *
 * body Body_6 ID теста и его новое имя
 * returns inline_response_200_6
 **/
exports.changeTestName = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "status": "OK"
        };
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Удаление теста с файлами
 *
 * body Body_5 ID теста
 * returns inline_response_200_6
 **/
exports.delTest = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "status": "OK"
        };
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Удаление результатов тестирования вместе с фалами
 *
 * body Body_10 ID результата тестирования
 * returns inline_response_200_6
 **/
exports.delTestResult = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "status": "OK"
        };
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Просмотр списка тестирований
 *
 * returns inline_response_200_7
 **/
exports.getTest = function () {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": [{
                "tst_name": "Тест по профорейнтации",
                "tst_online": false,
                "tst_id": 1
            }, {
                "tst_name": "Тест по профорейнтации",
                "tst_online": false,
                "tst_id": 1
            }],
            "status": "OK"
        };
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Поиск результатов тестирований по по тестам и ученикам
 *
 * body Body_9 ID теста и/или ID студента
 * returns inline_response_200_9
 **/
exports.getTestResult = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": [{
                "tr_id": 1
            }, {
                "tr_id": 1
            }],
            "status": "OK"
        };
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
}

