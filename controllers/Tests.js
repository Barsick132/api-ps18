'use strict';

const utils = require('../utils/writer.js');
const Tests = require('../service/TestsService');
const FILE_SIZE = require('../constants').FILE_SIZE;

module.exports.accessTests = function accessTests(req, res, next) {
    if (req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const body = req.swagger.params['body'].value;
    Tests.accessTests(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.addTest = function addTest(req, res, next) {
    if (req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const paramsFilesArr = ['file1', 'file2', 'file3', 'file4', 'file5',
        'file6', 'file7', 'file8', 'file9', 'file10'];
    const paramsArr = ['std_id', 'tst_id', 'tr_id'];
    let body = {};
    body.files = [];
    body.tst_name = req.body.tst_name;
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
    Tests.addTest(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.addTestResult = function addTestResult(req, res, next) {
    var body = req.swagger.params['body'].value;
    Tests.addTestResult(body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.changeTestName = function changeTestName(req, res, next) {
    if (req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const body = req.swagger.params['body'].value;
    Tests.changeTestName(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.delTests = function delTests(req, res, next) {
    if (req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const body = req.swagger.params['body'].value;
    Tests.delTests(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.delTestResult = function delTestResult(req, res, next) {
    var body = req.swagger.params['body'].value;
    Tests.delTestResult(body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.getTests = function getTests(req, res, next) {
    if (req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    Tests.getTests(req)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.getTestResult = function getTestResult(req, res, next) {
    if (req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const body = req.swagger.params['body'].value;
    Tests.getTestResult(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};
