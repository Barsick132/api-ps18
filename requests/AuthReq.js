const T = require('../constants').TABLES;
const ROLE = require('../constants').ROLE;
const crypto = require('crypto');
const uniqid = require('uniqid');
const Promise = require('bluebird');

/**
 *
 *  Полезные функции
 *
 */

exports.encryptPassword = function encryptPassword(password, salt) {
    return crypto.createHmac('sha1', salt).update(password).digest('hex');
};

exports.getSaltAndHashPass = function getSaltAndHashPass(pass) {
    const salt = crypto.randomBytes(32).toString('base64');
    const hash_pass = crypto.createHmac('sha1', salt).update(pass).digest('hex');
    return {
        pepl_salt: salt,
        pepl_hash_pass: hash_pass
    }
};


/**
 *
 *  Методы для работы с БД
 *
 */

// Запрос всех подтверждений регистрации с проверками по ученикам, их классным руководителям и классам
exports.getConfsParentsById = (knex, prnt_id_arr) => {
    return knex
        .distinct()
        .select()
        .from(function () {
            this.select()
                .from({cr: T.CONFIRM_REG.NAME})
                .whereIn('cr.' + T.CONFIRM_REG.PRNT_ID, prnt_id_arr)
                .leftOuterJoin(function () {
                    this.select({
                        ch_second_name: 'p.' + T.PEOPLE.PEPL_SECOND_NAME,
                        ch_first_name: 'p.' + T.PEOPLE.PEPL_FIRST_NAME,
                        ch_last_name: 'p.' + T.PEOPLE.PEPL_LAST_NAME,
                        std_id: 's.' + T.STUDENTS.STD_ID,
                        std_emp_id: 's.' + T.STUDENTS.EMP_ID,
                        std_date_receipt: 's.' + T.STUDENTS.STD_DATE_RECEIPT,
                        std_stayed_two_year: 's.' + T.STUDENTS.STD_STAYED_TWO_YEAR,
                        std_class_letter: 's.' + T.STUDENTS.STD_CLASS_LETTER
                    })
                        .from({p: T.PEOPLE.NAME, s: T.STUDENTS.NAME, r: T.ROLE.NAME})
                        .whereRaw('?? = ?? and ?? = ?', ['r.' + T.ROLE.PEPL_ID, 'p.' + T.PEOPLE.PEPL_ID, 'r.' + T.ROLE.ROLE_NAME, ROLE.STUDENT])
                        .andWhereRaw('?? = ??', ['s.' + T.STUDENTS.STD_ID, 'p.' + T.PEOPLE.PEPL_ID])
                        .as('studs')
                }, function () {
                    this.on('cr.' + T.CONFIRM_REG.CR_SECOND_CHILD, 'studs.ch_second_name')
                        .andOn('cr.' + T.CONFIRM_REG.CR_FIRST_CHILD, 'studs.ch_first_name')
                        .andOn('cr.' + T.CONFIRM_REG.CR_LAST_CHILD, 'studs.ch_last_name')
                        .andOn(knex.raw('?? = case when extract(month from current_date) < 9 then ' +
                            'extract(year from current_date) - extract(year from ??) - ?? else ' +
                            'extract (year from current_date) - extract(year from ??) - ?? + 1 end ' +
                            '|| ??',
                            ['cr.' + T.CONFIRM_REG.CR_CLASS, 'studs.' + T.STUDENTS.STD_DATE_RECEIPT, 'studs.' + T.STUDENTS.STD_STAYED_TWO_YEAR,
                                'studs.' + T.STUDENTS.STD_DATE_RECEIPT, 'studs.' + T.STUDENTS.STD_STAYED_TWO_YEAR, 'studs.' + T.STUDENTS.STD_CLASS_LETTER]))
                })
                .as('child_pepl')
        })
        .leftOuterJoin(function () {
            this.select({
                emp_id: 'p.' + T.PEOPLE.PEPL_ID,
                tch_second_name: 'p.' + T.PEOPLE.PEPL_SECOND_NAME,
                tch_first_name: 'p.' + T.PEOPLE.PEPL_FIRST_NAME,
                tch_last_name: 'p.' + T.PEOPLE.PEPL_LAST_NAME
            })
                .from({p: T.PEOPLE.NAME, r: T.ROLE.NAME})
                .whereRaw('?? = ??', ['r.' + T.ROLE.PEPL_ID, 'p.' + T.PEOPLE.PEPL_ID])
                .andWhereRaw('?? = ?', ['r.' + T.ROLE.ROLE_NAME, ROLE.TEACHER])
                .as('teachs')
        }, function () {
            this.on('child_pepl.' + T.CONFIRM_REG.CR_SECOND_TEACHER, 'teachs.tch_second_name')
                .andOn('child_pepl.' + T.CONFIRM_REG.CR_FIRST_TEACHER, 'teachs.tch_first_name')
                .andOn('child_pepl.' + T.CONFIRM_REG.CR_LAST_TEACHER, 'teachs.tch_last_name')
                .andOn('child_pepl.std_emp_id', 'teachs.emp_id')
        });
};

exports.setConfirmParentReg = function (knex, body) {

    return new Promise((resolve, reject) => {
        const STATUS = {
            BAD_REQUEST: 'BAD_REQUEST',
            NOT_FOUND_ADDED_DATA: 'NOT_FOUND_ADDED_DATA',
            NOT_FOUND_UPDATED_PARENT: 'NOT_FOUND_UPDATED_PARENT',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
        };

        let result = {};

        if (body.prnt_confirm === 1 && body.std_id_arr !== undefined && body.std_id_arr.length !== 0) {
            const prnt_std_arr = body.std_id_arr.map(std_id => {
                return {
                    prnt_id: body.prnt_id,
                    std_id: std_id
                }
            });

            knex.transaction(function (trx) {
                return knex(T.STD_PRNT.NAME)
                    .transacting(trx)
                    .insert(prnt_std_arr)
                    .returning('*')
                    .then((res) => {
                        if (res.length === 0) {
                            throw new Error(STATUS.NOT_FOUND_ADDED_DATA);
                        }

                        console.log('Added ' + res.length + ' Records');
                        return knex(T.PARENTS.NAME)
                            .transacting(trx)
                            .update({prnt_confirm: 1})
                            .where(T.PARENTS.PRNT_ID, body.prnt_id)
                            .returning(T.PARENTS.PRNT_ID);
                    })
                    .then((res) => {
                        if (res.length === 0) {
                            throw new Error(STATUS.NOT_FOUND_UPDATED_PARENT);
                        }

                        console.log('Updated Parent');
                        resolve(res);
                        trx.commit();
                    })
                    .catch((err) => {
                        if (err.message === STATUS.NOT_FOUND_ADDED_DATA ||
                            err.message === STATUS.NOT_FOUND_UPDATED_PARENT)
                            result = {status: err.message};
                        else
                            result = {status: STATUS.UNKNOWN_ERROR};
                        resolve(result);

                        trx.rollback(err);
                    })
            })
        } else {
            if (body.prnt_confirm === 2) {
                return knex(T.PARENTS.NAME)
                    .update({prnt_confirm: 2})
                    .where(T.PARENTS.PRNT_ID, body.prnt_id)
                    .returning(T.PARENTS.PRNT_ID)
                    .then((res) => {
                        if (res.length === 0) {
                            throw new Error(STATUS.NOT_FOUND_UPDATED_PARENT);
                        }

                        console.log('Updated Parent');
                        resolve(res);
                    })
                    .catch((err) => {
                        if (err.message === STATUS.NOT_FOUND_UPDATED_PARENT)
                            result = {status: err.message};
                        else
                            result = {status: STATUS.UNKNOWN_ERROR};
                        resolve(result);
                    });
            } else {
                result = {status: STATUS.BAD_REQUEST};
                resolve(result);
            }
        }
    });
};

exports.insertPepl = function (knex, trx, pepl_data) {
    return knex(T.PEOPLE.NAME).transacting(trx).insert(pepl_data).returning([T.PEOPLE.PEPL_ID, T.PEOPLE.PEPL_LOGIN]);
};

exports.insertStd = function (knex, trx, std_data) {
    return knex(T.STUDENTS.NAME).transacting(trx).insert(std_data).returning(T.STUDENTS.STD_ID);
};

exports.insertEmp = function (knex, trx, emp_data) {
    return knex(T.EMPLOYEES.NAME).transacting(trx).insert(emp_data).returning(T.EMPLOYEES.EMP_ID);
};

exports.insertPrnt = function (knex, trx, prnt_data) {
    return knex(T.PARENTS.NAME).transacting(trx).insert(prnt_data).returning(T.PARENTS.PRNT_ID);
};

exports.insertConfirmReg = (knex, trx, prnt_id, cr_arr) => {
    cr_arr.forEach(item => {
        item.prnt_id = prnt_id;
    });
    return knex(T.CONFIRM_REG.NAME).transacting(trx).insert(cr_arr).returning(T.CONFIRM_REG.CR_ID);
};

exports.registerEmpAndStd = function (knex, EmpArr, StdArr) {
    const STATUS = {
        NOT_FOUND_ADDED_POSTS: 'NOT_FOUND_ADDED_POSTS',
        NOT_FOUND_ADDED_PEOPLE: 'NOT_FOUND_ADDED_PEOPLE',
        NOT_FOUND_ADDED_EMP: 'NOT_FOUND_ADDED_EMP',
        NOT_FOUND_ADDED_STD: 'NOT_FOUND_ADDED_STD',
        NOT_FOUND_ADDED_EMPLOYEES: 'NOT_FOUND_ADDED_EMPLOYEES',
        NOT_FOUND_ADDED_ROLE: 'NOT_FOUND_ADDED_ROLE',
        NOT_FOUND_ADDED_ROLE_STD: 'NOT_FOUND_ADDED_ROLE_STD',
        NOT_FOUND_ADDED_POSTS_FOR_EMP: 'NOT_FOUND_ADDED_POSTS_FOR_EMP',
        NOT_FOUND_TEACHER: 'NOT_FOUND_TEACHER',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };

    let result = {};

    return new Promise((resolve, reject) => {

        const getAccessData = (login) => {
            let data = {
                pepl_login: login,
                pepl_pass: uniqid.process(),
                pepl_salt: crypto.randomBytes(32).toString('base64')
            };
            data.pepl_hash_pass = crypto.createHmac('sha1', data.pepl_salt).update(data.pepl_pass).digest('hex');
            return data;
        };

        knex.transaction(trx => {

            return Promise.map(EmpArr, emp => {

                let assignedPst = [];
                let accessData = getAccessData(emp.pepl_login);
                let peplObj = {};
                let empObj = {};
                let roleObj = [];

                return new Promise((resolve, reject) => {
                    return knex(T.POSTS.NAME)
                        .select(T.POSTS.PST_ID, T.POSTS.PST_NAME)
                        .whereIn(T.POSTS.PST_NAME, emp.emp_posts)
                        .then(res => {
                            if (res.length !== 0) {
                                // Очищаем массив должностей, которые нужно добавить
                                for (let i = 0; i < emp.emp_posts.length; i++) {
                                    let pst_name = emp.emp_posts[i];
                                    if (res.some(res_pst => res_pst.pst_name === pst_name)) {
                                        emp.emp_posts.splice(i, 1);
                                        i--;
                                    }
                                }

                                assignedPst = res;

                                if (emp.emp_posts.length === 0) {
                                    // Пропускаем следующий шаг, так как все должности были найдены
                                    return null;
                                }
                            }
                            // Добавляем должности, которых не хватает
                            return knex(T.POSTS.NAME)
                                .transacting(trx)
                                .insert(emp.emp_posts.map(pst => {
                                    return {pst_name: pst}
                                }))
                                .returning([T.POSTS.PST_ID, T.POSTS.PST_NAME]);
                        })
                        .then(res => {
                            if (res !== null) {
                                if (res.length === 0) {
                                    throw new Error(STATUS.NOT_FOUND_ADDED_POSTS);
                                }

                                res.forEach(pst => {
                                    assignedPst.push(pst);
                                })
                            }

                            // Добавляемые должности и их ID получены.
                            // Регистрируем сотрудников
                            peplObj = {
                                pepl_login: emp.pepl_login,
                                pepl_hash_pass: accessData.pepl_hash_pass,
                                pepl_salt: accessData.pepl_salt,
                                pepl_second_name: emp.pepl_second_name,
                                pepl_first_name: emp.pepl_first_name,
                                pepl_last_name: emp.pepl_last_name,
                                pepl_gender: emp.pepl_gender,
                                pepl_birthday: emp.pepl_birthday
                            };

                            if (emp.pepl_phone !== undefined) {
                                peplObj.pepl_phone = emp.pepl_phone;
                            }
                            if (emp.pepl_email !== undefined) {
                                peplObj.pepl_email = emp.pepl_email;
                            }

                            return knex(T.PEOPLE.NAME)
                                .transacting(trx)
                                .insert(peplObj)
                                .returning([T.PEOPLE.PEPL_ID]);
                        })
                        .then(res => {
                            if (res.length === 0) {
                                throw new Error(STATUS.NOT_FOUND_ADDED_PEOPLE);
                            }

                            peplObj.pepl_id = res[0].pepl_id;

                            empObj.emp_id = res[0].pepl_id;
                            if (emp.emp_skype !== undefined) {
                                empObj.emp_skype = emp.emp_skype;
                            }
                            if (emp.emp_discord !== undefined) {
                                empObj.emp_discord = emp.emp_discord;
                            }
                            if (emp.emp_hangouts !== undefined) {
                                empObj.emp_hangouts = emp.emp_hangouts;
                            }
                            if (emp.emp_viber !== undefined) {
                                empObj.emp_viber = emp.emp_viber;
                            }
                            if (emp.emp_vk !== undefined) {
                                empObj.emp_vk = emp.emp_vk;
                            }
                            if (emp.emp_date_enrollment !== undefined) {
                                empObj.emp_date_enrollment = emp.emp_date_enrollment;
                            }

                            return knex(T.EMPLOYEES.NAME)
                                .transacting(trx)
                                .insert(empObj)
                                .returning('*');
                        })
                        .then(res => {
                            if (res.length === 0) {
                                throw new Error(STATUS.NOT_FOUND_ADDED_EMP);
                            }

                            // Добавлена запись в Employees
                            // Теперь добавим роли
                            roleObj = [{
                                pepl_id: peplObj.pepl_id,
                                role_name: ROLE.EMPLOYEE
                            }];
                            if (emp.emp_psychologist === true) {
                                roleObj.push({
                                    pepl_id: peplObj.pepl_id,
                                    role_name: ROLE.PSYCHOLOGIST
                                })
                            }
                            if (emp.emp_teacher === true) {
                                roleObj.push({
                                    pepl_id: peplObj.pepl_id,
                                    role_name: ROLE.TEACHER
                                })
                            }
                            return knex(T.ROLE.NAME)
                                .transacting(trx)
                                .insert(roleObj)
                                .returning(T.ROLE.ROLE_NAME);
                        })
                        .then(res => {
                            if (res.length === 0) {
                                throw new Error(STATUS.NOT_FOUND_ADDED_ROLE);
                            }

                            // Роли были добавлены
                            // Привязываем должности к данному сотруднику
                            return knex(T.EMP_PST.NAME)
                                .transacting(trx)
                                .insert(assignedPst.map(pst => {
                                    return {
                                        emp_id: peplObj.pepl_id,
                                        pst_id: pst.pst_id
                                    }
                                }))
                                .returning('*');
                        })
                        .then(res => {
                            if (res.length === 0) {
                                throw new Error(STATUS.NOT_FOUND_ADDED_POSTS_FOR_EMP);
                            }

                            // Должности привязаны
                            // Возвращаем результат добавления пользователя
                            resolve({
                                people: peplObj,
                                employee: empObj,
                                role: roleObj,
                                posts: assignedPst,
                                accessData: accessData
                            })
                        })
                        .catch(err => {
                            reject(err)
                        });
                })
            })
                .then(res => {
                    // Сотрудники были добавлены
                    result.emps = res;

                    return Promise.map(StdArr, std => {

                        let accessData = getAccessData(std.pepl_login);
                        let peplObj = {};
                        let stdObj = {};

                        return new Promise((resolve, rejcet) => {
                            peplObj = {
                                pepl_login: std.pepl_login,
                                pepl_hash_pass: accessData.pepl_hash_pass,
                                pepl_salt: accessData.pepl_salt,
                                pepl_second_name: std.pepl_second_name,
                                pepl_first_name: std.pepl_first_name,
                                pepl_last_name: std.pepl_last_name,
                                pepl_gender: std.pepl_gender,
                                pepl_birthday: std.pepl_birthday
                            };

                            if (std.pepl_phone !== undefined) {
                                peplObj.pepl_phone = std.pepl_phone;
                            }
                            if (std.pepl_email !== undefined) {
                                peplObj.pepl_email = std.pepl_email;
                            }

                            return knex(T.PEOPLE.NAME)
                                .transacting(trx)
                                .insert(peplObj)
                                .returning([T.PEOPLE.PEPL_ID])
                                .then(res => {
                                    if (res.length === 0) {
                                        throw new Error(STATUS.NOT_FOUND_ADDED_PEOPLE);
                                    }

                                    peplObj.pepl_id = res[0].pepl_id;

                                    stdObj.std_id = res[0].pepl_id;
                                    stdObj.std_date_receipt = std.std_class.std_date_receipt;
                                    stdObj.std_stayed_two_year = std.std_stayed_two_year;
                                    stdObj.std_class_letter = std.std_class.std_class_letter;
                                    stdObj.std_date_issue = std.std_class.std_date_issue;

                                    if (stdObj.std_stayed_two_year > 0) {
                                        stdObj.std_date_receipt.setFullYear(stdObj.std_date_receipt.getFullYear() - stdObj.std_stayed_two_year);
                                    }

                                    // Если не пустой emp_login, то получаем его ID
                                    if (std.emp_login === undefined) {
                                        return null;
                                    }

                                    return knex({pepl: T.PEOPLE.NAME, role: T.ROLE.NAME})
                                        .select('pepl.' + T.PEOPLE.PEPL_ID)
                                        .where('pepl.' + T.PEOPLE.PEPL_LOGIN, std.emp_login)
                                        .whereRaw('?? = ??', ['pepl.' + T.PEOPLE.PEPL_ID, 'role.' + T.ROLE.PEPL_ID])
                                        .where('role.' + T.ROLE.ROLE_NAME, ROLE.TEACHER);
                                })
                                .then(res => {
                                    if (res !== null) {
                                        if (res.length === 0) {
                                            let teacher = result.emps.find(emp => emp.people.pepl_login === std.emp_login);
                                            if (teacher === undefined)
                                                throw new Error(STATUS.NOT_FOUND_TEACHER);
                                            else
                                                stdObj.emp_id = teacher.people.pepl_id;
                                        } else {
                                            // Учитель найден
                                            stdObj.emp_id = res[0].pepl_id;
                                        }
                                    }

                                    // Добавляем данные об ученике
                                    return knex(T.STUDENTS.NAME)
                                        .transacting(trx)
                                        .insert(stdObj)
                                        .returning('*');
                                })
                                .then(res => {
                                    if (res.length === 0) {
                                        throw new Error(STATUS.NOT_FOUND_ADDED_STD);
                                    }

                                    // Запись об ученике добавлена
                                    // Фиксируем роли
                                    return knex(T.ROLE.NAME)
                                        .transacting(trx)
                                        .insert({
                                            pepl_id: peplObj.pepl_id,
                                            role_name: ROLE.STUDENT
                                        })
                                        .returning(T.ROLE.ROLE_NAME);
                                })
                                .then(res => {
                                    if (res.length === 0) {
                                        throw new Error(STATUS.NOT_FOUND_ADDED_ROLE_STD);
                                    }

                                    // Должности привязаны
                                    // Возвращаем результат добавления пользователя
                                    resolve({
                                        people: peplObj,
                                        student: stdObj,
                                        accessData: accessData
                                    })
                                })
                                .catch(err => {
                                    reject(err)
                                });
                        })
                    });
                })
                .then(res => {
                    // Ученики были добавлены
                    result.stds = res;
                    resolve(result);
                    trx.commit();
                })
                .catch(err => {
                    if (err.message === STATUS.NOT_FOUND_ADDED_POSTS ||
                        err.message === STATUS.NOT_FOUND_ADDED_ROLE ||
                        err.message === STATUS.NOT_FOUND_ADDED_PEOPLE ||
                        err.message === STATUS.NOT_FOUND_ADDED_EMP ||
                        err.message === STATUS.NOT_FOUND_ADDED_EMPLOYEES ||
                        err.message === STATUS.NOT_FOUND_ADDED_POSTS_FOR_EMP ||
                        err.message === STATUS.NOT_FOUND_ADDED_ROLE_STD ||
                        err.message === STATUS.NOT_FOUND_ADDED_STD ||
                        err.message === STATUS.NOT_FOUND_TEACHER)
                        result = {status: err.message};
                    else
                        result = {status: STATUS.UNKNOWN_ERROR};
                    reject(result);

                    trx.rollback(err);
                })
        })
    })
};