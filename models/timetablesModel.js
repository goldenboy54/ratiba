import pool from '../db.js';

// Fetch all timetables
export const getAlltimetables = async () => {
  try {
    const dbQuery = 'SELECT * FROM extracted_timetables';
    const [results] = await pool.execute(dbQuery);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};



// Add timetable
export const addtimetable = async (timetable) => {
  try {
    const { generate } = timetable;

    if (generate === 'generate') {
      const query = `
        SELECT s.subject_code AS subject_code,s.subject_department AS subjectDepartment, s.title AS subject_name, s.credit AS subject_credit,s.type_prac_or_theory, v.venue_name, v.location AS venue_location,
               u.full_name AS tutor_name, p.program_name, p.program_type,p.level AS program_level, p.duration AS year, v.type AS type,
               v.status AS venue_status,v.department, s.total_hours_per_week
        FROM venues v,subjects s
        JOIN users u ON s.user_id = u.user_id
        JOIN programs p ON s.program_id = p.program_id
        WHERE s.user_id IS NOT NULL
      `;

      
      
      const [results] = await pool.execute(query);

      // Generate timetable
      const generatedTimetable = generateTimetable(results);

      // Save timetable to database
      await saveTimetable(generatedTimetable);

      return { message: 'Timetable generated and saved successfully.' };
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};


const generateTimetable = (data) => {
  const periodDuration = 45; // Duration of each period in minutes
  const breakInterval = 5; // 5-minute interval between periods

  // Time management settings
  const fullTimeStart = '07:35';
  const fullTimeEnd = '18:30';
  const eveningStart = '14:00';
  const eveningEnd = '22:00';

  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timetable = [];

  // Maps for tracking scheduled periods and venues
  const scheduleMap = {};
  const labVenues = data.filter(entry => entry.type === 'Lab'); // Filter labs
  const normalVenues = data.filter(entry => entry.type !== 'Lab'); // Filter non-lab venues

  // Fixed Break Times
  const breaks = {
    'Monday': { breakfast: { start: '10:35', end: '11:00' }, lunch: { start: '12:30', end: '13:15' } },
    'Tuesday': { breakfast: { start: '10:35', end: '11:00' }, lunch: { start: '12:30', end: '13:15' } },
    'Wednesday': { breakfast: { start: '10:35', end: '11:00' }, lunch: { start: '12:30', end: '13:15' } },
    'Thursday': { breakfast: { start: '10:35', end: '11:00' }, lunch: { start: '12:30', end: '13:15' } },
    'Friday': { breakfast: { start: '09:45', end: '10:30' }, lunch: { start: '12:00', end: '14:00' } }
  };

  // Helper functions
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(1970, 0, 1, hours, minutes);
  };

  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getPeriodsForSession = (startTime, endTime) => {
    const periods = [];
    let currentTime = parseTime(startTime);

    while (currentTime < parseTime(endTime)) {
      periods.push(new Date(currentTime));
      currentTime.setMinutes(currentTime.getMinutes() + periodDuration + breakInterval);
    }

    return periods;
  };

  // Group subjects by required periods
  const subjects = data.reduce((acc, entry) => {
    if (!acc[entry.subject_code]) {
      acc[entry.subject_code] = {
        ...entry,
        periodsLeft: Math.ceil(entry.total_hours_per_week / 2) // Calculate pairs of periods required
      };
    }
    return acc;
  }, {});

  // Helper function to get a venue based on subject type and department
  const getVenue = (subjectType, subjectDepartment) => {
    let availableVenues = subjectType === 'Lab'
      ? labVenues.filter(venue => venue.department === subjectDepartment)
      : normalVenues.filter(venue => venue.department === subjectDepartment || venue.department === 'neutral');
    return availableVenues.length > 0 ? availableVenues[Math.floor(Math.random() * availableVenues.length)] : null;
  };



  // Generate timetable periods
  daysOfWeek.forEach((day) => {
    // Get the list of periods for full-time and evening sessions
    const fullTimePeriods = getPeriodsForSession(fullTimeStart, fullTimeEnd);
    const eveningPeriods = getPeriodsForSession(eveningStart, eveningEnd);

    const allPeriods = [...fullTimePeriods, ...eveningPeriods];
    let periodIndex = 0;
    const usedVenues = {};
    const subjectAssignments = {}; // Track assignments to ensure subjects are assigned twice

    while (periodIndex < allPeriods.length) {
      let currentTime = allPeriods[periodIndex];
      const nextPeriodTime = new Date(currentTime.getTime() + periodDuration * 60000);
      const scheduleKey = `${day}-${formatTime(currentTime)}-${formatTime(nextPeriodTime)}`;
      let venue;
      let subjectCode;

      // Check if the current time falls within the break periods
      const breakTimes = breaks[day];
      const inBreakfastBreak = (currentTime >= parseTime(breakTimes.breakfast.start) && currentTime < parseTime(breakTimes.breakfast.end));
      const inLunchBreak = (currentTime >= parseTime(breakTimes.lunch.start) && currentTime < parseTime(breakTimes.lunch.end));

      if (inBreakfastBreak || inLunchBreak) {
        timetable.push({
          day: day,
          start_time: formatTime(currentTime),
          end_time: formatTime(nextPeriodTime),
          subject_code: 'BREAK',
          subject_name: 'BREAK',
          venue_name: 'N/A',
          tutor_name: 'N/A',
          venue_location: 'N/A',
          program_name: 'N/A',
          subject_credit: 0,
          program_level: 'N/A',
          department_name: 'N/A',
          year: 'N/A',
          venue_type: 'BREAK',
          venue_status: 'N/A'
        });
        periodIndex++;
        continue;
      }

      // Pick a subject based on program_type
      const subjectCodes = Object.keys(subjects);
      if (subjectCodes.length === 0) break; // No more subjects

      subjectCode = subjectCodes[Math.floor(Math.random() * subjectCodes.length)];
      const subject = subjects[subjectCode];

      // Determine if this is a full-time or evening session
      const isFullTime = subject.program_type === 'full-time';
      const isEvening = subject.program_type === 'evening';

      // Ensure the venue is assigned twice before moving to another
      if (!subjectAssignments[subjectCode]) {
        subjectAssignments[subjectCode] = { assignedCount: 0 };
      }

      if (subjectAssignments[subjectCode].assignedCount < 2) {
        venue = getVenue(subject.type_prac_or_theory, subject.subjectDepartment);
        if (venue) {
          subjectAssignments[subjectCode].assignedCount++;
        }
      } else {
        venue = getVenue(subject.type_prac_or_theory, subject.subjectDepartment);
      }

      if (!venue) {
        periodIndex++;
        continue; // Skip to next period if no venue available
      }

      // Check for collisions
      if (scheduleMap[scheduleKey]) {
        periodIndex++;
        continue; // Skip to next period
      }

      // Ensure periods are within the correct time range for each program type
      if ((isFullTime && (formatTime(currentTime) < fullTimeStart || formatTime(nextPeriodTime) > fullTimeEnd)) ||
          (isEvening && (formatTime(currentTime) < eveningStart || formatTime(nextPeriodTime) > eveningEnd))) {
        periodIndex++;
        continue; // Skip if outside the designated time range
      }

      scheduleMap[scheduleKey] = true;

      timetable.push({
        day: day,
        start_time: formatTime(currentTime),
        end_time: formatTime(nextPeriodTime),
        subject_code: subject.subject_code,
        subject_name: subject.subject_name,
        venue_name: venue.venue_name,
        tutor_name: subject.tutor_name,
        venue_location: venue.venue_location,
        program_name: subject.program_name,
        subject_credit: subject.subject_credit,
        program_level: subject.program_level,
        department_name: subject.subjectDepartment,
        year: subject.year,
        venue_type: subject.type_prac_or_theory,
        venue_status: venue.status
      });

      // Decrease the number of periods left for this subject
      subject.periodsLeft -= 1;

      // Remove subject if no periods are left
      if (subject.periodsLeft <= 0) {
        delete subjects[subjectCode];
      }

      periodIndex++; // Proceed to next period
    }
  });

  return timetable;
};




// Function to save timetable to the database
const saveTimetable = async (timetable) => {
  try {
    let query = `
      INSERT INTO extracted_timetables (
        day, start_time, end_time, subject_code, subject_name, department_name, venue_name, 
        tutor_name, venue_location, program_name, subject_credit, program_level, 
        year, venue_type, venue_status
      ) VALUES `;

    const values = timetable.map(item => `
      ('${item.day}', '${item.start_time}', '${item.end_time}', '${item.subject_code}', '${item.subject_name}', 
      '${item.department_name}', '${item.venue_name}', '${item.tutor_name}', '${item.venue_location}', 
      '${item.program_name}', '${item.subject_credit}', '${item.program_level}', '${item.year}', 
      '${item.venue_type}', '${item.venue_status}')
    `);

    query += values.join(', ');

    await pool.execute(query);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to update timetable
export const updatetimetable = async (id, timetable) => {
  try {
    const query = `
      UPDATE extracted_timetables SET 
        day = ?, start_time = ?, end_time = ?, subject_code = ?, subject_name = ?, 
        department_name = ?, venue_name = ?, tutor_name = ?, venue_location = ?, 
        program_name = ?, subject_credit = ?, program_level = ?, year = ?, 
        venue_type = ?, venue_status = ? 
      WHERE id = ?
    `;

    const params = [
      timetable.day, timetable.start_time, timetable.end_time, timetable.subject_code,
      timetable.subject_name, timetable.department_name, timetable.venue_name, timetable.tutor_name,
      timetable.venue_location, timetable.program_name, timetable.subject_credit, timetable.program_level,
      timetable.year, timetable.venue_type, timetable.venue_status, id
    ];

    await pool.execute(query, params);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to delete timetable
export const deletetimetable = async () => {
  try {
    const query = 'TRUNCATE TABLE extracted_timetables';
    await pool.execute(query);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to update venue status automatically
export const updateVenueStatusAutomatically = async () => {
  try {
    const currentTime = new Date();
    let status = 'Available';

    if (currentTime.getHours() >= 8 && currentTime.getHours() < 12) {
      status = 'Occupied';
    } else if (currentTime.getHours() >= 12 && currentTime.getHours() < 14) {
      status = 'Break';
    } else if (currentTime.getHours() >= 14 && currentTime.getHours() < 18) {
      status = 'Occupied';
    }

    const query = 'UPDATE venues SET status = ?';
    await pool.execute(query, [status]);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Periodically update venue status
setInterval(updateVenueStatusAutomatically, 60000); // Update every minute