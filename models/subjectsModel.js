// models/subjectsModel.js
import pool from '../db.js';

// Function to get all subjects
export const getAllSubjects = async () => {
  try {
    const dbquery = 'SELECT u.full_name AS full_name,subject_id,s.user_id,subject_code,title,credit,total_hours_per_week,program_id,subject_department,type_prac_or_theory FROM subjects s,users u WHERE s.user_id=u.user_id ORDER BY title ASC';
    const [results] = await pool.execute(dbquery);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};



// Function to add a subject
export const addSubject = async (subject) => {
  const { user_id, subject_code,title,credit,total_hours_per_week,program_id,subject_department,type_prac_or_theory } = subject;
  try {
    const dbquery = 'INSERT INTO subjects (user_id, subject_code,title,credit,total_hours_per_week,program_id,subject_department,type_prac_or_theory) VALUES (?, ?,?, ?, ?, ?, ?,?)';
    const valuesArray = [user_id,subject_code,title,credit,total_hours_per_week,program_id,subject_department,type_prac_or_theory ];
    const [results] = await pool.execute(dbquery, valuesArray);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to update a subject
export const updateSubject = async (id, subject) => {
  const { user_id,subject_code,title,credit,total_hours_per_week,program_id,subject_department,type_prac_or_theory } = subject;
  try {
    const dbquery = 'UPDATE subjects SET user_id=?, subject_code=?,title=?,credit=?,total_hours_per_week=?,program_id=?,subject_department=?,type_prac_or_theory=? WHERE subject_id = ?';
    const valuesArray = [user_id,subject_code,title,credit,total_hours_per_week,program_id,subject_department,type_prac_or_theory ,id];
    const [results] = await pool.execute(dbquery, valuesArray);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to delete a subject
export const deleteSubject = async (id) => {
  try {
    const dbquery = 'DELETE FROM subjects WHERE subject_id = ?';
    const valuesArray = [id];
    const [results] = await pool.execute(dbquery, valuesArray);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
