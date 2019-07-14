'use strict';

const knex = require('../index').knex;
const UsersReq = require('../requests/UsersReq');
const FilesReq = require('../requests/FilesReq');
const ROLE = require('../constants').ROLE;
const fs = require('fs');
const async = require('async');
const AdmZip = require('adm-zip');
const mime = require('mime-types');

const FILE = './service/FilesService.js';

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

                        fs.writeFile(dir + file.file_id + '.' + file.file_expansion,
                            file.file.buffer, function (err) {
                                if (err) {
                                    console.log(err);
                                    callback(err);
                                } else {
                                    console.log(file.file_path + '/' + file.file_name + '.' + file.file_expansion + ' was updated.');
                                    callback();
                                }
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
exports.delFiles = function (req, body) {
    const METHOD = 'delFiles()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            ERROR_DELETED_FILES: 'ERROR_DELETED_FILES',
            NOT_FOUND_DELETED_FILES: 'NOT_FOUND_DELETED_FILES',
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

        FilesReq.delFilesById(knex, body.map(file => file.file_id))
            .then(res => {
                if (res.length === 0) {
                    throw new Error(STATUS.NOT_FOUND_DELETED_FILES);
                }

                console.log('Deleted ' + res.length + ' files from DB');
                res.forEach(file => {
                    let dir;
                    if (file.mm_id !== null && file.mm_id !== undefined) {
                        dir = './public/mm/' + file.mm_id + '/';
                    }
                    if (file.tst_id !== null && file.tst_id !== undefined) {
                        dir = './public/tst/' + file.tst_id + '/';
                    }
                    if (file.tr_id !== null && file.tr_id !== undefined) {
                        dir = './public/tr/' + file.tr_id + '/';
                    }

                    async.each(res, function (file, callback) {

                        fs.unlink(dir + file.file_id + '.' + file.file_expansion,
                            function (err) {
                                if (err) {
                                    console.error(err);
                                } else {
                                    console.log(file.file_path + '/' + file.file_name + '.' + file.file_expansion + ' was deleted.');
                                }
                                callback();
                            });

                    }, function (err) {

                        if (err) {
                            // One of the iterations produced an error.
                            // All processing will now stop.
                            console.error(STATUS.ERROR_DELETED_FILES);
                        } else {
                            console.log('All files have been processed successfully');
                        }
                        payload = [];
                        res.forEach(file_db => {
                            payload.push({
                                file_id: file_db.file_id
                            })
                        });

                        result = {
                            status: STATUS.OK,
                            payload: payload
                        };

                        resolve(result);
                    });
                })
            })
            .catch(err => {
                console.error(err);
                if (err.message === STATUS.NOT_FOUND_DELETED_FILES ||
                    err.message === STATUS.ERROR_DELETED_FILES) {
                    result = {status: err.message};
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR};
                }
                reject(result);
            })
    });
};


/**
 * Скачивание файлов
 *
 * body List Массив ID файлов
 * returns inline_response_200
 **/
exports.downloadFiles = function (req, body) {
    const METHOD = 'downloadFiles()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            NOT_FOUND_FILES: 'NOT_FOUND_FILES',
            ERROR_READING_FILES: 'ERROR_READING_FILES',
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

        if (!UsersReq.checkRoles(req.user.roles, [ROLE.PSYCHOLOGIST, ROLE.STUDENT])) {
            console.error('Not ' + ROLE.PSYCHOLOGIST + ' and Not ' + ROLE.STUDENT);
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        FilesReq.getFileInfo(knex, body, req.user)
            .then(res => {
                if (res.length === 0) {
                    result = {status: STATUS.NOT_FOUND_FILES};
                    reject(result);
                }

                const getDir = function (file) {
                    if (file.mm_id !== null && file.mm_id !== undefined) {
                        return './public/mm/' + file.mm_id + '/';
                    }
                    if (file.tst_id !== null && file.tst_id !== undefined) {
                        return './public/tst/' + file.tst_id + '/';
                    }
                    if (file.tr_id !== null && file.tr_id !== undefined) {
                        return './public/tr/' + file.tr_id + '/';
                    }
                };

                if (res.length > 1) {
                    // Если файлов несколько
                    const zip = new AdmZip();
                    async.each(res, function (file, callback) {
                        let dir = getDir(file);


                        let localPath = dir + file.file_id + "." + file.file_expansion;

                        try {
                            zip.addLocalFile(localPath, null, file.file_name + '.' + file.file_expansion);
                            callback();
                        } catch (err) {
                            console.error(err);
                            callback(err);
                        }

                    }, function (err) {

                        if (err) {
                            // One of the iterations produced an error.
                            // All processing will now stop.
                            result = {status: STATUS.ERROR_READING_FILES};
                            reject(result);
                        } else {
                            zip.toBuffer(function (res) {
                                resolve({
                                    buffer: res,
                                    headers: {
                                        'Content-Type': 'application/zip',
                                        'Content-Disposition': 'attachment;filename=zip-archive.zip'
                                    }
                                });
                            }, function (err) {
                                result = {status: 'ERR_CREATED_BUFFER_ARCHIVE'};
                                reject(result);
                            });
                            /*
                            res.forEach(item => {
                                item.data = JSON.stringify(item.data);
                            });
                            result = {
                                status: STATUS.OK,
                                payload: res
                            };
                             */
                        }
                    });
                } else {
                    // Если 1 файл
                    let file = res[0];
                    let dir = getDir(file);
                    fs.readFile(dir + file.file_id + "." + file.file_expansion, function (err, data) {
                        if (err) {
                            console.error(err);
                            result = {status: STATUS.ERROR_READING_FILES};
                            reject(result);
                        } else {
                            console.log(file.file_path + '/' + file.file_name + '.' + file.file_expansion + ' was read.');
                            resolve({
                                buffer: data,
                                headers: {
                                    'Content-Type': mime.lookup(file.file_expansion),
                                    'Content-Disposition': 'attachment;filename=' + file.file_name + "." + file.file_expansion
                                }
                            });
                        }
                    });
                }
            })
            .catch(err => {
                console.error(err.status);
                reject(err);
            })
    });
};

/**
 * Получение информации о файлах тестов/рез-ов тестирований/ИПК
 *
 * body Body_1 Либо ID студента, либо ID рез. тестирования, либо ID самого тестирования
 * returns inline_response_200_1
 **/
exports.getFiles = function (req, body) {
    const METHOD = 'getFiles()';
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

        FilesReq.getFiles(knex, body)
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
 * Изменение файлов тестов и/или рез-ов тестирований и/или ИПК
 *
 * body Body_3 ID файла, его имя и путь
 * returns inline_response_200_3
 **/
exports.updFile = function (req, body) {
    const METHOD = 'updFile()';
    console.log(FILE, METHOD);

    return new Promise(function (resolve, reject) {
        const STATUS = {
            ERR_UPD_FILE: 'ERR_UPD_FILE',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            BAD_REQUEST: 'BAD_REQUEST',
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

        if (!UsersReq.checkRole(req.user.roles, ROLE.PSYCHOLOGIST)) {
            console.error('Not ' + ROLE.PSYCHOLOGIST);
            reject({status: STATUS.NOT_ACCESS});
            return;
        }

        FilesReq.updFile(knex, body)
            .then(res => {
                if (res.length === 0) {
                    throw new Error(STATUS.BAD_REQUEST);
                }

                result = {
                    status: STATUS.OK,
                    payload: res
                };

                resolve(result);
            })
            .catch(err => {
                if (err.message === STATUS.BAD_REQUEST ||
                    err.message === STATUS.ERR_UPD_FILE) {
                    result = {status: err.message}
                } else {
                    result = {status: STATUS.UNKNOWN_ERROR}
                }
                reject(result);
            })
    });
};

