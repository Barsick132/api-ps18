'use strict';


/**
 * Открытие/Закрытие доступа к тестам ученикам
 *
 * body Body_7 ID теста, ID студента и статус открытия доступа
 * returns inline_response_200_6
 **/
exports.accessTest = function(body) {
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
 * Добавить оффлайн тест
 *
 * body Body_4 Имя теста и файлы
 * returns inline_response_200_5
 **/
exports.addTest = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : {
    "tst_id" : 1
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


/**
 * Добавление результатов тестирований
 *
 * body Body_8 ID теста, ID студента и файлы с результатами
 * returns inline_response_200_8
 **/
exports.addTestResult = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : {
    "tr_id" : 1
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


/**
 * Изменение названия теста
 *
 * body Body_6 ID теста и его новое имя
 * returns inline_response_200_6
 **/
exports.changeTestName = function(body) {
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
 * Удаление теста с файлами
 *
 * body Body_5 ID теста
 * returns inline_response_200_6
 **/
exports.delTest = function(body) {
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
 * Удаление результатов тестирования вместе с фалами
 *
 * body Body_10 ID результата тестирования
 * returns inline_response_200_6
 **/
exports.delTestResult = function(body) {
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
 * Просмотр списка тестирований
 *
 * returns inline_response_200_7
 **/
exports.getTest = function() {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : [ {
    "tst_name" : "Тест по профорейнтации",
    "tst_online" : false,
    "tst_id" : 1
  }, {
    "tst_name" : "Тест по профорейнтации",
    "tst_online" : false,
    "tst_id" : 1
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
 * Поиск результатов тестирований по по тестам и ученикам
 *
 * body Body_9 ID теста и/или ID студента
 * returns inline_response_200_9
 **/
exports.getTestResult = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : [ {
    "tr_id" : 1
  }, {
    "tr_id" : 1
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

