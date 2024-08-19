// routes/subjects.js
import express from 'express';
import {
  showSubjectForm,
  handleAddSubject,
  getEditSubjectForm,
  handleUpdateSubject,
  handleDeleteSubject,
  listSubjects
} from '../logics/subjectsLogic.js';

const router = express.Router();

router.get('/form', showSubjectForm);
router.post('/', handleAddSubject);
router.get('/edit/:id', getEditSubjectForm);
router.post('/edit/:id', handleUpdateSubject);
router.get('/delete/:id', handleDeleteSubject);
router.get('/', listSubjects);

export default router;
