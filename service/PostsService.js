'use strict';


/**
 * Добавить должности сотруднику
 *
 * body Body_34 ID сотрудника и список ID должностей
 * returns inline_response_200_6
 **/
exports.addEmpPosts = function(body) {
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
 * Добавить должности
 *
 * body List Список должностей
 * returns inline_response_200_6
 **/
exports.addPost = function(body) {
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
 * Удалить должности сотрудника
 *
 * body Body_35 ID сотрудника и список ID должностей
 * returns inline_response_200_6
 **/
exports.delEmpPosts = function(body) {
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
 * Удалить должности
 *
 * body List Список ID должностей
 * returns inline_response_200_6
 **/
exports.delPost = function(body) {
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
 * Получить список должностей
 *
 * returns inline_response_200_27
 **/
exports.getAllPosts = function() {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : [ {
    "pst_id" : 1,
    "pst_name" : "Педагог-психолог",
    "pst_description" : "pst_description"
  }, {
    "pst_id" : 1,
    "pst_name" : "Педагог-психолог",
    "pst_description" : "pst_description"
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
 * Получить список должностей сотрудника
 *
 * body Body_33 ID сотрудника
 * returns inline_response_200_27
 **/
exports.getEmpPosts = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : [ {
    "pst_id" : 1,
    "pst_name" : "Педагог-психолог",
    "pst_description" : "pst_description"
  }, {
    "pst_id" : 1,
    "pst_name" : "Педагог-психолог",
    "pst_description" : "pst_description"
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

