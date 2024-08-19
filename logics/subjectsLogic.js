// logics/subjectsLogic.js
import { getAllSubjects, addSubject, updateSubject, deleteSubject } from '../models/subjectsModel.js';
import { getAllprograms } from '../models/programsModel.js';
import { getAllusers } from '../models/usersModel.js';
import { getAllvenues } from '../models/venuesModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';
import { getAllregistered_subjects } from '../models/registered_subjectsModel.js';
export const showSubjectForm = async (req, res) => {
  const { id } = req.params;
  try {
    if (id) {
      const subject = await getSubjectById(id);
      const programs = await getAllprograms();
      const users = await getAllusers();
      const venues = await getAllvenues();
      const departments = await getAlldepartments()
      const registered_subjects = await getAllregistered_subjects();
      res.render('subjects', { subject,programs,users,registered_subjects,venues,departments});
    } else {
      const departments = await getAlldepartments()
      const venues = await getAllvenues();
      const programs = await getAllprograms();
      const users = await getAllusers();
      const registered_subjects = await getAllregistered_subjects();
      res.render('subjects', { subject: null,programs,users,registered_subjects,venues,departments});
    }
  } catch (error) {
    res.status(500).send('Error fetching subjects or programs or users or registered_subjects: ' + error.message);
  }
};




export const handleAddSubject = async (req, res) => {
  try {
    await addSubject(req.body);
    res.redirect('/subjects');
  } catch (error) {
    res.status(500).send('Error adding subject: ' + error.message);
  }
};

export const getEditSubjectForm = async (req, res) => {
  try {
    const subject = await getSubjectById(req.params.id);
    res.render('subjects', { subject });
  } catch (error) {
    res.status(500).send('Error getting subject: ' + error.message);
  }
};

export const handleUpdateSubject = async (req, res) => {
  try {
    await updateSubject(req.params.id, req.body);
    res.redirect('/subjects');
  } catch (error) {
    res.status(500).send('Error updating subject: ' + error.message);
  }
};

export const handleDeleteSubject = async (req, res) => {
  try {
    await deleteSubject(req.params.id);
    res.redirect('/subjects');
  } catch (error) {
    res.status(500).send('Error deleting subject: ' + error.message);
  }
};

export const listSubjects = async (req, res) => {
  try {
    const subjects = await getAllSubjects();
    const programs = await getAllprograms();
    const users = await getAllusers();
    const venues = await getAllvenues();
    const departments = await getAlldepartments()
    const registered_subjects = await getAllregistered_subjects();
    res.render('subjects', { subjects,programs,users,registered_subjects,venues,departments});
  } catch (error) {
    res.status(500).send('Error fetching subjects: ' + error.message);
  }
};

