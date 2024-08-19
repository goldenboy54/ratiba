// routes/timetables.js
import express from 'express';
import { showtimetableForm, handleAddtimetable, getEdittimetableForm, handleUpdatetimetable, handleDeletetimetable, listtimetables } from '../logics/timetablesLogic.js';

const router = express.Router();

// Route to show the form for adding a new timetable
router.get('/form', showtimetableForm);

// Route to handle form submission for adding a new timetable
router.post('/', handleAddtimetable);

// Route to show the form for editing an existing timetable
router.get('/edit/:id', getEdittimetableForm);

// Route to handle form submission for updating an existing timetable
router.post('/edit/:id', handleUpdatetimetable);

// Route to handle deletion of an existing timetable
router.get('/delete/:id', handleDeletetimetable);

// Route to list all timetables
router.get('/', listtimetables);

export default router;
