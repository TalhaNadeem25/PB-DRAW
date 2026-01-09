import Tournament from '../models/Tournament.js';
import Event from '../models/Event.js';

/**
 * Enhanced AI Planner with natural language understanding
 * This is a sophisticated mock implementation that feels like a real LLM
 * In production, you can swap this with OpenAI/Anthropic API calls
 */

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
    const estimatedMatches = Math.ceil(event.maxTeams * 1.5);
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
    const totalMins = parseInt(hours) * 60 + parseInt(minutes.split(' ')[0]) + totalMinutes + 30;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    currentTime = `${newHours}:${newMins.toString().padStart(2, '0')} ${newHours >= 12 ? 'PM' : 'AM'}`;
  });

  return schedule;
};

/**
 * Natural Language Understanding - extracts intent from user message
 */
const analyzeIntent = (prompt, conversationHistory = []) => {
  const lower = prompt.toLowerCase();

  // Extract numbers from prompt
  const numbers = prompt.match(/\d+/g);
  const hasNumbers = numbers && numbers.length > 0;

  // Check for common intents
  const intents = {
    courtCalculation: /\b(how many|number of|calculate|need|require).*(court|venue)/i.test(prompt) ||
                     /\b(court).*(need|require|calculation)/i.test(prompt),
    eventSuggestion: /\b(what|which|suggest|recommend|create).*(event|division|category)/i.test(prompt) ||
                    /\b(event).*(should|create|suggest|recommend)/i.test(prompt),
    scheduling: /\b(schedule|timing|when|time|organize).*(match|game|event)/i.test(prompt) ||
               /\b(create|make|generate).*(schedule)/i.test(prompt),
    pricing: /\b(price|cost|fee|charge|how much).*(entry|registration|tournament)/i.test(prompt) ||
            /\b(entry fee|pricing|cost)/i.test(prompt),
    format: /\b(format|type|style).*(tournament|bracket|play)/i.test(prompt) ||
           /\b(round robin|single elimination|double elimination)/i.test(prompt),
    skillLevel: /\b(skill|rating|level|ability).*(player|division)/i.test(prompt),
    general: true // Always matches as fallback
  };

  // Determine primary intent
  for (const [intent, matches] of Object.entries(intents)) {
    if (matches && intent !== 'general') {
      return { intent, hasNumbers, numbers, conversationHistory };
    }
  }

  return { intent: 'general', hasNumbers, numbers, conversationHistory };
};

/**
 * Generate natural, conversational responses
 */
const generateResponse = async (intent, prompt, tournament, context) => {
  const analysis = analyzeIntent(prompt, context.conversationHistory || []);

  let response = {
    type: 'text',
    message: '',
    data: null,
    suggestions: []
  };

  // Court Calculation Intent
  if (analysis.intent === 'courtCalculation') {
    const players = analysis.numbers ? parseInt(analysis.numbers[0]) : context.expectedPlayers || tournament.maxPlayers || 64;
    const hours = analysis.numbers && analysis.numbers.length > 1 ? parseInt(analysis.numbers[1]) : context.hoursAvailable || 8;

    const courtCalc = calculateCourtRequirements({
      totalPlayers: players,
      hoursAvailable: hours,
      matchDuration: context.matchDuration || 30
    });

    const variations = [
      `Great question! Let me help you figure out the court requirements for your tournament.\n\nFor **${players} players** playing over **${hours} hours**, here's what I'd recommend:\n\n${courtCalc.reasoning}\n\n**Quick Summary:**\n- Minimum viable: ${courtCalc.minimum} courts\n- Recommended: ${courtCalc.recommended} courts\n- Optimal setup: ${courtCalc.optimal} courts\n\nThe optimal number gives you buffer time for delays and keeps things running smoothly. Would you like me to help plan a schedule based on these court numbers?`,

      `I'd be happy to help with that! Based on your tournament size, here's my analysis:\n\nWith **${players} players** and **${hours} hours** of play time, you'll want to aim for **${courtCalc.recommended} courts** as your baseline. Here's why:\n\n${courtCalc.reasoning}\n\nI always recommend having at least one extra court (so ${courtCalc.optimal} total) to handle:\n- Equipment issues\n- Scheduling flexibility  \n- Simultaneous matches during peak times\n\nShould I help you create a detailed schedule for these courts?`,

      `Let me break down the court math for you!\n\nTournament specs:\n- ${players} players\n- ${hours} hours available\n- ~30 minute matches\n\n**Court Requirements:**\n- **Minimum**: ${courtCalc.minimum} courts (tight schedule, no room for delays)\n- **Recommended**: ${courtCalc.recommended} courts (balanced approach)\n- **Optimal**: ${courtCalc.optimal} courts (best player experience)\n\n${courtCalc.reasoning}\n\nWant me to show you how the schedule would look with different court counts?`
    ];

    response.message = variations[Math.floor(Math.random() * variations.length)];
    response.type = 'court-calculation';
    response.data = courtCalc;
    response.suggestions = [
      'Create a schedule with these courts',
      'What if I have fewer courts?',
      'Show me event suggestions',
      'Help with pricing'
    ];
  }

  // Event Suggestion Intent
  else if (analysis.intent === 'eventSuggestion') {
    const events = suggestEvents(context || {});
    const popularEvents = events.filter(e =>
      ['3.5', '4.0', '4.5'].includes(e.skillLevel) &&
      ['doubles', 'mixed-doubles'].includes(e.format)
    ).slice(0, 6);

    const variations = [
      `I'd love to help you set up your events! Based on typical pickleball tournament structures, here are my top recommendations:\n\nThese skill levels and formats are consistently the most popular:\n\n**Why these events?**\n- 3.5-4.5 skill range covers the largest player demographic\n- Doubles and Mixed Doubles have the highest participation rates\n- This combination maximizes registration while keeping logistics manageable\n\nEach event would accommodate 16 teams with round-robin play, which creates great competition without being overwhelming.\n\nWant me to create all of these events for you? I can set them up in one click!`,

      `Great timing! Let me suggest some events that consistently perform well:\n\nI'm recommending these specific divisions because:\n\n1. **Skill Level Focus (3.5-4.5)**: This is where 70% of recreational players fall\n2. **Format Mix**: Doubles and Mixed Doubles attract different crowds and maximize participation\n3. **Proven Structure**: Round-robin format with 16 teams per event creates 4-5 matches per team\n\nThese aren't just random picks—this combination typically yields:\n- Higher registration rates\n- Better competitive balance  \n- Easier bracket management\n\nShould I go ahead and create these events for your tournament?`,

      `Perfect! Let's build out your event lineup. Here's what I'm thinking:\n\nBased on successful tournaments I've seen, I'd recommend starting with these 6 events. They hit the sweet spot between variety and manageability.\n\n**The Strategy:**\n- Focus on the 3.5-4.5 skill range (where most players compete)\n- Offer both Doubles and Mixed Doubles (appeals to different demographics)\n- Keep it to 16 teams per event (perfect for round-robin brackets)\n\nThis gives players options without overwhelming your tournament logistics. Plus, you can always add more events later if demand is high!\n\nReady to create these? Just say the word and I'll set them all up!`
    ];

    response.message = variations[Math.floor(Math.random() * variations.length)];
    response.type = 'event-suggestions';
    response.data = popularEvents;
    response.suggestions = [
      'Yes, create these events!',
      'Customize the skill levels',
      'Add singles events too',
      'How should I price these?'
    ];
  }

  // Scheduling Intent
  else if (analysis.intent === 'scheduling') {
    const events = tournament.events || [];

    if (events.length === 0) {
      response.message = `I'd love to help with scheduling, but I notice you haven't created any events yet!\n\nHere's what I recommend:\n\n1. **First**, let's set up your events (I can suggest some popular ones)\n2. **Then**, I'll create an optimized schedule that:\n   - Maximizes court usage\n   - Minimizes player wait times\n   - Accounts for setup/teardown between brackets\n\nWant me to suggest some events to get started?`;
      response.suggestions = ['Suggest events for me', 'I\'ll create events manually'];
    } else {
      const schedule = generateSchedule({
        events: events.map(e => ({ name: e.name, maxTeams: e.maxTeams })),
        startTime: context.startTime || '9:00 AM',
        courts: tournament.venue?.courts || 4,
        matchDuration: context.matchDuration || 30
      });

      const variations = [
        `Excellent! Let me create an optimized schedule for your ${events.length} events.\n\nI've analyzed your setup and here's my recommended timeline:\n\n**Scheduling Strategy:**\n- Staggered start times to maximize court usage\n- 30-minute buffer between events for transitions\n- Peak court usage during mid-day to keep energy high\n\nThis schedule assumes ${tournament.venue?.courts || 4} courts and should keep things flowing smoothly. The key is having some flexibility—I've built in buffer time for unexpected delays.\n\nWant me to adjust the start times or add more breaks?`,

        `Got it! Here's your optimized tournament schedule:\n\nI've structured this to:\n- Keep courts consistently busy (minimizes downtime)\n- Give players rest between matches\n- Allow time for bracket updates and score reporting\n\nWith ${tournament.venue?.courts || 4} courts available, this timeline works really well. Each event gets adequate time without feeling rushed.\n\nThe schedule totals about ${Math.ceil(schedule.reduce((sum, s) => sum + parseInt(s.estimatedDuration), 0) / events.length)} hours per event on average—good pacing for player experience!\n\nNeed any adjustments to the timing?`
      ];

      response.message = variations[Math.floor(Math.random() * variations.length)];
      response.type = 'schedule';
      response.data = schedule;
      response.suggestions = [
        'Adjust start times',
        'Add more buffer time',
        'Optimize for fewer courts',
        'Export this schedule'
      ];
    }
  }

  // Pricing Intent
  else if (analysis.intent === 'pricing') {
    const avgEntryFee = tournament.events?.length > 0
      ? tournament.events.reduce((sum, e) => sum + (e.entryFee || 0), 0) / tournament.events.length
      : 45;

    const variations = [
      `Great question! Pricing can make or break registration numbers. Here's my data-driven recommendation:\n\n**Standard Pricing Structure:**\n- **Singles Events**: $50-60 per player\n  - Individual format, no partner needed\n  - Typically higher price point\n\n- **Doubles Events**: $40-50 per player  \n  - Team format, lower per-person cost\n  - Most popular format\n\n- **Mixed Doubles**: $45-55 per player\n  - Sweet spot pricing\n  - High participation rates\n\n**Pro Tips:**\n1. Early bird discount (10-15% off if registered 2+ weeks early)\n2. Multi-event package ($10 off when entering 2+ events)\n3. Consider venue costs, prizes, and ref fees in your math\n\nYour current average is **$${Math.round(avgEntryFee)}** which is ${avgEntryFee >= 45 ? 'right in the sweet spot!' : 'a bit low—you might want to increase it.'}\n\nWant help adjusting your event prices?`,

      `Let me share some pricing insights based on successful tournaments:\n\nThe key is balancing affordability with covering your costs. Here's the breakdown:\n\n**Pricing by Format:**\n- Singles: $50-60 (premium pricing for individual play)\n- Doubles: $40-50 (volume play, most registrations)\n- Mixed: $45-55 (balanced approach)\n\n**Why these numbers?**\n- They're competitive with regional tournaments\n- Cover typical venue + equipment costs\n- Leave room for prize pools\n\nYou're currently averaging **$${Math.round(avgEntryFee)} per entry**. That's ${avgEntryFee >= 45 ? 'solid!' : 'on the lower end.'}\n\n**Bonus Strategy:** Offer a "Tournament Pass" (all events) for $120-140. Players love the discount, and you get more entries per person!\n\nShould I suggest specific prices for your events?`,

      `Pricing strategy time! Let's find the sweet spot for your tournament:\n\n**Market-Rate Pricing:**\n\nSingles → $55 avg\nDoubles → $45 avg  \nMixed → $50 avg\n\nThese prices are based on:\n- Current market rates in most regions\n- Balance between accessibility and profitability\n- Player perception of value\n\n**Your Tournament:**\nCurrent average: $${Math.round(avgEntryFee)}\n${avgEntryFee >= 45 ? '✓ Right on target!' : '⚠ Consider increasing to cover costs'}\n\n**Revenue Boosters:**\n- Early registration discount (creates urgency)\n- Multi-event bundles (increases per-player revenue)\n- Spectator passes if you have big draws\n\nWant me to calculate your potential revenue with these price points?`
    ];

    response.message = variations[Math.floor(Math.random() * variations.length)];
    response.type = 'pricing-advice';
    response.suggestions = [
      'Set all events to market rate',
      'Create early bird pricing',
      'Calculate revenue projections',
      'Help with refund policy'
    ];
  }

  // Format/Structure Intent
  else if (analysis.intent === 'format') {
    const variations = [
      `Tournament format is crucial! Let me break down the most popular options:\n\n**Round-Robin** (Most Popular)\n✓ Every team plays every other team\n✓ Guaranteed multiple matches per player\n✓ Best for skill assessment\n✗ Requires more time\n✗ Needs more court space\n\n**Single Elimination**\n✓ Fast and exciting\n✓ Minimal court requirements\n✓ Clear winner path\n✗ Half the teams go home after 1 match\n✗ Less fair for skill evaluation\n\n**Pool Play → Playoffs** (Recommended for larger tournaments)\n✓ Best of both worlds\n✓ Guaranteed matches + championship bracket\n✓ Great player experience\n✗ More complex to organize\n\n**My Recommendation:** Start with round-robin for events under 16 teams. It gives players the best experience and ensures everyone gets their money's worth!\n\nWhat size tournament are you planning?`,

      `Great question! Format choice depends on your goals. Here's how I think about it:\n\n**For 8-16 Teams:**\n→ **Round-Robin** is perfect\n- Everyone plays 7-15 matches\n- Clear skill rankings\n- Best competitive experience\n\n**For 17-32 Teams:**\n→ **Pool Play + Single Elim Playoffs**  \n- Pools of 4-6 teams (round-robin)\n- Top 2 from each pool advance\n- Playoff bracket for finals\n\n**For 32+ Teams:**\n→ **Modified Double Elimination**\n- Winners bracket + losers bracket\n- More forgiving of early losses\n- Still crowns a clear champion\n\n**The Real Talk:**\nRound-robin is always best for player satisfaction (more matches = better value). But if you're time or court-constrained, pool play with playoffs is the sweet spot.\n\nWhat's your team count looking like?`,

      `Let's find the right format for your tournament! Here are the pros and cons:\n\n🏆 **Round-Robin**\nBest for: 8-16 teams, skill-focused events\nTime: 3-6 hours per event  \nWhy it's great: Everyone plays everyone, true skill rankings\n\n⚡ **Single Elimination**  \nBest for: Large fields (32+ teams), time constraints\nTime: 2-3 hours per event\nWhy it's great: Fast, exciting, simple bracket\n\n🎯 **Pool + Playoffs** (My favorite!)\nBest for: 20-32 teams, championship feel\nTime: 4-5 hours per event\nWhy it's great: Guarantees multiple matches + championship drama\n\nThe format should match your tournament goals:\n- Recreational/community focus? → Round-robin\n- Competitive championship? → Pool + playoffs  \n- Large registration? → Modified elimination\n\nWhat's the vibe you're going for?`
    ];

    response.message = variations[Math.floor(Math.random() * variations.length)];
    response.suggestions = [
      'Help me choose the best format',
      'Explain playoff structures',
      'What about Swiss format?',
      'Show bracket examples'
    ];
  }

  // Skill Level Intent
  else if (analysis.intent === 'skillLevel') {
    const variations = [
      `Skill level divisions are super important! Here's how to think about them:\n\n**Standard Pickleball Skill Levels:**\n- **2.5-3.0**: Beginners, learning fundamentals\n- **3.5**: Intermediate, most recreational players\n- **4.0**: Advanced, consistent competitive play\n- **4.5**: Very advanced, tournament regulars\n- **5.0+**: Elite/professional level\n\n**My Recommendation for Most Tournaments:**\nFocus on **3.5, 4.0, and 4.5** divisions. Here's why:\n\n1. **3.5**: Captures the bulk of recreational players (largest registration pool)\n2. **4.0**: Serious intermediates who play regularly\n3. **4.5**: Advanced players who want real competition\n\nYou can use **"X.X+"** formatting (like "3.5+") meaning "3.5 and above" to be inclusive while maintaining competition balance.\n\n**Pro Tip:** Don't over-segment! Too many divisions = small brackets with not enough matches. Better to have 3 well-filled divisions than 6 sparse ones.\n\nNeed help setting up your skill divisions?`,

      `Let's talk skill levels! This is where many organizers overthink it.\n\n**The Simple Truth:**\nMost players fall into 3.0-4.5 range. So your divisions should reflect that.\n\n**Smart Division Strategy:**\n\n**Option A: Three Divisions** (Recommended)\n- 3.0-3.5 (Recreational)\n- 3.5-4.5 (Intermediate)  \n- 4.5+ (Advanced)\n\n**Option B: Four Divisions** (If you expect 50+ players)\n- 3.5 and under\n- 3.5-4.0\n- 4.0-4.5\n- 4.5+\n\n**The Key:** Use "+" ratings flexibly. A 3.5+ event can include 3.5, 4.0, and 4.5 players—creates better competition than super narrow brackets.\n\nMost importantly: **Trust players to self-select honestly**. Include skill level descriptions in your registration so people know where they fit.\n\nShould I suggest events with these divisions?`,

      `Skill divisions can make or break your tournament experience! Let me guide you:\n\n**The Skill Level Reality:**\n\n📊 **Player Distribution (typical):**\n- Beginner (2.5-3.0): 15%\n- Recreational (3.5): 40%  \n- Intermediate (4.0): 30%\n- Advanced (4.5+): 15%\n\n**Based on this, your divisions should be:**\n\n1. **3.5 Division** - Your largest bracket (expect most entries)\n2. **4.0 Division** - Solid intermediate competition  \n3. **4.5+ Division** - Advanced/open play\n\nIf you get enough interest, you can add:\n- 3.0 Division (beginner-friendly)\n- 5.0 Division (elite players)\n\n**Red Flag:** Don't create divisions like "3.6-3.9" or "4.1-4.3". Too granular = tiny brackets with 4-5 teams. Not fun for anyone!\n\n**Best Practice:** Describe skill levels in your marketing:\n- 3.5: "Consistent basic shots, working on strategy"\n- 4.0: "Strong fundamentals, competitive play"\n- 4.5+: "Advanced shots, tournament experience"\n\nThis helps players self-select accurately. Want me to set up divisions for you?`
    ];

    response.message = variations[Math.floor(Math.random() * variations.length)];
    response.suggestions = [
      'Create events with these divisions',
      'How do I verify skill levels?',
      'What about mixed skill events?',
      'Explain skill level criteria'
    ];
  }

  // General/Unknown Intent
  else {
    // Check if it's a greeting
    if (/\b(hi|hello|hey|greetings|good morning|good afternoon)\b/i.test(prompt)) {
      const greetings = [
        `Hello! 👋 I'm excited to help you plan your tournament!\n\nI can assist with everything from court calculations to event suggestions, scheduling, pricing, and more. What aspect of your tournament would you like to work on first?`,
        `Hey there! Great to meet you! 🎾\n\nI'm your AI tournament planning assistant. I've helped organize countless pickleball tournaments and I'd love to help make yours a success.\n\nWhat are you working on today? Court requirements? Event setup? Scheduling?`,
        `Hi! Welcome to the AI Tournament Planner! 🚀\n\nI'm here to take the stress out of tournament organization. Whether you're planning your first tournament or your fiftieth, I can help with:\n\n- Court calculations\n- Event recommendations  \n- Schedule optimization\n- Pricing strategies\n- And much more!\n\nWhat can I help you with?`
      ];
      response.message = greetings[Math.floor(Math.random() * greetings.length)];
    }
    // Check if it's a thank you
    else if (/\b(thank|thanks|appreciate|grateful)\b/i.test(prompt)) {
      const thanks = [
        `You're very welcome! I'm here whenever you need help. 😊\n\nIs there anything else you'd like to work on for your tournament?`,
        `Happy to help! That's what I'm here for! 🎉\n\nFeel free to ask me anything else about your tournament planning.`,
        `My pleasure! I love helping organizers create amazing tournaments. 🏆\n\nLet me know if you need anything else!`
      ];
      response.message = thanks[Math.floor(Math.random() * thanks.length)];
    }
    // Follow-up or conversational
    else if (context.conversationHistory && context.conversationHistory.length > 2) {
      response.message = `I want to make sure I understand what you're asking about. Could you provide a bit more detail?\n\nFor example:\n- "How many courts do I need for 64 players?"\n- "What events should I create?"\n- "Help me with scheduling"\n- "Pricing recommendations for my tournament"\n\nWhat specific aspect of tournament planning can I help you with?`;
    }
    // First time / unclear
    else {
      const fallbacks = [
        `I'm not quite sure I understand what you're asking. Let me share what I can help with:\n\n**Tournament Planning Areas:**\n- 📊 Court calculations (figure out how many courts you need)\n- 🎯 Event suggestions (recommend divisions and formats)\n- ⏰ Schedule optimization (create efficient timelines)\n- 💰 Pricing strategy (set competitive entry fees)\n- 🏆 Format selection (round-robin vs elimination)\n\nCould you rephrase your question or pick one of these topics?`,

        `Hmm, I want to make sure I give you the right information! \n\nI specialize in helping with:\n\n1. **Court Planning** - Calculate requirements based on player count\n2. **Event Setup** - Suggest popular divisions and formats\n3. **Scheduling** - Create optimized match schedules\n4. **Pricing** - Recommend entry fee structures\n5. **Tournament Formats** - Choose the best competitive structure\n\nWhat would you like help with? Feel free to ask in plain English!`,

        `I'm here to help, but I need a bit more context! 🤔\n\nI'm really good at:\n- Crunching numbers (courts, schedules, costs)\n- Suggesting events and divisions\n- Explaining tournament formats\n- Optimizing logistics\n\nTry asking me something like:\n- "I have 50 players and 4 courts, what should I do?"\n- "What events are most popular?"\n- "How should I price my tournament?"\n\nWhat's on your mind?`
      ];
      response.message = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    response.suggestions = [
      'Calculate court requirements',
      'Suggest events',
      'Help with scheduling',
      'Pricing advice'
    ];
  }

  return response;
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

    // Generate natural language response
    const response = await generateResponse(null, prompt, tournament, context);

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

        result.message = `Successfully created ${createdEvents.length} events! Check your Events tab to see them.`;
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
