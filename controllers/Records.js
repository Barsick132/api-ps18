'use strict';

var utils = require('../utils/writer.js');
var Records = require('../service/RecordsService');

module.exports.cancelRecord = function cancelRecord (req, res, next) {
  var body = req.swagger.params['body'].value;
  Records.cancelRecord(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.changeRecord = function changeRecord (req, res, next) {
  var body = req.swagger.params['body'].value;
  Records.changeRecord(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getJournal = function getJournal (req, res, next) {
  var body = req.swagger.params['body'].value;
  Records.getJournal(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getOneRecord = function getOneRecord (req, res, next) {
  var body = req.swagger.params['body'].value;
  Records.getOneRecord(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getRecordsFromWD = function getRecordsFromWD (req, res, next) {
  var body = req.swagger.params['body'].value;
  Records.getRecordsFromWD(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserGraphic = function getUserGraphic (req, res, next) {
  var body = req.swagger.params['body'].value;
  Records.getUserGraphic(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.moveRecord = function moveRecord (req, res, next) {
  var body = req.swagger.params['body'].value;
  Records.moveRecord(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.setJournal = function setJournal (req, res, next) {
  var body = req.swagger.params['body'].value;
  Records.setJournal(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.setToRecord = function setToRecord (req, res, next) {
  var body = req.swagger.params['body'].value;
  Records.setToRecord(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.setUserGraphic = function setUserGraphic (req, res, next) {
  var body = req.swagger.params['body'].value;
  Records.setUserGraphic(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.skipRecord = function skipRecord (req, res, next) {
  var body = req.swagger.params['body'].value;
  Records.skipRecord(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
