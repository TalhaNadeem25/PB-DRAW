import Tournament from '../models/Tournament.js';
import Match from '../models/Match.js';
import Event from '../models/Event.js';
import Team from '../models/Team.js';

/**
 * @desc    Get court configuration for tournament
 * @route   GET /api/tournaments/:id/courts
 * @access  Private (Organizer)
 */
export const getCourtConfiguration = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('events');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        courts: tournament.courts || [],
        scheduling: tournament.scheduling || {
          startTime: '08:00',
          endTime: '18:00',
          slotDuration: 30,
          breakTimes: []
        }
      }
    });
  } catch (error) {
    console.error('Get court configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get court configuration'
    });
  }
};

/**
 * @desc    Update court configuration
 * @route   PUT /api/tournaments/:id/courts
 * @access  Private (Organizer)
 */
export const updateCourtConfiguration = async (req, res) => {
  try {
    const { courts, scheduling } = req.body;

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Verify user is organizer
    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update court configuration'
      });
    }

    // Update courts
    if (courts) {
      tournament.courts = courts.map((court, index) => ({
        number: court.number || index + 1,
        name: court.name || `Court ${index + 1}`,
        type: court.type || 'indoor',
        available: court.available !== false
      }));
    }

    // Update scheduling
    if (scheduling) {
      tournament.scheduling = {
        startTime: scheduling.startTime || '08:00',
        endTime: scheduling.endTime || '18:00',
        slotDuration: scheduling.slotDuration || 30,
        breakTimes: scheduling.breakTimes || []
      };
    }

    await tournament.save();

    res.status(200).json({
      success: true,
      data: {
        courts: tournament.courts,
        scheduling: tournament.scheduling
      }
    });
  } catch (error) {
    console.error('Update court configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update court configuration'
    });
  }
};

/**
 * @desc    Get schedule grid with all matches
 * @route   GET /api/tournaments/:id/schedule-grid
 * @access  Private (Organizer)
 */
export const getScheduleGrid = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('events');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Get all matches for this tournament's events
    const eventIds = tournament.events.map(e => e._id);
    const matches = await Match.find({ event: { $in: eventIds } })
      .populate('team1', 'name')
      .populate('team2', 'name')
      .populate('event', 'name format')
      .sort({ scheduledTime: 1 });

    // Organize matches by court and time slot
    const scheduledMatches = matches.filter(m => m.courtNumber && m.scheduledTime);
    const unscheduledMatches = matches.filter(m => !m.courtNumber || !m.scheduledTime);

    // Generate time slots
    const scheduling = tournament.scheduling || {
      startTime: '08:00',
      endTime: '18:00',
      slotDuration: 30
    };

    const timeSlots = [];
    const [startHour, startMin] = scheduling.startTime.split(':').map(Number);
    const [endHour, endMin] = scheduling.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    for (let mins = startMinutes; mins < endMinutes; mins += scheduling.slotDuration) {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      timeSlots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }

    res.status(200).json({
      success: true,
      data: {
        courts: tournament.courts || [],
        scheduling: tournament.scheduling || scheduling,
        timeSlots,
        scheduledMatches,
        unscheduledMatches,
        breakTimes: scheduling.breakTimes || []
      }
    });
  } catch (error) {
    console.error('Get schedule grid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schedule grid'
    });
  }
};

/**
 * @desc    Assign match to court and time
 * @route   PUT /api/matches/:id/assign-court
 * @access  Private (Organizer)
 */
export const assignMatchToCourt = async (req, res) => {
  try {
    const { courtNumber, scheduledTime, courtName } = req.body;

    const match = await Match.findById(req.params.id)
      .populate('event');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Get tournament to verify organizer
    const event = await Event.findById(match.event._id);
    const tournament = await Tournament.findById(event.tournament);

    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to assign courts'
      });
    }

    // Update match with court assignment
    match.courtNumber = courtNumber;
    match.court = courtName || `Court ${courtNumber}`;
    match.scheduledTime = scheduledTime ? new Date(scheduledTime) : match.scheduledTime;
    
    await match.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament:${tournament._id}`).emit('match-scheduled', {
        matchId: match._id,
        courtNumber,
        scheduledTime
      });
    }

    res.status(200).json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error('Assign match to court error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign match to court'
    });
  }
};

/**
 * @desc    Auto-schedule all unscheduled matches
 * @route   POST /api/tournaments/:id/auto-schedule
 * @access  Private (Organizer)
 */
export const autoScheduleMatches = async (req, res) => {
  try {
    const { strategy = 'balanced' } = req.body; // 'balanced', 'minimize-gaps', 'by-event'

    const tournament = await Tournament.findById(req.params.id)
      .populate('events');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to auto-schedule matches'
      });
    }

    // Get courts and scheduling config
    const courts = tournament.courts || [{ number: 1, name: 'Court 1', available: true }];
    const scheduling = tournament.scheduling || {
      startTime: '08:00',
      endTime: '18:00',
      slotDuration: 30
    };

    // Get unscheduled matches
    const eventIds = tournament.events.map(e => e._id);
    const unscheduledMatches = await Match.find({
      event: { $in: eventIds },
      $or: [
        { courtNumber: { $exists: false } },
        { courtNumber: null },
        { scheduledTime: { $exists: false } },
        { scheduledTime: null }
      ]
    }).populate('team1 team2 event');

    if (unscheduledMatches.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No unscheduled matches to schedule',
        data: { scheduledCount: 0 }
      });
    }

    // Generate available time slots for tournament start date
    const startDate = new Date(tournament.startDate);
    const [startHour, startMin] = scheduling.startTime.split(':').map(Number);
    const [endHour, endMin] = scheduling.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Build grid of available slots (court x time)
    const availableSlots = [];
    const availableCourts = courts.filter(c => c.available !== false);
    
    for (let mins = startMinutes; mins < endMinutes; mins += scheduling.slotDuration) {
      for (const court of availableCourts) {
        const slotTime = new Date(startDate);
        slotTime.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
        availableSlots.push({
          courtNumber: court.number,
          courtName: court.name,
          time: slotTime,
          timeString: `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`
        });
      }
    }

    // Check for conflicts with already scheduled matches
    const scheduledMatches = await Match.find({
      event: { $in: eventIds },
      courtNumber: { $exists: true, $ne: null },
      scheduledTime: { $exists: true, $ne: null }
    });

    // Track which slots are taken and which teams are playing when
    const takenSlots = new Set();
    const teamSchedule = {};

    scheduledMatches.forEach(match => {
      const slotKey = `${match.courtNumber}-${match.scheduledTime.toISOString()}`;
      takenSlots.add(slotKey);
      
      // Track team schedules
      const timeKey = match.scheduledTime.toISOString();
      if (match.team1) {
        teamSchedule[match.team1.toString()] = teamSchedule[match.team1.toString()] || [];
        teamSchedule[match.team1.toString()].push(timeKey);
      }
      if (match.team2) {
        teamSchedule[match.team2.toString()] = teamSchedule[match.team2.toString()] || [];
        teamSchedule[match.team2.toString()].push(timeKey);
      }
    });

    // Schedule matches
    let scheduledCount = 0;
    const matchUpdates = [];

    for (const match of unscheduledMatches) {
      // Find available slot where neither team is playing
      for (const slot of availableSlots) {
        const slotKey = `${slot.courtNumber}-${slot.time.toISOString()}`;
        
        // Skip if slot is taken
        if (takenSlots.has(slotKey)) continue;
        
        // Check if either team is already playing at this time
        const team1Id = match.team1?._id?.toString();
        const team2Id = match.team2?._id?.toString();
        const timeKey = slot.time.toISOString();
        
        const team1Busy = team1Id && teamSchedule[team1Id]?.includes(timeKey);
        const team2Busy = team2Id && teamSchedule[team2Id]?.includes(timeKey);
        
        if (team1Busy || team2Busy) continue;
        
        // Assign this slot
        match.courtNumber = slot.courtNumber;
        match.court = slot.courtName;
        match.scheduledTime = slot.time;
        matchUpdates.push(match.save());
        
        // Mark slot as taken
        takenSlots.add(slotKey);
        
        // Update team schedules
        if (team1Id) {
          teamSchedule[team1Id] = teamSchedule[team1Id] || [];
          teamSchedule[team1Id].push(timeKey);
        }
        if (team2Id) {
          teamSchedule[team2Id] = teamSchedule[team2Id] || [];
          teamSchedule[team2Id].push(timeKey);
        }
        
        scheduledCount++;
        break;
      }
    }

    await Promise.all(matchUpdates);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament:${tournament._id}`).emit('matches-auto-scheduled', {
        scheduledCount
      });
    }

    res.status(200).json({
      success: true,
      message: `Auto-scheduled ${scheduledCount} matches`,
      data: {
        scheduledCount,
        totalUnscheduled: unscheduledMatches.length,
        remaining: unscheduledMatches.length - scheduledCount
      }
    });
  } catch (error) {
    console.error('Auto-schedule matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-schedule matches'
    });
  }
};

/**
 * @desc    Check for scheduling conflicts
 * @route   POST /api/tournaments/:id/check-conflicts
 * @access  Private (Organizer)
 */
export const checkConflicts = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('events');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Get all scheduled matches
    const eventIds = tournament.events.map(e => e._id);
    const matches = await Match.find({
      event: { $in: eventIds },
      courtNumber: { $exists: true, $ne: null },
      scheduledTime: { $exists: true, $ne: null }
    }).populate('team1 team2 event');

    const conflicts = [];
    const teamMatches = {};

    // Check for team conflicts (same team at same time)
    matches.forEach(match => {
      const timeKey = match.scheduledTime.toISOString();
      
      ['team1', 'team2'].forEach(teamKey => {
        const team = match[teamKey];
        if (!team) return;
        
        const teamId = team._id.toString();
        if (!teamMatches[teamId]) {
          teamMatches[teamId] = [];
        }
        
        // Check if team has another match at same time
        const existingMatch = teamMatches[teamId].find(m => 
          m.scheduledTime.toISOString() === timeKey && m._id.toString() !== match._id.toString()
        );
        
        if (existingMatch) {
          conflicts.push({
            type: 'team-overlap',
            team: team.name || teamId,
            time: match.scheduledTime,
            matches: [match._id, existingMatch._id]
          });
        }
        
        teamMatches[teamId].push(match);
      });
    });

    // Check for court double-booking
    const courtSlots = {};
    matches.forEach(match => {
      const slotKey = `${match.courtNumber}-${match.scheduledTime.toISOString()}`;
      if (courtSlots[slotKey]) {
        conflicts.push({
          type: 'court-double-booked',
          court: match.court || `Court ${match.courtNumber}`,
          time: match.scheduledTime,
          matches: [match._id, courtSlots[slotKey]]
        });
      }
      courtSlots[slotKey] = match._id;
    });

    res.status(200).json({
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts
      }
    });
  } catch (error) {
    console.error('Check conflicts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check conflicts'
    });
  }
};

/**
 * @desc    Clear all court assignments
 * @route   DELETE /api/tournaments/:id/clear-schedule
 * @access  Private (Organizer)
 */
export const clearSchedule = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('events');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to clear schedule'
      });
    }

    const eventIds = tournament.events.map(e => e._id);
    
    const result = await Match.updateMany(
      { event: { $in: eventIds } },
      { 
        $unset: { 
          courtNumber: 1, 
          scheduledTime: 1 
        },
        $set: {
          court: null
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `Cleared schedule for ${result.modifiedCount} matches`,
      data: { clearedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Clear schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear schedule'
    });
  }
};
