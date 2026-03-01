import Tournament from '../models/Tournament.js';
import User from '../models/User.js';

/**
 * Public stats for homepage social proof (no auth required).
 * @route   GET /api/stats/public
 * @access  Public
 */
export const getPublicStats = async (req, res, next) => {
  try {
    const [tournamentsRun, organizersCount] = await Promise.all([
      Tournament.countDocuments({ status: { $in: ['open', 'in-progress', 'completed'] } }),
      User.countDocuments({ role: 'organizer' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        tournamentsRun,
        organizersCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
