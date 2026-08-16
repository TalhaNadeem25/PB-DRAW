// Helper functions to emit socket events from controllers

/**
 * Emit match update to all connected clients in match and tournament rooms
 */
export const emitMatchUpdate = (io, matchId, tournamentId, eventId, matchData) => {
  if (!io) {
    console.warn('⚠️  Socket.IO not available (serverless environment) - skipping real-time emit');
    return;
  }

  // Emit to match room
  io.to(`match:${matchId}`).emit('match-updated', matchData);

  // Emit to tournament room
  io.to(`tournament:${tournamentId}`).emit('match-updated', matchData);

  // Emit to event room (if needed in future)
  if (eventId) {
    io.to(`event:${eventId}`).emit('match-updated', matchData);
  }

  console.log(`🏓 Match update emitted for match:${matchId}`);
};

/**
 * Emit match score update
 */
export const emitMatchScoreUpdate = (io, matchId, tournamentId, scoreData) => {
  if (!io) {
    console.warn('⚠️  Socket.IO not available (serverless environment) - skipping real-time emit');
    return;
  }

  io.to(`match:${matchId}`).emit('score-updated', scoreData);
  io.to(`tournament:${tournamentId}`).emit('score-updated', scoreData);

  console.log(`📊 Score update emitted: ${scoreData.team1Score}-${scoreData.team2Score}`);
};

/**
 * Emit tournament update
 */
export const emitTournamentUpdate = (io, tournamentId, tournamentData) => {
  if (!io) {
    console.warn('⚠️  Socket.IO not available (serverless environment) - skipping real-time emit');
    return;
  }

  io.to(`tournament:${tournamentId}`).emit('tournament-updated', tournamentData);

  console.log(`🏆 Tournament update emitted for tournament:${tournamentId}`);
};

/**
 * Emit a new club chat message to everyone in that club's room
 */
export const emitClubMessage = (io, clubId, messageData) => {
  if (!io) {
    console.warn('⚠️  Socket.IO not available (serverless environment) - skipping real-time emit');
    return;
  }

  io.to(`club:${clubId}`).emit('club-message', messageData);

  console.log(`💬 Club message emitted for club:${clubId}`);
};

/**
 * Emit a club message deletion to everyone in that club's room
 */
export const emitClubMessageDeleted = (io, clubId, messageId) => {
  if (!io) {
    console.warn('⚠️  Socket.IO not available (serverless environment) - skipping real-time emit');
    return;
  }

  io.to(`club:${clubId}`).emit('club-message-deleted', { messageId });
};

/**
 * Send notification to a specific user
 */
export const notifyPlayer = (io, userId, notification) => {
  if (!io) {
    console.warn('⚠️  Socket.IO not available (serverless environment) - skipping notification');
    return;
  }

  io.to(`user:${userId}`).emit('notification', notification);

  console.log(`🔔 Notification sent to user:${userId}`);
};

/**
 * Send notification to all players in a team
 */
export const notifyTeamPlayers = async (io, teamId, notification) => {
  if (!io) {
    console.warn('⚠️  Socket.IO not available (serverless environment) - skipping team notification');
    return;
  }

  try {
    // Dynamically import Team model to avoid circular dependencies
    const Team = (await import('../models/Team.js')).default;

    const team = await Team.findById(teamId).populate('players', '_id');

    if (team && team.players) {
      team.players.forEach(player => {
        io.to(`user:${player._id.toString()}`).emit('notification', notification);
      });

      console.log(`🔔 Notification sent to ${team.players.length} team players`);
    }
  } catch (error) {
    console.error('Error notifying team players:', error);
  }
};
