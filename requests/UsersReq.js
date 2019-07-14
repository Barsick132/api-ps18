const FILE = './requests/UsersReq.js';
const ROLE = require('../constants').ROLE;
const T = require('../constants').TABLES;

/**
 *
 * Полезные функции
 *
 */

// Функция подсчета параллели
exports.getParallel = function getParallel(date_receipt, stayed_two_year, date_issue) {
    let last_date = new Date();
    let parallel;

    if (last_date >= date_issue) {
        // Выпустился
        last_date = date_issue;
    }

    parallel = last_date.getFullYear() - date_receipt.getFullYear();
    if (last_date.getMonth() >= 8) {
        parallel += 1;
    }
    parallel -= stayed_two_year;

    if (parallel > 11) parallel = 11;
    if (parallel < 1) parallel = 1;

    return parallel;
};

// Функция проверки роли в массиве ролей или
// функция проверки вхождения элемента в массив
exports.checkRole = function (role_arr, role_name) {
    return role_arr.some(item => item === role_name);
};

// Функция проверки хотя бы одной роли в массиве ролей или
// функция проверки вхождения элементов в массив
exports.checkRoles = function (role_arr, input_role_arr) {
    return role_arr.some(item => {
        return input_role_arr.some(i => item === i);
    });
};


/**
 *
 * Запросы к БД
 *
 */

// Получить информацию человека по ID
exports.getPeplById = (knex, pepl_id) => {
    return knex.select().from(T.PEOPLE.NAME).where(T.PEOPLE.PEPL_ID, pepl_id);
};

// Получить информацию человека по логину
exports.getPeplByLogin = (knex, pepl_login) => {
    return knex.select().from(T.PEOPLE.NAME).where(T.PEOPLE.PEPL_LOGIN, pepl_login);
};

// Получить информацию родителя, если его регистрация была продтверждена
exports.getConfParentAddressByID = (knex, pepl_id) => {
    return knex.select(T.PARENTS.PRNT_CITY, T.PARENTS.PRNT_STREET,
        T.PARENTS.PRNT_HOME, T.PARENTS.PRNT_FLAT)
        .from(T.PARENTS.NAME)
        .where(T.PARENTS.PRNT_ID, pepl_id)
        .andWhere(T.PARENTS.PRNT_CONFIRM, 1);
};

// Получить значение подтверждения регистрации родителя по ID
exports.getConfParentById = (knex, prnt_id) => {
    return knex(T.PARENTS.NAME)
        .columns(T.PARENTS.PRNT_CONFIRM)
        .select()
        .where(T.PARENTS.PRNT_ID, prnt_id);
};

// Список запросов на регистрацию
exports.getOnConfParents = (knex) => {
    return knex({pepl: T.PEOPLE.NAME, prnt: T.PARENTS.NAME})
        .select()
        .whereRaw('?? = ??', [T.PEOPLE.PEPL_ID, T.PARENTS.PRNT_ID])
        .where(T.PARENTS.PRNT_CONFIRM, 0);
};

// Получить данные родителя по ID
exports.getParentById = (knex, pepl_id) => {
    return knex(T.PARENTS.NAME)
        .select()
        .where(T.PARENTS.PRNT_ID, pepl_id);
};

// Вернуть полную информацию о детях родителя
exports.getChildrensPepl = (knex, pepl_id) => {
    const METHOD = 'getChildrensPepl';
    console.log(FILE, METHOD);

    let childrens;

    return new Promise((resolve, reject) => {
        return knex.select().from(T.PEOPLE.NAME).whereIn(T.PEOPLE.PEPL_ID, function () {
            this.column(T.STD_PRNT.STD_ID).select().from(T.STD_PRNT.NAME).where(T.STD_PRNT.PRNT_ID, pepl_id)
        })
            .then((res) => {
                if (!res || !res.length) {
                    return;
                }
                if (res.length === 0) resolve([]);

                console.log('Getted People Data Childrens');
                childrens = res;
                const childrensIds = childrens.map(item => {
                    return item.pepl_id;
                });
                return knex.select().from(T.STUDENTS.NAME).whereIn(T.STUDENTS.STD_ID, childrensIds);
            })
            .then((res) => {
                if (!res || !res.length || res.length !== childrens.length) return;

                console.log('Getted Additional Data Childrens');
                childrens = childrens.map(pepl => {
                    pepl.std_data = res.filter(std => pepl.pepl_id === std.std_id)[0];

                    return {
                        pepl_id: pepl.pepl_id,
                        pepl_login: pepl.pepl_login,
                        pepl_data: {
                            pepl_second_name: pepl.pepl_second_name,
                            pepl_first_name: pepl.pepl_first_name,
                            pepl_last_name: pepl.pepl_last_name,
                            pepl_gender: pepl.pepl_gender,
                            pepl_birthday: pepl.pepl_birthday,
                            pepl_phone: pepl.pepl_phone,
                            pepl_email: pepl.pepl_email
                        },
                        std_data: {
                            std_class: this.getParallel(
                                pepl.std_data.std_date_receipt,
                                pepl.std_data.std_stayed_two_year,
                                pepl.std_data.std_date_issue) + pepl.std_data.std_class_letter,
                            std_stayed_two_year: pepl.std_data.std_stayed_two_year,
                            std_date_issue: pepl.std_data.std_date_issue
                        }
                    };
                });

                resolve(childrens);
            })
            .catch((err) => {
                reject(err);
            })
    })
};

// Проверить принадлежность ученика родитенлю
exports.checkChildrensId = (knex, prnt_id, std_id) => {
    return knex(T.STD_PRNT.NAME)
        .select()
        .where(T.STD_PRNT.STD_ID, std_id)
        .andWhere(T.STD_PRNT.PRNT_ID, prnt_id);
};

// Получить информацию ученика по ID
exports.getStudentByID = (knex, pepl_id) => {
    return knex.select().from(T.STUDENTS.NAME).where(T.STUDENTS.STD_ID, pepl_id);
};

// Поиск учеников с фильтрацией
exports.getStudents = (knex, data, std_parallel, std_graduated) => {
    if (std_parallel && std_graduated !== undefined)
        return knex({p: T.PEOPLE.NAME, s: T.STUDENTS.NAME})
            .select()
            .where(knex.raw('?? = ' +
                'case when ? then ' +
                    'case when ?? < current_date then ' +
                        'case when extract(month from ??) < 9 then ' +
                            'extract(year from ??) - extract(year from ??) - ?? else ' +
                            'extract (year from ??) - extract(year from ??) - ?? + 1 ' +
                        'end ' +
                    'end ' +
                'else ' +
                    'case when ?? >= current_date then ' +
                        'case when extract(month from current_date) < 9 then ' +
                            'extract(year from current_date) - extract(year from ??) - ?? else ' +
                            'extract (year from current_date) - extract(year from ??) - ?? + 1 ' +
                        'end ' +
                    'end ' +
                'end',
                [std_parallel, std_graduated, 's.' + T.STUDENTS.STD_DATE_ISSUE, 's.' + T.STUDENTS.STD_DATE_ISSUE,
                    's.' + T.STUDENTS.STD_DATE_ISSUE, 's.' + T.STUDENTS.STD_DATE_RECEIPT,
                    's.' + T.STUDENTS.STD_STAYED_TWO_YEAR, 's.' + T.STUDENTS.STD_DATE_ISSUE,
                    's.' + T.STUDENTS.STD_DATE_RECEIPT, 's.' + T.STUDENTS.STD_STAYED_TWO_YEAR,
                    's.' + T.STUDENTS.STD_DATE_ISSUE,
                    's.' + T.STUDENTS.STD_DATE_RECEIPT, 's.' + T.STUDENTS.STD_STAYED_TWO_YEAR,
                    's.' + T.STUDENTS.STD_DATE_RECEIPT, 's.' + T.STUDENTS.STD_STAYED_TWO_YEAR]))
            .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 's.' + T.STUDENTS.STD_ID])
            .where(data);
    else
        return knex({p: T.PEOPLE.NAME, s: T.STUDENTS.NAME})
            .select()
            .whereRaw('?? ' + (std_graduated ? '<' : '>=') + ' current_date', [T.STUDENTS.STD_DATE_ISSUE])
            .andWhereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 's.' + T.STUDENTS.STD_ID])
            .where(data);
};

// Поиск сотрудников с фильтрацией
exports.getEmployees = (knex, data, role_arr, pst_arr) => {
    if (role_arr !== undefined && pst_arr !== undefined) {
        return knex({p: T.PEOPLE.NAME, e: T.EMPLOYEES.NAME, ep: T.EMP_PST.NAME, r: T.ROLE.NAME})
            .distinct('p.*', 'e.*')
            .select('p.*', 'e.*')
            .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'e.' + T.EMPLOYEES.EMP_ID])
            .whereRaw('?? = ??', ['e.' + T.EMPLOYEES.EMP_ID, 'ep.' + T.EMP_PST.EMP_ID])
            .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'r.' + T.ROLE.PEPL_ID])
            .whereIn('ep.' + T.EMP_PST.PST_ID, pst_arr)
            .whereIn('r.' + T.ROLE.ROLE_NAME, role_arr)
            .where(data);
    } else {
        if (role_arr !== undefined) {
            return knex({p: T.PEOPLE.NAME, e: T.EMPLOYEES.NAME, ep: T.EMP_PST.NAME, r: T.ROLE.NAME})
                .distinct('p.*', 'e.*')
                .select('p.*', 'e.*')
                .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'e.' + T.EMPLOYEES.EMP_ID])
                .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'r.' + T.ROLE.PEPL_ID])
                .whereIn('r.' + T.ROLE.ROLE_NAME, role_arr)
                .where(data);
        }
        if (pst_arr !== undefined) {
            return knex({p: T.PEOPLE.NAME, e: T.EMPLOYEES.NAME, ep: T.EMP_PST.NAME, r: T.ROLE.NAME})
                .distinct('p.*', 'e.*')
                .select('p.*', 'e.*')
                .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'e.' + T.EMPLOYEES.EMP_ID])
                .whereRaw('?? = ??', ['e.' + T.EMPLOYEES.EMP_ID, 'ep.' + T.EMP_PST.EMP_ID])
                .whereIn('ep.' + T.EMP_PST.PST_ID, pst_arr)
                .where(data);
        }
        if (role_arr === undefined && pst_arr === undefined) {
            return knex({p: T.PEOPLE.NAME, e: T.EMPLOYEES.NAME})
                .distinct('p.*', 'e.*')
                .select('p.*', 'e.*')
                .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'e.' + T.EMPLOYEES.EMP_ID])
                .where(data);
        }
    }
};

// Поиск родителей с фильтрацией
exports.getParents = (knex, data, std_id) => {
    if (std_id) {
        return knex({p: T.PEOPLE.NAME, prnt: T.PARENTS.NAME, sp: T.STD_PRNT.NAME})
            .distinct('p.*', 'prnt.*')
            .select('p.*', 'prnt.*')
            .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'prnt.' + T.PARENTS.PRNT_ID])
            .whereRaw('?? = ??', ['prnt.' + T.PARENTS.PRNT_ID, 'sp.' + T.STD_PRNT.PRNT_ID])
            .whereRaw('?? = ?', ['sp.' + T.STD_PRNT.STD_ID, std_id])
            .where(data);
    } else {
        return knex({p: T.PEOPLE.NAME, prnt: T.PARENTS.NAME})
            .distinct('p.*', 'prnt.*')
            .select('p.*', 'prnt.*')
            .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'prnt.' + T.PARENTS.PRNT_ID])
            .where(data);
    }
};

// Получить информацию сотрудника по ID
exports.getEmployeeByID = (knex, pepl_id) => {
    return knex.column(T.EMPLOYEES.EMP_SKYPE, T.EMPLOYEES.EMP_DISCORD, T.EMPLOYEES.EMP_HANGOUTS, T.EMPLOYEES.EMP_VIBER,
        T.EMPLOYEES.EMP_VK, T.EMPLOYEES.EMP_DATE_ENROLLMENT)
        .select().from(T.EMPLOYEES.NAME).where(T.EMPLOYEES.EMP_ID, pepl_id);
};

// Обновление данных People и/или Employee или Parent
exports.updPersonalData = (knex, pepl_id, role, pepl_data, addit_data) => {
    return new Promise((resolve, reject) => {
        const STATUS = {
            INFO_NOT_UPDATEABLE: 'INFO_NOT_UPDATEABLE',
            NOT_FOUND_UPDATED_DATA: 'NOT_FOUND_UPDATED_DATA',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        let result = {};

        knex.transaction((trx) => {
            const updPeople = () => {
                return new Promise(((resolve) => {
                    if (Object.keys(pepl_data).length !== 0) {
                        return knex(T.PEOPLE.NAME)
                            .transacting(trx)
                            .where(T.PEOPLE.PEPL_ID, pepl_id)
                            .update(pepl_data)
                            .returning('*')
                            .then((res) => resolve(res));
                    }

                    resolve(undefined);
                }))
            };

            return updPeople()
                .then((res) => {
                    const updAdditData = () => {
                        switch (role) {
                            case ROLE.EMPLOYEE: {
                                return knex(T.EMPLOYEES.NAME)
                                    .transacting(trx)
                                    .where(T.EMPLOYEES.EMP_ID, pepl_id)
                                    .update(addit_data)
                                    .returning('*');
                            }
                            case ROLE.PARENT: {
                                return knex(T.PARENTS.NAME)
                                    .transacting(trx)
                                    .where(T.PARENTS.PRNT_ID, pepl_id)
                                    .update(addit_data)
                                    .returning('*');
                            }
                        }
                    };

                    if (res === undefined) {
                        if (!addit_data || Object.keys(addit_data).length === 0) {
                            throw new Error(STATUS.INFO_NOT_UPDATEABLE)
                        }
                        return updAdditData();
                    }

                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_FOUND_UPDATED_DATA);
                    }
                    console.log('Updated Data People');
                    result.pepl_data = res[0];

                    if (role === ROLE.STUDENT ||
                        (!addit_data || Object.keys(addit_data).length === 0)) {
                        resolve(result);
                        return;
                    }

                    return updAdditData();
                })
                .then((res) => {
                    if (res === undefined) return;
                    if (res.length === 0) {
                        throw new Error(STATUS.NOT_FOUND_UPDATED_DATA);
                    }
                    console.log('Updated Additional Data');

                    if (role === ROLE.EMPLOYEE) {
                        result.emp_data = res[0];
                    }
                    if (role === ROLE.PARENT) {
                        result.prnt_data = res[0];
                    }

                    resolve(result);
                })
                .then(() => {
                    trx.commit();
                })
                .catch((err) => {
                    if (err.message === STATUS.NOT_FOUND_UPDATED_DATA ||
                        err.message === STATUS.INFO_NOT_UPDATEABLE)
                        result = {status: err.message};
                    else
                        result = {status: STATUS.UNKNOWN_ERROR};
                    resolve(result);

                    trx.rollback(err);
                });
        });
    });
};

// Получить список сотрудников, доступных для записи
exports.getEmpToBeRec = (knex) => {
    const dt = new Date();

    const getUTCDate = (dt) => {
        return dt.getUTCFullYear() + '.' + (dt.getUTCMonth() + 1) + '.' + dt.getUTCDate()
    };
    const getUTCTime = (dt) => {
        return dt.getUTCHours() + ':' + dt.getUTCMinutes() + ':' + dt.getUTCSeconds()
    };

    return knex({p: T.PEOPLE.NAME, e: T.EMPLOYEES.NAME, wd: T.WORKING_DAYS.NAME, rec: T.RECORDS.NAME})
        .distinct(
            'p.' + T.PEOPLE.PEPL_ID,
            'p.' + T.PEOPLE.PEPL_LOGIN,
            'p.' + T.PEOPLE.PEPL_SECOND_NAME,
            'p.' + T.PEOPLE.PEPL_FIRST_NAME,
            'p.' + T.PEOPLE.PEPL_LAST_NAME,
            'p.' + T.PEOPLE.PEPL_PHONE, 'e.*')
        .select('p.' + T.PEOPLE.PEPL_ID,
            'p.' + T.PEOPLE.PEPL_LOGIN,
            'p.' + T.PEOPLE.PEPL_SECOND_NAME,
            'p.' + T.PEOPLE.PEPL_FIRST_NAME,
            'p.' + T.PEOPLE.PEPL_LAST_NAME,
            'p.' + T.PEOPLE.PEPL_PHONE, 'e.*')
        .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'e.' + T.EMPLOYEES.EMP_ID])
        .andWhereRaw('?? = ??', ['e.' + T.EMPLOYEES.EMP_ID, 'wd.' + T.WORKING_DAYS.EMP_ID])
        .andWhereRaw('?? = ??', ['wd.' + T.WORKING_DAYS.WD_ID, 'rec.' + T.RECORDS.WD_ID])
        .andWhere(function () {
            this.where('wd.' + T.WORKING_DAYS.WD_DATE, getUTCDate(dt))
                .andWhere('rec.' + T.RECORDS.REC_TIME, '>', getUTCTime(dt))
                .orWhere('wd.' + T.WORKING_DAYS.WD_DATE, '>', getUTCDate(dt));
        })
        .andWhere('rec.' + T.RECORDS.PEPL_ID, null);
};

// Получить список сотрудников с ролью Teacher
exports.getTeachers = (knex) => {
    return knex({p: T.PEOPLE.NAME, e: T.EMPLOYEES.NAME, r: T.ROLE.NAME})
        .select()
        .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'e.' + T.EMPLOYEES.EMP_ID])
        .andWhereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'r.' + T.ROLE.PEPL_ID])
        .andWhere('r.' + T.ROLE.ROLE_NAME, ROLE.TEACHER);
};

// Получить классного руководителя студента
exports.getClassTeacher = (knex, std_id) => {
    return knex({s: T.STUDENTS.NAME, p: T.PEOPLE.NAME, e: T.EMPLOYEES.NAME})
        .select()
        .where('s.' + T.STUDENTS.STD_ID, std_id)
        .whereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 's.' + T.STUDENTS.EMP_ID])
        .andWhereRaw('?? = ??', ['p.' + T.PEOPLE.PEPL_ID, 'e.' + T.EMPLOYEES.EMP_ID]);
};

// Получить классы, которые ведет учитель
exports.getTeacherClasses = (knex, pepl_id) => {
    return knex
        .distinct([
            T.STUDENTS.STD_DATE_RECEIPT,
            T.STUDENTS.STD_STAYED_TWO_YEAR, T.STUDENTS.STD_CLASS_LETTER,
            T.STUDENTS.STD_DATE_ISSUE])
        .columns([T.STUDENTS.STD_DATE_RECEIPT,
            T.STUDENTS.STD_STAYED_TWO_YEAR, T.STUDENTS.STD_CLASS_LETTER,
            T.STUDENTS.STD_DATE_ISSUE])
        .select()
        .from(T.STUDENTS.NAME)
        .where(T.STUDENTS.EMP_ID, pepl_id);
};

// Получить классы, которые ведут учителя
exports.getTeachersClasses = (knex, pepl_id_arr) => {
    return knex
        .distinct([
            T.STUDENTS.EMP_ID, T.STUDENTS.STD_DATE_RECEIPT,
            T.STUDENTS.STD_STAYED_TWO_YEAR, T.STUDENTS.STD_CLASS_LETTER,
            T.STUDENTS.STD_DATE_ISSUE])
        .columns([T.STUDENTS.EMP_ID, T.STUDENTS.STD_DATE_RECEIPT,
            T.STUDENTS.STD_STAYED_TWO_YEAR, T.STUDENTS.STD_CLASS_LETTER,
            T.STUDENTS.STD_DATE_ISSUE])
        .select()
        .from(T.STUDENTS.NAME)
        .whereIn(T.STUDENTS.EMP_ID, pepl_id_arr);
};