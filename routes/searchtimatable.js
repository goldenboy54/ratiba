import express from 'express';
import { searchTimetables, getDistinctValues } from '../logics/timetableLogic.js';

const router = express.Router();

// Route to search for timetables based on various criteria
router.get('/searchtimetable', async (req, res) => {
  try {
    // Extract search criteria from query parameters
    const criteria = {
      department_name: req.query.department,
      program_name: req.query.program,
      subject_name: req.query.subject,
      venue_name: req.query.venue,
      tutor_name: req.query.tutor,
      program_level: req.query.level,
    };

    // Perform search based on criteria
    const timetables = await searchTimetables(criteria);

    // Fetch distinct values for filters
    const programs = await getDistinctValues('program_name');
    const venues = await getDistinctValues('venue_name');
    const subjects = await getDistinctValues('subject_name');
    const tutors = await getDistinctValues('tutor_name');
    const departments = await getDistinctValues('department_name');
    const levels = await getDistinctValues('program_level');

    // Render the search results page with the fetched data
    res.render('searchtimetable', {
      timetables,
      programs,
      venues,
      tutors,
      levels,
      departments,
      subjects,
      ...criteria,
    });
  } catch (error) {
    // Handle and log errors
    res.status(500).send('Error searching timetables: ' + error.message);
  }
});

// Route to download timetables as a CSV file
router.get('/download-timetable', async (req, res) => {
  try {
    // Extract search criteria from query parameters
    const criteria = {
      department_name: req.query.department,
      program_name: req.query.program,
      venue_name: req.query.venue,
      tutor_name: req.query.tutor,
      subject_name: req.query.subject,
    };

    // Perform search based on criteria
    const timetables = await searchTimetables(criteria);

    // Convert timetables data to CSV format
    const csvContent = 'Program, Venue, Tutor, Department\n' + 
      timetables.map(t => `${t.program_name}, ${t.venue_name}, ${t.tutor_name}, ${t.department_name}, ${t.subject_name}`).join('\n');

    // Send the CSV file as response
    res.header('Content-Type', 'text/csv');
    res.attachment('timetables.csv');
    res.send(csvContent);
  } catch (error) {
    // Handle and log errors
    res.status(500).send('Error downloading timetable: ' + error.message);
  }
});

export default router;
