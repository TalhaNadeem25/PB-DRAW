import Tournament from '../models/Tournament.js';
import Event from '../models/Event.js';

// Note: This is a mock implementation. In production, you would integrate with OpenAI/Anthropic API
// For now, it provides rule-based intelligent suggestions

/**
 * Calculate court requirements based on tournament parameters
 */
const calculateCourtRequirements = (params) => {
  const { totalPlayers, hoursAvailable, matchDuration = 30, simultaneousMatches = 4 } = params;

  const matchesPerCourt = hoursAvailable * 60 / matchDuration;
  const totalMatchesNeeded = totalPlayers * 2; // Rough estimate for round-robin
  const courtsNeeded = Math.ceil(totalMatchesNeeded / matchesPerCourt);

  return {
    recommended: courtsNeeded,
    minimum: Math.max(2, Math.ceil(courtsNeeded * 0.6)),
    optimal: courtsNeeded + 1,
    reasoning: `Based on ${totalPlayers} players, ${hoursAvailable} hours available, and ${matchDuration}-minute matches, you'll need ${courtsNeeded} courts to run smoothly. We recommend ${courtsNeeded + 1} courts to avoid delays.`
  };
};

/**
 * Suggest events based on player demographics
 */
const suggestEvents = (context) => {
  const suggestions = [];

  // Skill level based events
  const skillLevels = ['3.0', '3.5', '4.0', '4.5', '5.0'];
  const formats = [
    { format: 'singles', name: 'Singles', price: 50 },
    { format: 'doubles', name: 'Doubles', price: 40 },
    { format: 'mixed-doubles', name: 'Mixed Doubles', price: 45 }
  ];

  // Generate common event combinations
  if (context.includeSkillDivisions !== false) {
    skillLevels.forEach(skill => {
      formats.forEach(fmt => {
        suggestions.push({
          name: `${fmt.name} ${skill}+`,
          format: fmt.format,
          skillLevel: skill,
          maxTeams: 16,
          entryFee: fmt.price,
          playFormat: 'round-robin',
          reasoning: `Standard ${fmt.name} event for ${skill}+ skill level players`
        });
      });
    });
  }

  return suggestions;
};

/**
 * Generate schedule recommendations
 */
const generateSchedule = (params) => {
  const { events, startTime = '9:00 AM', courts = 4, matchDuration = 30 } = params;

  const schedule = [];
  let currentTime = startTime;

  events.forEach((event, idx) => {
    const estimatedMatches = Math.ceil(event.maxTeams * 1.5); // Rough estimate
    const matchesPerRound = Math.min(courts, Math.floor(event.maxTeams / 2));
    const rounds = Math.ceil(estimatedMatches / matchesPerRound);
    const totalMinutes = rounds * matchDuration;

    schedule.push({
      eventName: event.name,
      startTime: currentTime,
      estimatedDuration: `${Math.ceil(totalMinutes / 60)} hours`,
      courtsUsed: Math.min(courts, matchesPerRound),
      rounds: rounds
    });

    // Calculate next start time
    const [hours, minutes] = currentTime.split(':');
    const totalMins = parseInt(hours) * 60 + parseInt(minutes.split(' ')[0]) + totalMinutes + 30; // 30 min buffer
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    currentTime = `${newHours}:${newMins.toString().padStart(2, '0')} ${newHours >= 12 ? 'PM' : 'AM'}`;
  });

  return schedule;
};

/**
 * AI Planner Chat Interface
 */
export const getAIPlannerSuggestions = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    const { prompt, context } = req.body;

    const tournament = await Tournament.findById(tournamentId)
      .populate('events')
      .populate('organizer', 'name email');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check authorization
    if (tournament.organizer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access AI planner for this tournament'
      });
    }

    // Parse prompt intent
    const lowerPrompt = prompt.toLowerCase();
    let response = {
      type: 'text',
      message: '',
      data: null,
      suggestions: []
    };

    // Court calculation request
    if (lowerPrompt.includes('court') && (lowerPrompt.includes('need') || lowerPrompt.includes('require') || lowerPrompt.includes('how many'))) {
      const totalPlayers = context?.expectedPlayers || tournament.maxPlayers || 64;
      const hoursAvailable = context?.hoursAvailable || 8;

      const courtCalc = calculateCourtRequirements({
        totalPlayers,
        hoursAvailable,
        matchDuration: context?.matchDuration || 30
      });

      response.type = 'court-calculation';
      response.message = courtCalc.reasoning;
      response.data = courtCalc;
      response.suggestions = [
        `Update venue to ${courtCalc.optimal} courts`,
        `Plan for ${hoursAvailable} hours of play time`,
        `Schedule ${Math.ceil(courtCalc.optimal * 0.8)} courts minimum for peak times`
      ];
    }
    // Event suggestions request
    else if (lowerPrompt.includes('event') && (lowerPrompt.includes('create') || lowerPrompt.includes('suggest') || lowerPrompt.includes('what event'))) {
      const events = suggestEvents(context || {});

      // Limit to most common events
      const popularEvents = events.filter(e =>
        ['3.5', '4.0', '4.5'].includes(e.skillLevel) &&
        ['doubles', 'mixed-doubles'].includes(e.format)
      ).slice(0, 6);

      response.type = 'event-suggestions';
      response.message = `Based on your tournament setup, here are the recommended events. These are the most popular skill levels and formats in pickleball tournaments.`;
      response.data = popularEvents;
      response.suggestions = [
        'Add all 6 recommended events',
        'Customize skill levels',
        'Add singles events'
      ];
    }
    // Schedule request
    else if (lowerPrompt.includes('schedule') || lowerPrompt.includes('when should')) {
      const events = tournament.events || [];

      if (events.length === 0) {
        response.message = "You haven't created any events yet. Would you like me to suggest some events first?";
        response.suggestions = ['Suggest events', 'I\'ll create events manually'];
      } else {
        const schedule = generateSchedule({
          events: events.map(e => ({ name: e.name, maxTeams: e.maxTeams })),
          startTime: context?.startTime || '9:00 AM',
          courts: tournament.venue?.courts || 4,
          matchDuration: context?.matchDuration || 30
        });

        response.type = 'schedule';
        response.message = `Here's a recommended schedule for your ${events.length} events:`;
        response.data = schedule;
        response.suggestions = [
          'Adjust start times',
          'Add breaks between events',
          'Optimize for fewer courts'
        ];
      }
    }
    // General tournament advice
    else if (lowerPrompt.includes('help') || lowerPrompt.includes('how to')) {
      response.type = 'advice';
      response.message = `I can help you with:\n\n• **Court Calculations** - Figure out how many courts you need\n• **Event Suggestions** - Get recommendations for events based on skill levels\n• **Scheduling** - Create optimal match schedules\n• **Registration Management** - Tips for managing player sign-ups\n\nWhat would you like help with?`;
      response.suggestions = [
        'Calculate court requirements',
        'Suggest events for my tournament',
        'Create a schedule',
        'Tips for pricing'
      ];
    }
    // Pricing advice
    else if (lowerPrompt.includes('price') || lowerPrompt.includes('entry fee') || lowerPrompt.includes('cost')) {
      const avgEntryFee = tournament.events?.length > 0
        ? tournament.events.reduce((sum, e) => sum + (e.entryFee || 0), 0) / tournament.events.length
        : 45;

      response.type = 'pricing-advice';
      response.message = `**Pricing Recommendations:**\n\n• **Singles Events**: $50-60 per player (individual format)\n• **Doubles Events**: $40-50 per player (team format)\n• **Mixed Doubles**: $45-55 per player (most popular)\n• **Multi-Event Discount**: Offer $10 off for 2+ events\n\nYour current average: $${Math.round(avgEntryFee)}`;
      response.suggestions = [
        'Set all events to $50',
        'Add early bird discount',
        'Create multi-event packages'
      ];
    }
    // Default response
    else {
      response.message = `I'm your AI Tournament Planner! I can help you with:\n\n• Planning court requirements\n• Suggesting events for different skill levels\n• Creating optimal schedules\n• Pricing recommendations\n• Managing registrations\n\nTry asking: "How many courts do I need for 64 players?" or "What events should I create?"`;
      response.suggestions = [
        'Calculate court requirements',
        'Suggest events',
        'Help with scheduling',
        'Pricing advice'
      ];
    }

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Apply AI suggestions to tournament
 */
export const applyAISuggestions = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    const { action, data } = req.body;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check authorization
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    let result = { success: true, message: '', data: null };

    switch (action) {
      case 'create-events':
        // Create multiple events from AI suggestions
        const createdEvents = [];
        for (const eventData of data.events) {
          const event = await Event.create({
            ...eventData,
            tournament: tournamentId,
            status: 'upcoming'
          });
          createdEvents.push(event);
          tournament.events.push(event._id);
        }
        await tournament.save();

        result.message = `Created ${createdEvents.length} events successfully!`;
        result.data = createdEvents;
        break;

      case 'update-venue':
        // Update venue court count
        tournament.venue = tournament.venue || {};
        tournament.venue.courts = data.courts;
        await tournament.save();

        result.message = `Updated venue to ${data.courts} courts`;
        result.data = tournament.venue;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};
