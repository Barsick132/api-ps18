'use strict';

var utils = require('../utils/writer.js');
var Roles = require('../service/RolesService');

module.exports.addUserRoles = function addUserRoles (req, res, next) {
  var body = req.swagger.params['body'].value;
  Roles.addUserRoles(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.delUserRoles = function delUserRoles (req, res, next) {
  var body = req.swagger.params['body'].value;
  Roles.delUserRoles(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getRoles = function getRoles (req, res, next) {
  Roles.getRoles()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserRoles = function getUserRoles (req, res, next) {
  var body = req.swagger.params['body'].value;
  Roles.getUserRoles(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
