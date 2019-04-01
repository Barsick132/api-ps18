'use strict';


/**
 * Добавление файлов тестов/рез-ов тестирований/ИПК
 *
 * body Body_2 Либо ID студента, либо ID рез. тестирования, либо ID самого тестирования и файлы
 * returns inline_response_200_2
 **/
exports.addFiles = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : [ {
    "file_name" : "Тест по профорейнтации",
    "file_id" : 3
  }, {
    "file_name" : "Тест по профорейнтации",
    "file_id" : 3
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
 * Удаление файлов тестов и/или рез-ов тестирований и/или ИПК
 *
 * body List Массив ID файлов
 * returns inline_response_200_4
 **/
exports.delFiles = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : [ {
    "file_del_status" : true,
    "file_id" : 3
  }, {
    "file_del_status" : true,
    "file_id" : 3
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
 * Скачивание файлов
 *
 * body List Массив ID файлов
 * returns inline_response_200
 **/
exports.downloadFiles = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Получение информации о файлах тестов/рез-ов тестирований/ИПК
 *
 * body Body_1 Либо ID студента, либо ID рез. тестирования, либо ID самого тестирования
 * returns inline_response_200_1
 **/
exports.getFiles = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : [ {
    "file_path" : "/folder1",
    "file_name" : "Тест по профорейнтации",
    "file_id" : 3,
    "file_dt" : "2019-03-04T09:35:00.000Z"
  }, {
    "file_path" : "/folder1",
    "file_name" : "Тест по профорейнтации",
    "file_id" : 3,
    "file_dt" : "2019-03-04T09:35:00.000Z"
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
 * Изменение файлов тестов и/или рез-ов тестирований и/или ИПК
 *
 * body Body_3 ID файла, его имя и путь
 * returns inline_response_200_3
 **/
exports.updFiles = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : {
    "file_path" : "/folder1",
    "file_name" : "Тест по профорейнтации",
    "file_id" : 3,
    "file_dt" : "2019-03-04T09:35:00.000Z"
  },
  "status" : "OK"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

