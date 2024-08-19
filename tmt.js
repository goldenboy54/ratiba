const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000;

// Create connection to the database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'atc_timetable'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database.');
});

// Middleware
app.use(express.json());

// API endpoint to generate timetable
app.get('/generate-timetable', (req, res) => {
  const query = `
    SELECT s.subject_code, s.title AS subject_name, s.credit AS subject_credit, v.venue_name, v.location AS venue_location,
           u.full_name AS tutor_name, p.program_name, p.level AS program_level, p.duration AS year, v.type AS venue_type,
           v.status AS venue_status, sc.class_time
    FROM schedule sc
    JOIN user_subjects us ON sc.user_subject_id = us.user_subject_id
    JOIN subjects s ON us.subject_id = s.subject_id
    JOIN users u ON us.user_id = u.user_id
    JOIN program_venue pv ON sc.program_venue_id = pv.program_venue_id
    JOIN venues v ON pv.venue_id = v.venue_id
    JOIN programs p ON s.program_id = p.program_id
  `;

  connection.query(query, (err, results) => {
    if (err) throw err;

    // Generate timetable
    const timetable = generateTimetable(results);

    // Save timetable to database
    saveTimetable(timetable, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save timetable.' });
      }
      res.json({ message: 'Timetable generated and saved successfully.' });
    });
  });
});

// Function to generate timetable
function generateTimetable(data) {
  const startTime = new Date('2024-08-08T08:00:00'); // Start time of the day
  const periodDuration = 45; // Duration of each period in minutes
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const maxPeriodsPerDay = 8; // Number of periods in a day
  const timetable = [];

  // Map to track scheduled periods and venues
  const scheduleMap = {};

  data.forEach((entry, index) => {
    let dayIndex = Math.floor(index / (maxPeriodsPerDay * daysOfWeek.length));
    let day = daysOfWeek[dayIndex % daysOfWeek.length];
    let periodIndex = index % (maxPeriodsPerDay * daysOfWeek.length);

    const periodStart = new Date(startTime);
    periodStart.setMinutes(periodStart.getMinutes() + (periodDuration * (periodIndex % maxPeriodsPerDay)));

    const periodEnd = new Date(periodStart);
    periodEnd.setMinutes(periodEnd.getMinutes() + periodDuration);

    // Check for collisions
    const scheduleKey = `${day}-${periodStart.toTimeString().split(' ')[0]}-${entry.venue_name}`;
    if (scheduleMap[scheduleKey]) {
      console.log(`Collision detected for ${scheduleKey}`);
      return; // Skip scheduling this entry
    }

    scheduleMap[scheduleKey] = true;

    timetable.push({
      day: day,
      start_time: periodStart.toTimeString().split(' ')[0],
      end_time: periodEnd.toTimeString().split(' ')[0],
      subject_code: entry.subject_code,
      subject_name: entry.subject_name,
      venue_name: entry.venue_name,
      tutor_name: entry.tutor_name,
      venue_location: entry.venue_location,
      department_name: entry.department_name,
      program_name: entry.program_name,
      subject_credit: entry.subject_credit,
      program_level: entry.program_level,
      year: entry.year,
      venue_type: entry.venue_type,
      venue_status: entry.venue_status
    });
  });

  return timetable;
}

// Function to save timetable to the database
function saveTimetable(timetable, callback) {
  const query = `
    INSERT INTO extracted_timetable (day, start_time, end_time, subject_code, subject_name, venue_name, tutor_name, venue_location, department_name, program_name, subject_credit, program_level, year, venue_type, venue_status)
    VALUES ?
  `;

  const values = timetable.map(item => [
    item.day,
    item.start_time,
    item.end_time,
    item.subject_code,
    item.subject_name,
    item.venue_name,
    item.tutor_name,
    item.venue_location,
    item.department_name,
    item.program_name,
    item.subject_credit,
    item.program_level,
    item.year,
    item.venue_type,
    item.venue_status
  ]);

  connection.query(query, [values], callback);
}

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
