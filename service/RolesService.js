'use strict';


/**
 * Добавить роли пользователю
 *
 * body Body_31 ID пользователя и список ID ролей
 * returns inline_response_200_6
 **/
exports.addUserRoles = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "status" : "OK"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Удалить роли у пользователя
 *
 * body Body_32 ID пользователя и список ID ролей
 * returns inline_response_200_6
 **/
exports.delUserRoles = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "status" : "OK"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Получение списка ролей
 *
 * returns inline_response_200_25
 **/
exports.getRoles = function() {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "role_array" : [ {
    "role_name" : "Admin",
    "role_id" : 1
  }, {
    "role_name" : "Admin",
    "role_id" : 1
  } ],
  "status" : "OK"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Получить список ролей пользователя
 *
 * body Body_30 ID пользователя
 * returns inline_response_200_26
 **/
exports.getUserRoles = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : [ {
    "role_name" : "Admin",
    "role_id" : 1
  }, {
    "role_name" : "Admin",
    "role_id" : 1
  } ],
  "status" : "OK"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

