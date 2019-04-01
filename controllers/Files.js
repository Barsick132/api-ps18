'use strict';

var utils = require('../utils/writer.js');
var Files = require('../service/FilesService');

module.exports.addFiles = function addFiles (req, res, next) {
  var body = req.swagger.params['body'].value;
  Files.addFiles(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.delFiles = function delFiles (req, res, next) {
  var body = req.swagger.params['body'].value;
  Files.delFiles(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.downloadFiles = function downloadFiles (req, res, next) {
  var body = req.swagger.params['body'].value;
  Files.downloadFiles(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFiles = function getFiles (req, res, next) {
  var body = req.swagger.params['body'].value;
  Files.getFiles(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updFiles = function updFiles (req, res, next) {
  var body = req.swagger.params['body'].value;
  Files.updFiles(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
