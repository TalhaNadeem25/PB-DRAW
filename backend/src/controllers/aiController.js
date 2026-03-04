const PICKLIX_SYSTEM_PROMPT = `You are Picklix AI, an expert pickleball tournament planning assistant built into the Picklix platform.

You help organizers plan tournaments: creating them, suggesting events, generating schedules, and calculating court requirements.

CRITICAL: You MUST always respond with valid JSON in this exact format:
{
  "message": "Your conversational response here",
  "action": null,
  "data": null
}

OR if you are suggesting an action:
{
  "message": "Your conversational response here",
  "action": "create-tournament" | "suggest-events" | "generate-schedule" | "calculate-courts",
  "data": { ... action-specific data ... }
}

ACTION DATA FORMATS:

For "create-tournament":
{
  "name": "Tournament Name",
  "description": "Brief description",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "registrationDeadline": "YYYY-MM-DD",
  "maxPlayers": 64,
  "status": "upcoming",
  "venue": {
    "name": "Venue Name",
    "address": "Street Address",
    "city": "City",
    "state": "State",
    "courts": 6
  },
  "events": [
    {
      "name": "Mixed Doubles 3.5+",
      "format": "mixed-doubles",
      "skillLevel": "3.5",
      "maxTeams": 16,
      "entryFee": 45,
      "playFormat": "round-robin"
    }
  ]
}

For "suggest-events":
[
  {
    "name": "Event Name",
    "format": "singles" | "doubles" | "mixed-doubles",
    "skillLevel": "3.0" | "3.5" | "4.0" | "4.5" | "5.0",
    "maxTeams": 16,
    "entryFee": 45,
    "playFormat": "round-robin" | "single-elimination" | "double-elimination"
  }
]

For "generate-schedule":
[
  {
    "eventName": "Event Name",
    "startTime": "9:00 AM",
    "estimatedDuration": "3 hours",
    "courtsUsed": 4,
    "rounds": 6
  }
]

For "calculate-courts":
{
  "recommended": 6,
  "minimum": 4,
  "optimal": 8,
  "reasoning": "Explanation of the calculation"
}

Rules:
- Always respond in JSON only — no text outside the JSON
- Be helpful, encouraging, and specific
- Use realistic dates (year 2025-2026)
- Entry fees typically: singles $50-60, doubles $40-50, mixed-doubles $45-55
- Standard skill levels: 3.0, 3.5, 4.0, 4.5, 5.0
- Court time: ~30 minutes per match
- Only suggest create-tournament when the user explicitly wants to create one`;

export const picklixChat = async (req, res, next) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const apiKey = process.env.APIFREELLM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'AI service not configured' });
    }

    // Build conversation context from history (last 6 turns)
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    const historyText = recentHistory
      .map(turn => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`)
      .join('\n');

    const fullPrompt = [
      PICKLIX_SYSTEM_PROMPT,
      historyText || null,
      `User: ${message}`,
      'Respond with JSON only.'
    ].filter(Boolean).join('\n\n');

    const apiResponse = await fetch('https://apifreellm.com/api/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ message: fullPrompt })
    });

    if (!apiResponse.ok) {
      throw new Error(`APIFREELLM error: ${apiResponse.status}`);
    }

    const apiData = await apiResponse.json();
    const rawText = apiData.response || apiData.message || '';

    // Parse JSON response
    let parsed = { message: rawText, action: null, data: null };
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const candidate = JSON.parse(jsonMatch[0]);
        if (candidate.message) {
          parsed = {
            message: candidate.message,
            action: candidate.action || null,
            data: candidate.data || null
          };
        }
      }
    } catch {
      // Use raw text as message if JSON parsing fails
    }

    return res.status(200).json({ success: true, data: parsed });
  } catch (error) {
    next(error);
  }
};
