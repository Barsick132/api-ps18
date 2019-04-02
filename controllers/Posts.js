'use strict';

var utils = require('../utils/writer.js');
var Posts = require('../service/PostsService');

module.exports.addEmpPosts = function addEmpPosts(req, res, next) {
    var body = req.swagger.params['body'].value;
    Posts.addEmpPosts(body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.addPosts = function addPost(req, res, next) {
    if (req.error === 'ERROR_AUTH' ||
        req.error === 'JWT_EXPIRED') {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const body = req.swagger.params['body'].value;
    Posts.addPosts(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.delEmpPosts = function delEmpPosts(req, res, next) {
    var body = req.swagger.params['body'].value;
    Posts.delEmpPosts(body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.delPosts = function delPost(req, res, next) {
    if (req.error === 'ERROR_AUTH' ||
        req.error === 'JWT_EXPIRED') {
        utils.writeJson(res, {status: req.error});
        return;
    }

    const body = req.swagger.params['body'].value;
    Posts.delPosts(req, body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.getAllPosts = function getAllPosts(req, res, next) {
    if (req.error === 'ERROR_AUTH' ||
        req.error === 'JWT_EXPIRED') {
        utils.writeJson(res, {status: req.error});
        return;
    }

    Posts.getAllPosts(req)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};

module.exports.getEmpPosts = function getEmpPosts(req, res, next) {
    var body = req.swagger.params['body'].value;
    Posts.getEmpPosts(body)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            utils.writeJson(res, response);
        });
};
