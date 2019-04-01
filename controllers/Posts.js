'use strict';

var utils = require('../utils/writer.js');
var Posts = require('../service/PostsService');

module.exports.addEmpPosts = function addEmpPosts (req, res, next) {
  var body = req.swagger.params['body'].value;
  Posts.addEmpPosts(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.addPost = function addPost (req, res, next) {
  var body = req.swagger.params['body'].value;
  Posts.addPost(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.delEmpPosts = function delEmpPosts (req, res, next) {
  var body = req.swagger.params['body'].value;
  Posts.delEmpPosts(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.delPost = function delPost (req, res, next) {
  var body = req.swagger.params['body'].value;
  Posts.delPost(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAllPosts = function getAllPosts (req, res, next) {
  Posts.getAllPosts()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getEmpPosts = function getEmpPosts (req, res, next) {
  var body = req.swagger.params['body'].value;
  Posts.getEmpPosts(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
