'use strict';

var utils = require('../utils/writer.js');
var Auth = require('../service/AuthService');

module.exports.autoCheckParentReg = function autoCheckParentReg(req, res, next) {
    var body = req.swagger.params['body'].value;
    Auth.autoCheckParentReg(body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.confirmParentReg = function confirmParentReg(req, res, next) {
    var body = req.swagger.params['body'].value;
    Auth.confirmParentReg(body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.getListConfirmReg = function getListConfirmReg(req, res, next) {
    Auth.getListConfirmReg()
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

module.exports.registerEmployees = function registerEmployees(req, res, next) {
    var body = req.swagger.params['body'].value;
    Auth.registerEmployees(body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.registerStudents = function registerStudents(req, res, next) {
    var body = req.swagger.params['body'].value;
    Auth.registerStudents(body)
        .then(function (response) {
            utils.writeJson(res, response);
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
