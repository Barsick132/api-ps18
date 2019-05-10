'use strict';

const knex = require('../index').knex;
const UsersReq = require('../requests/UsersReq');
const FilesReq = require('../requests/FilesReq');
const ROLE = require('../constants').ROLE;
const fs = require('fs');
const async = require('async');

const FILE = './service/RecordsService.js';

/**
 * Добавление файлов тестов/рез-ов тестирований/ИПК
 *
 * body Body_2 Либо ID студента, либо ID рез. тестирования, либо ID самого тестирования и файлы
 * returns inline_response_200_2
 **/
exports.addFiles = function (req, body) {
    const METHOD = 'addFiles()';
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

        FilesReq.addFiles(knex, body)
            .then(res => {
                res.files.forEach(file_db => {
                    let file = body.files.find(file_info => file_info.file_name === file_db.file_name &&
                        file_info.file_path === file_db.file_path);
                    if (file !== undefined) {
                        file_db.file = file.file;
                    }
                });

                let dir;
                switch (res.destination) {
                    case 'std_id': {
                        dir = './public/mm/' + res.files[0].mm_id + '/';
                        payload.std_id = body.std_id;
                        break;
                    }
                    case 'tst_id': {
                        dir = './public/tst/' + res.files[0].tst_id + '/';
                        payload.tst_id = body.tst_id;
                        break;
                    }
                    case 'tr_id': {
                        dir = './public/tr/' + res.files[0].tr_id + '/';
                        payload.tr_id = body.tr_id;
                        break;
                    }
                }

                fs.mkdir(dir, {recursive: true}, (err) => {
                    if (err) {
                        result = {status: STATUS.ERROR_SAVING_FILES};
                        reject(result);

                        FilesReq.delFilesById(knex, res.files.map(file => file.file_id))
                            .then(res => {
                                console.log('Deleted ' + res.length + ' files');
                            })
                            .catch(err => {
                                console.error('Error deleted files');
                            });
                    }
                    async.each(res.files, function (file, callback) {

                        fs.writeFile(dir + file.file_id,
                            file.file.buffer, function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(file.file_path + '/' + file.file_name + ' was updated.');
                                }

                                callback();
                            });

                    }, function (err) {

                        if (err) {
                            // One of the iterations produced an error.
                            // All processing will now stop.
                            result = {status: STATUS.ERROR_SAVING_FILES};
                            reject(result);

                            FilesReq.delFilesById(knex, res.files.map(file => file.file_id))
                                .then(res => {
                                    console.log('Deleted ' + res.length + ' files');
                                })
                                .catch(err => {
                                    console.error('Error deleted files');
                                })
                        } else {
                            console.log('All files have been processed successfully');
                            payload.file_arr = [];
                            res.files.forEach(file_db => {
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
 * Удаление файлов тестов и/или рез-ов тестирований и/или ИПК
 *
 * body List Массив ID файлов
 * returns inline_response_200_4
 **/
exports.delFiles = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": [{
                "file_del_status": true,
                "file_id": 3
            }, {
                "file_del_status": true,
                "file_id": 3
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
 * Скачивание файлов
 *
 * body List Массив ID файлов
 * returns inline_response_200
 **/
exports.downloadFiles = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        if (Object.keys(examples).length > 0) {
            resolve(examples[Object.keys(examples)[0]]);
        } else {
            resolve();
        }
    });
}


/**
 * Получение информации о файлах тестов/рез-ов тестирований/ИПК
 *
 * body Body_1 Либо ID студента, либо ID рез. тестирования, либо ID самого тестирования
 * returns inline_response_200_1
 **/
exports.getFiles = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": [{
                "file_path": "/folder1",
                "file_name": "Тест по профорейнтации",
                "file_id": 3,
                "file_dt": "2019-03-04T09:35:00.000Z"
            }, {
                "file_path": "/folder1",
                "file_name": "Тест по профорейнтации",
                "file_id": 3,
                "file_dt": "2019-03-04T09:35:00.000Z"
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
 * Изменение файлов тестов и/или рез-ов тестирований и/или ИПК
 *
 * body Body_3 ID файла, его имя и путь
 * returns inline_response_200_3
 **/
exports.updFiles = function (body) {
    return new Promise(function (resolve, reject) {
        var examples = {};
        examples['application/json'] = {
            "payload": {
                "file_path": "/folder1",
                "file_name": "Тест по профорейнтации",
                "file_id": 3,
                "file_dt": "2019-03-04T09:35:00.000Z"
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

