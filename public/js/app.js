const url = "https://api-ps18.herokuapp.com/";//"http://192.168.0.100/"//

// Вход пользователя
function login(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'login', {
      headers: { "Authorization": inData },
      method: 'POST'
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error("Неверные учетные данные. Попробуйте еще раз"));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Регистрация родителя
function signup(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'signup', {
      headers: { 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } if (data.status == "LOGIN_BUSY") {
          fail(new Error("Пользователь с указанным логином уже зарегистрирован"));
        } else {
          fail(new Error("Неверные данные. Попробуйте еще раз"));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Получение списка ролей
function getRoles() {
  return new Promise(function (succeed, fail) {
    fetch(url + 'getRoles', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST'
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error("Данные неверны. Попробуйте еще раз"));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Регистрация сотрудника
function singupEmployee(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'signup', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error("Неверные данные. Попробуйте еще раз"));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Регистрация ученика
function singupStudent(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'signup', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error("Неверные данные. Попробуйте еще раз"));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Получение списка учиников
function getStudents(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'getStudents', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error("Неверные данные. Попробуйте еще раз"));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Получение списка родителей
function getParents(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'getParents', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error("Неверные данные. Попробуйте еще раз"));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Получение списка учителей
function getTeachers(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'getTeachers', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error("Неверные данные. Попробуйте еще раз"));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Получение списка сотрудников
function getEmployees(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'getEmployees', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error("Неверные данные. Попробуйте еще раз"));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Получение заявок от родителей
function getListConfirmReg() {
  return new Promise(function (succeed, fail) {
    fetch(url + 'getListConfirmReg', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST'
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK" || data.status == "NOT_FOUND_PARENTS_ON_CONF") {
          succeed(data);
        } else {
          
          fail(new Error("Данные неверны. Попробуйте еще раз"));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Отклонение и одобрение заявок
function confirmParentReg(id, choice, children) {
  return new Promise(function (succeed, fail) {
    var body = choice == 1 ? {
      prnt_id: id,
      prnt_confirm: choice,
      std_id_arr: children
    } : {
        prnt_id: id,
        prnt_confirm: choice
      };
    fetch(url + 'confirmParentReg', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(body)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error("Данные неверны. Попробуйте еще раз"));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Получение личных данных пользоавтеля
function getPersonalData() {
  return new Promise(function (succeed, fail) {
    fetch(url + 'getPersonalData', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST'
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error("Данные неверны. Попробуйте еще раз"));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Изменение личных данных пользоавтеля
function updPersonalData(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'updPersonalData', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error(data.status));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};



// Получение списка сотрудников доступных для записи (ALL)
function getPersonsToBeRec() {
  return new Promise(function (succeed, fail) {
    fetch(url + 'getPersonsToBeRec', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST'
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error(data.status));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Получение графика работы сотрудника с записями (ALL)
function getEmpGraphic(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'getEmpGraphic', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error(data.status));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Записаться на прием к сотруднику (ALL)
function setToRecord(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'setToRecord', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error(data.status));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Добавление теста
function addTest(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'addTest', {
      headers: { 'Authorization': localStorage.getItem('token') },
      method: 'POST',
      body: inData
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error(data.status));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Просмотр списка тестирований
function getTests() {
  return new Promise(function (succeed, fail) {
    fetch(url + 'getTests', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST'
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error(data.status));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};


// Переименование теста
function changeTestName(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'changeTestName', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error(data.status));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Удаление теста
function delTest(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'delTest', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error(data.status));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Получение собственные записи (актуальные или историю) (ALL)

function getPersonalRecords(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'getPersonalRecords', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        succeed(
          {
            "status": "OK",
            "payload": [
              {
                "wd_id": 1,
                "wd_date": "2019-03-03",
                "rec_array": [
                  {
                    "rec_id": 7,
                    "emp_fullname": "Иванов Иван Иванович",
                    "rec_data": {
                      "pepl_id": 3,
                      "rec_time": "11:00:00",
                      "rec_online": true,
                      "rec_not_come": false,
                      "cont_name": "skype",
                      "cont_value": "student132"
                    }
                  }
                ]
              }
            ]
          }
        );
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error(data.status));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Получение записей за период или последние N с шагом F (Psychologist)
function getJournal(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'getJournal', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error(data.status));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};

// Получение записей за период или последние N с шагом F (Psychologist)
function setJournal(inData) {
  return new Promise(function (succeed, fail) {
    fetch(url + 'setJournal', {
      headers: { 'Authorization': localStorage.getItem('token'), 'Content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(inData)
    })
      .then(function (response) {
        if (response.status == 200)
          return response.json();
        else { fail(new Error(response.statusText)); return response; }
      })
      .then(function (data) {
        if (data.status == "OK") {
          succeed(data);
        } else {
          
          fail(new Error(data.status));
        }
      })
    //.catch(fail(new Error(alert)));
  });
};