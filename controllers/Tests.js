'use strict';

const utils = require('../utils/writer.js');
const Tests = require('../service/TestsService');

module.exports.accessTest = function accessTest (req, res, next) {
  var body = req.swagger.params['body'].value;
  Tests.accessTest(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.addTest = function addTest (req, res, next) {
  var body = req.swagger.params['body'].value;
  Tests.addTest(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.addTestResult = function addTestResult (req, res, next) {
  var body = req.swagger.params['body'].value;
  Tests.addTestResult(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.changeTestName = function changeTestName (req, res, next) {
  var body = req.swagger.params['body'].value;
  Tests.changeTestName(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.delTest = function delTest (req, res, next) {
  var body = req.swagger.params['body'].value;
  Tests.delTest(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.delTestResult = function delTestResult (req, res, next) {
  var body = req.swagger.params['body'].value;
  Tests.delTestResult(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTest = function getTest (req, res, next) {
  Tests.getTest()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTestResult = function getTestResult (req, res, next) {
  var body = req.swagger.params['body'].value;
  Tests.getTestResult(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
