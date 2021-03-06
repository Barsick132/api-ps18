'use strict';

const utils = require('../utils/writer.js');
const Files = require('../service/FilesService');
const FILE_SIZE = require('../constants').FILE_SIZE;
const fs = require('fs');
const stream = require('stream');

module.exports.addFiles = function addFiles(req, res, next) {
    if (req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const paramsFilesArr = ['file1', 'file2', 'file3', 'file4', 'file5',
        'file6', 'file7', 'file8', 'file9', 'file10'];
    const paramsArr = ['std_id', 'tst_id', 'tr_id'];
    let body = {};
    body.files = [];
    Object.keys(req.body).forEach(param => {
        if (paramsFilesArr.some(p => p === param)) {
            let file = JSON.parse(req.body[param]);
            file.id = param;
            body.files.push(file);
        }
        if (paramsArr.some(p => p === param) && req.body[param] !== undefined) {
            const value = parseInt(req.body[param]);
            if (!isNaN(value)) {
                body[param] = value;
            }
        }
    });

    for (let i = 0; i < body.files.length; i++) {
        if (req.files[body.files[i].id][0].size <= FILE_SIZE) {
            body.files[i].file = req.files[body.files[i].id][0];
        } else {
            body.files.splice(i, 1);
            i--;
        }
    }

    if (body.files.length === 0) {
        utils.writeJson(res, {status: 'NOT_FOUND_VALID_FILES'});
        return;
    }

    Files.addFiles(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.delFiles = function delFiles(req, res, next) {
    if (req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const body = req.swagger.params['body'].value;
    Files.delFiles(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.downloadFiles = function downloadFiles(req, res, next) {
    if (req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const body = req.swagger.params['file_id_arr'].value;
    Files.downloadFiles(req, body)
        .then(function (response) {
            //const readStream = new stream.PassThrough();
            //readStream.end(response.buffer);

            res.writeHead(200, response.headers);
            res.write(response.buffer);
            res.end();
            //readStream.pipe(res);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.getFiles = function getFiles(req, res, next) {
    if (req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const body = req.swagger.params['body'].value;
    Files.getFiles(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.updFile = function updFile(req, res, next) {
    if (req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const body = req.swagger.params['body'].value;
    Files.updFile(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};
