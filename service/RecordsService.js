'use strict';


/**
 * Отмена записи
 *
 * body Body_14 ID записи
 * returns inline_response_200_6
 **/
exports.cancelRecord = function(body) {
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
 * Изменить тип записи и контакты
 *
 * body Body_17 ID записи и/или ID онлайн статуса и/или контактные данные
 * returns inline_response_200_6
 **/
exports.changeRecord = function(body) {
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
 * Получение записей за период или последние N с шагом F
 *
 * body Body_21 Либо получаем записи за период, либо фильтруем по количеству
 * returns inline_response_200_15
 **/
exports.getJournal = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : [ {
    "vst_problem" : "Угнетение учениками",
    "vst_name" : "Тарасов Семен Львович",
    "vst_id" : 1,
    "vst_consultant" : "Иванов Иван иванович",
    "vst_reason" : "Стресс",
    "vst_result" : "Стресс",
    "rec_id" : 7,
    "vst_age" : 13,
    "vst_dt" : "2019-03-03T11:00:00.000Z",
    "vst_gender" : true
  }, {
    "vst_problem" : "Угнетение учениками",
    "vst_name" : "Тарасов Семен Львович",
    "vst_id" : 1,
    "vst_consultant" : "Иванов Иван иванович",
    "vst_reason" : "Стресс",
    "vst_result" : "Стресс",
    "rec_id" : 7,
    "vst_age" : 13,
    "vst_dt" : "2019-03-03T11:00:00.000Z",
    "vst_gender" : true
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
 * Получение сведений об одной записи
 *
 * body Body_18 ID записи
 * returns inline_response_200_12
 **/
exports.getOneRecord = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : {
    "rec_time" : "12:00:00",
    "rec_online" : true,
    "wd_date" : "2019-03-03",
    "pepl_id" : 3,
    "cont_value" : "student132",
    "wd_duration" : 30,
    "emp_id" : 1,
    "cont_name" : "skype"
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
 * Получить зарегистрированные записи по рабочему дню
 *
 * body Body_19 ID рабочего дня
 * returns inline_response_200_13
 **/
exports.getRecordsFromWD = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : [ {
    "rec_time" : "12:00:00",
    "rec_online" : true,
    "wd_date" : "2019-03-03",
    "pepl_id" : 3,
    "cont_value" : "student132",
    "rec_id" : 9,
    "wd_duration" : 30,
    "emp_id" : 1,
    "cont_name" : "skype"
  }, {
    "rec_time" : "12:00:00",
    "rec_online" : true,
    "wd_date" : "2019-03-03",
    "pepl_id" : 3,
    "cont_value" : "student132",
    "rec_id" : 9,
    "wd_duration" : 30,
    "emp_id" : 1,
    "cont_name" : "skype"
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
 * Получение график работы пользователя с записями
 *
 * body Body_11 ID сотрудника
 * returns inline_response_200_10
 **/
exports.getUserGraphic = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : [ {
    "wd_date" : "2019-03-03",
    "wd_id" : 1,
    "rec_array" : [ {
      "rec_id" : 7,
      "rec_data" : {
        "rec_time" : "11:00:00",
        "rec_online" : true,
        "pepl_id" : 3,
        "rec_not_come" : false
      }
    }, {
      "rec_id" : 7,
      "rec_data" : {
        "rec_time" : "11:00:00",
        "rec_online" : true,
        "pepl_id" : 3,
        "rec_not_come" : false
      }
    } ],
    "wd_data" : {
      "wd_time_begin" : "8:00:00",
      "wd_break_begin" : "13:00:00",
      "wd_break_end" : "14:00:00",
      "wd_time_end" : "18:30:00",
      "wd_duration" : 30
    }
  }, {
    "wd_date" : "2019-03-03",
    "wd_id" : 1,
    "rec_array" : [ {
      "rec_id" : 7,
      "rec_data" : {
        "rec_time" : "11:00:00",
        "rec_online" : true,
        "pepl_id" : 3,
        "rec_not_come" : false
      }
    }, {
      "rec_id" : 7,
      "rec_data" : {
        "rec_time" : "11:00:00",
        "rec_online" : true,
        "pepl_id" : 3,
        "rec_not_come" : false
      }
    } ],
    "wd_data" : {
      "wd_time_begin" : "8:00:00",
      "wd_break_begin" : "13:00:00",
      "wd_break_end" : "14:00:00",
      "wd_time_end" : "18:30:00",
      "wd_duration" : 30
    }
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
 * Перенос записи на другое время или день
 *
 * body Body_16 ID записи и ID записи на которую переносим
 * returns inline_response_200_12
 **/
exports.moveRecord = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : {
    "rec_time" : "12:00:00",
    "rec_online" : true,
    "wd_date" : "2019-03-03",
    "pepl_id" : 3,
    "cont_value" : "student132",
    "wd_duration" : 30,
    "emp_id" : 1,
    "cont_name" : "skype"
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
 * Добавление/Удаление/Изменение записей в журнал посещений
 *
 * body Body_20 Массив ID записей в журнале (визитов), которые нужно удалить и/или массив визитов, которые нужно добавить, и/или массив визитов, которые нужно отредактировать
 * returns inline_response_200_14
 **/
exports.setJournal = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : {
    "vst_arr_upd" : [ {
      "vst_status" : "OK",
      "vst_id" : 1
    }, {
      "vst_status" : "OK",
      "vst_id" : 1
    } ],
    "vst_arr_del" : [ {
      "vst_status" : "OK",
      "vst_id" : 1
    }, {
      "vst_status" : "OK",
      "vst_id" : 1
    } ],
    "vst_arr_add" : [ {
      "vst_data" : {
        "vst_dt" : "2019-03-03T11:00:00.000Z"
      },
      "vst_status" : "OK",
      "rec_data" : {
        "rec_id" : 7
      }
    }, {
      "vst_data" : {
        "vst_dt" : "2019-03-03T11:00:00.000Z"
      },
      "vst_status" : "OK",
      "rec_data" : {
        "rec_id" : 7
      }
    } ]
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
 * Записаться на прием к сотруднику
 *
 * body Body_13 ID человека, ID записи, статус Онлайн, способ связи, личный контакт
 * returns inline_response_200_12
 **/
exports.setToRecord = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : {
    "rec_time" : "12:00:00",
    "rec_online" : true,
    "wd_date" : "2019-03-03",
    "pepl_id" : 3,
    "cont_value" : "student132",
    "wd_duration" : 30,
    "emp_id" : 1,
    "cont_name" : "skype"
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
 * Установка график работы пользователя
 *
 * body Body_12 ID сотрудника, массивы удаляемых и/или добавляемых и/или обновляемых рабочих дней
 * returns inline_response_200_11
 **/
exports.setUserGraphic = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "payload" : {
    "wd_arr_add" : [ {
      "wd_date" : "2019-03-03",
      "wd_status" : "OK"
    }, {
      "wd_date" : "2019-03-03",
      "wd_status" : "OK"
    } ],
    "wd_arr_del" : [ {
      "wd_id" : 1,
      "wd_status" : "OK"
    }, {
      "wd_id" : 1,
      "wd_status" : "OK"
    } ],
    "wd_arr_upd" : [ {
      "wd_id" : 1,
      "wd_status" : "OK"
    }, {
      "wd_id" : 1,
      "wd_status" : "OK"
    } ]
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
 * Отметить, что клиент не явился по записи
 *
 * body Body_15 ID записи
 * returns inline_response_200_6
 **/
exports.skipRecord = function(body) {
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

