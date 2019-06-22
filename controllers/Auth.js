'use strict';

const utils = require('../utils/writer.js');
const Auth = require('../service/AuthService');


module.exports.confirmParentReg = function confirmParentReg(req, res, next) {
    if(req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const body = req.swagger.params['body'].value;
    Auth.confirmParentReg(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.getListConfirmReg = function getListConfirmReg(req, res, next) {
    if(req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    Auth.getListConfirmReg(req)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.login = function login(req, res, next) {
    if(req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    Auth.login(req)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.registerEmpAndStd = function registerEmpAndStd(req, res, next) {
    if(req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const file = req.files.file[0];
    Auth.registerEmpAndStd(req, file)
        .then(function (response) {
            response.write('ExcelFile.xlsx', res);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.signup = function signup(req, res, next) {
    if(req.error) {
        utils.writeJson(res, {status: req.error});
        return;
    }
    const body = req.swagger.params['body'].value;
    Auth.signup(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};
