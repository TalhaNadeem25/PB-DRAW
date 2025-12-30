import Invitation from '../models/Invitation.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { sendTeamInvitationEmail } from '../services/emailService.js';

// @desc    Create/send team invitation
// @route   POST /api/teams/:teamId/invitations
// @access  Private
export const sendInvitation = async (req, res, next) => {
  try {
    const { inviteeEmail, inviteeName, message, sendEmail = true } = req.body;
    const teamId = req.params.teamId;

    // Get team and verify user is a member
    const team = await Team.findById(teamId)
      .populate('players')
      .populate({
        path: 'event',
        populate: {
          path: 'tournament',
          select: 'name'
        }
      });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is part of the team
    const isTeamMember = team.players.some(
      player => player._id.toString() === req.user.id
    );

    if (!isTeamMember && req.user.role !== 'organizer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send invitations for this team'
      });
    }

    // Check if team is already full
    const event = team.event;
    const maxPlayers = event.format === 'singles' ? 1 : 2;
    if (team.players.length >= maxPlayers) {
      return res.status(400).json({
        success: false,
        message: 'Team is already full'
      });
    }

    // Check if there's already a pending invitation for this email and team
    const existingInvitation = await Invitation.findOne({
      team: teamId,
      inviteeEmail: inviteeEmail.toLowerCase(),
      status: 'pending'
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'An invitation has already been sent to this email for this team'
      });
    }

    // Check if invitee is already on the team
    const inviteeUser = await User.findOne({ email: inviteeEmail.toLowerCase() });
    if (inviteeUser) {
      const isAlreadyMember = team.players.some(
        player => player._id.toString() === inviteeUser._id.toString()
      );
      if (isAlreadyMember) {
        return res.status(400).json({
          success: false,
          message: 'This user is already on the team'
        });
      }
    }

    // Create invitation
    const invitation = await Invitation.create({
      team: teamId,
      inviter: req.user.id,
      inviteeEmail: inviteeEmail.toLowerCase(),
      inviteeName,
      invitee: inviteeUser?._id || null,
      message
    });

    // Send invitation email (only if sendEmail is true)
    if (sendEmail) {
      try {
        const inviter = await User.findById(req.user.id);

        console.log('Sending team invitation email to:', inviteeEmail);
        console.log('Tournament name:', event.tournament?.name);
        console.log('Event name:', event.name);
        console.log('Team name:', team.name);

        await sendTeamInvitationEmail({
          to: inviteeEmail.toLowerCase(),
          inviteeName: inviteeName || 'Player',
          inviterName: inviter.name,
          teamName: team.name,
          eventName: event.name,
          tournamentName: event.tournament.name,
          invitationId: invitation._id.toString()
        });

        console.log('Team invitation email sent successfully to:', inviteeEmail);
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        console.error('Email error details:', {
          to: inviteeEmail,
          eventName: event?.name,
          tournamentName: event?.tournament?.name,
          error: emailError.message
        });
        // Don't fail the request if email fails
      }
    } else {
      console.log('Invitation created but email sending skipped (will be sent after payment confirmation)');
    }

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: invitation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invitations (sent or received)
// @route   GET /api/invitations?type=received|sent
// @access  Private
export const getInvitations = async (req, res, next) => {
  try {
    const type = req.query.type || 'received';
    let query = {};

    if (type === 'received') {
      // Get invitations for current user's email or user ID
      query = {
        $or: [
          { inviteeEmail: req.user.email.toLowerCase() },
          { invitee: req.user.id }
        ],
        status: 'pending'
      };
    } else if (type === 'sent') {
      // Get invitations sent by current user
      query = {
        inviter: req.user.id
      };
    }

    const invitations = await Invitation.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invitation
// @route   GET /api/invitations/:id
// @access  Private
export const getInvitation = async (req, res, next) => {
  try {
    const invitation = await Invitation.findById(req.params.id)
      .populate('inviter', 'name email')
      .populate({
        path: 'team',
        select: 'name event players',
        populate: {
          path: 'event',
          select: 'name format entryFee skillLevel playFormat maxTeams currentTeams tournament',
          populate: {
            path: 'tournament',
            select: 'name location startDate endDate'
          }
        }
      });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if user is authorized to view this invitation
    const isInviter = invitation.inviter && invitation.inviter._id.toString() === req.user.id;
    const isInvitee = invitation.inviteeEmail === req.user.email.toLowerCase() ||
                     (invitation.invitee && invitation.invitee.toString() === req.user.id);

    if (!isInviter && !isInvitee && req.user.role !== 'organizer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this invitation'
      });
    }

    res.status(200).json({
      success: true,
      data: invitation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept invitation
// @route   PUT /api/invitations/:id/accept
// @access  Private
export const acceptInvitation = async (req, res, next) => {
  try {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if user is the invitee
    const isInvitee = invitation.inviteeEmail === req.user.email.toLowerCase() ||
                     (invitation.invitee && invitation.invitee.toString() === req.user.id);

    if (!isInvitee) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this invitation'
      });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation has already been ${invitation.status}`
      });
    }

    // Check if invitation has expired
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      invitation.status = 'cancelled';
      await invitation.save();
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired'
      });
    }

    // Get team and check if it's still available
    const team = await Team.findById(invitation.team).populate('event');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if team is full
    const maxPlayers = team.event.format === 'singles' ? 1 : 2;
    if (team.players.length >= maxPlayers) {
      return res.status(400).json({
        success: false,
        message: 'Team is already full'
      });
    }

    // Check if user is already on the team
    const isAlreadyMember = team.players.some(
      player => player._id.toString() === req.user.id
    );
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already on this team'
      });
    }

    // Add user to team
    team.players.push(req.user.id);
    await team.save();

    // Update invitation status
    invitation.status = 'accepted';
    invitation.invitee = req.user.id;
    await invitation.save();

    // Cancel other pending invitations for this team
    await Invitation.updateMany(
      {
        team: team._id,
        status: 'pending',
        _id: { $ne: invitation._id }
      },
      { status: 'cancelled' }
    );

    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        invitation,
        team
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Decline invitation
// @route   PUT /api/invitations/:id/decline
// @access  Private
export const declineInvitation = async (req, res, next) => {
  try {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if user is the invitee
    const isInvitee = invitation.inviteeEmail === req.user.email.toLowerCase() ||
                     (invitation.invitee && invitation.invitee.toString() === req.user.id);

    if (!isInvitee) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to decline this invitation'
      });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation has already been ${invitation.status}`
      });
    }

    // Update invitation status
    invitation.status = 'declined';
    invitation.invitee = req.user.id;
    await invitation.save();

    res.status(200).json({
      success: true,
      message: 'Invitation declined',
      data: invitation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel invitation
// @route   DELETE /api/invitations/:id
// @access  Private
export const cancelInvitation = async (req, res, next) => {
  try {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if user is the inviter
    const isInviter = invitation.inviter._id.toString() === req.user.id;

    if (!isInviter && req.user.role !== 'organizer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this invitation'
      });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel invitation that has been ${invitation.status}`
      });
    }

    // Update invitation status
    invitation.status = 'cancelled';
    await invitation.save();

    res.status(200).json({
      success: true,
      message: 'Invitation cancelled',
      data: invitation
    });
  } catch (error) {
    next(error);
  }
};
