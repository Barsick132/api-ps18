const FILE = './requests/UserReq.js';
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
        input_role_arr.forEach(i => {
            return item === i;
        });
    });
};

/**
 *
 * Запросы к БД
 *
 */
exports.getPeplById = (knex, pepl_id) => {
    return knex.select().from(T.PEOPLE.NAME).where(T.PEOPLE.PEPL_ID, pepl_id);
};

exports.getPeplByLogin = (knex, pepl_login) => {
    return knex.select().from(T.PEOPLE.NAME).where(T.PEOPLE.PEPL_LOGIN, pepl_login);
};

exports.getConfParentAddressByID = (knex, pepl_id) => {
    return knex.select(T.PARENTS.PRNT_CITY, T.PARENTS.PRNT_STREET,
        T.PARENTS.PRNT_HOME, T.PARENTS.PRNT_FLAT)
        .from(T.PARENTS.NAME)
        .where(T.PARENTS.PRNT_ID, pepl_id)
        .andWhere(T.PARENTS.PRNT_CONFIRM, 1);
};

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

exports.getStudentByID = (knex, pepl_id) => {
    return knex.select().from(T.STUDENTS.NAME).where(T.STUDENTS.STD_ID, pepl_id);
};

exports.getEmployeeByID = (knex, pepl_id) => {
    return knex.column(T.EMPLOYEES.EMP_SKYPE, T.EMPLOYEES.EMP_DISCORD, T.EMPLOYEES.EMP_HANGOUTS, T.EMPLOYEES.EMP_VIBER,
        T.EMPLOYEES.EMP_VK, T.EMPLOYEES.EMP_DATE_ENROLLMENT)
        .select().from(T.EMPLOYEES.NAME).where(T.EMPLOYEES.EMP_ID, pepl_id);
};

exports.getUserToBeRec = (knex) => {
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
            'p.' + T.PEOPLE.PEPL_LAST_NAME)
        .column([
            'p.' + T.PEOPLE.PEPL_ID,
            'p.' + T.PEOPLE.PEPL_LOGIN,
            'p.' + T.PEOPLE.PEPL_SECOND_NAME,
            'p.' + T.PEOPLE.PEPL_FIRST_NAME,
            'p.' + T.PEOPLE.PEPL_LAST_NAME])
        .select()
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