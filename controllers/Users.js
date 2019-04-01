'use strict';

const utils = require('../utils/writer.js');
const Users = require('../service/UsersService');

module.exports.getTeachers = function getTeachers (req, res, next) {
    if (req.error === 'ERROR_AUTH') {
        utils.writeJson(res, {status: req.error});
        return;
    }

    Users.getTeachers(req)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.getPersonalData = function getPersonalData (req, res, next) {
    if (req.error === 'ERROR_AUTH') {
        utils.writeJson(res, {status: req.error});
        return;
    }

    Users.getPersonalData(req)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.getPersonsToBeRec = function getPersonsToBeRec (req, res, next) {
    if (req.error === 'ERROR_AUTH') {
        utils.writeJson(res, {status: req.error});
        return;
    }

    Users.getPersonsToBeRec(req)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.bindParentAndStud = function bindParentAndStud(req, res, next) {
    var body = req.swagger.params['body'].value;
    Users.bindParentAndStud(body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.getEmployee = function getEmployee(req, res, next) {
    var body = req.swagger.params['body'].value;
    Users.getEmployee(body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.getParent = function getParent(req, res, next) {
    var body = req.swagger.params['body'].value;
    Users.getParent(body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.getStudent = function getStudent(req, res, next) {
    var body = req.swagger.params['body'].value;
    Users.getStudent(body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.getUser = function getUser(req, res, next) {
    const body = req.swagger.params['body'].value;
    Users.getUser(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};
