import Tournament from '../models/Tournament.js';
import Event from '../models/Event.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Public
export const getTournaments = async (req, res, next) => {
  try {
    const { status, search, limit = 10, page = 1 } = req.query;

    // Build query
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const tournaments = await Tournament.find(query)
      .populate('organizer', 'name email')
      .populate('events')
      .sort({ startDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Tournament.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tournaments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: tournaments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tournament
// @route   GET /api/tournaments/:id
// @access  Public
export const getTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', 'name email phone')
      .populate({
        path: 'events',
        populate: {
          path: 'teams pools',
          select: 'name players status'
        }
      })
      .populate('registeredPlayers', 'name email skillLevel');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create tournament
// @route   POST /api/tournaments
// @access  Private (Organizer/Admin)
export const createTournament = async (req, res, next) => {
  try {
    // Add organizer from logged in user
    req.body.organizer = req.user.id;

    const tournament = await Tournament.create(req.body);

    // Add tournament to user's createdTournaments
    req.user.createdTournaments.push(tournament._id);
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tournament
// @route   PUT /api/tournaments/:id
// @access  Private (Organizer/Admin)
export const updateTournament = async (req, res, next) => {
  try {
    let tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is tournament organizer or admin
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this tournament'
      });
    }

    tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Tournament updated successfully',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tournament
// @route   DELETE /api/tournaments/:id
// @access  Private (Organizer/Admin)
export const deleteTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is tournament organizer or admin
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this tournament'
      });
    }

    // Delete all related events
    await Event.deleteMany({ tournament: tournament._id });

    await tournament.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Tournament deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register for tournament
// @route   POST /api/tournaments/:id/register
// @access  Private
export const registerForTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if registration is open
    if (tournament.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Registration is not open for this tournament'
      });
    }

    // Check if already registered
    if (tournament.registeredPlayers.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this tournament'
      });
    }

    // Check if tournament is full
    if (tournament.currentPlayers >= tournament.maxPlayers) {
      return res.status(400).json({
        success: false,
        message: 'Tournament is full'
      });
    }

    // Add player to tournament
    tournament.registeredPlayers.push(req.user.id);
    tournament.currentPlayers += 1;
    await tournament.save();

    // Add tournament to user's tournaments
    req.user.tournaments.push(tournament._id);
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Successfully registered for tournament',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload tournament image
// @route   POST /api/tournaments/:id/upload-image
// @access  Private (Organizer/Admin)
export const uploadTournamentImage = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check ownership
    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this tournament'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Delete old image from Cloudinary if exists
    if (tournament.image) {
      try {
        // Extract public_id from image URL
        const urlParts = tournament.image.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `pickle-rally/tournaments/${filename.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Continue even if deletion fails
      }
    }

    // Update tournament with new image URL from Cloudinary
    tournament.image = req.file.path;
    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Tournament image uploaded successfully',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};
