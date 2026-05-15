import Payment from '../models/Payment.js';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get organization analytics
// @route   GET /api/analytics/organization/:userId
// @access  Private (organizer/admin)
export const getOrganizationAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, tournamentId } = req.query;

    // Verify authorization: user can only view their own analytics or admins can view any
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view these analytics'
      });
    }

    // Build tournament filter
    const tournamentFilter = { organizer: userId };
    if (tournamentId) {
      tournamentFilter._id = tournamentId;
    }
    if (startDate || endDate) {
      tournamentFilter.startDate = {};
      if (startDate) tournamentFilter.startDate.$gte = new Date(startDate);
      if (endDate) tournamentFilter.startDate.$lte = new Date(endDate);
    }

    // Get tournaments for this organizer
    const tournaments = await Tournament.find(tournamentFilter).populate('events');
    const tournamentIds = tournaments.map(t => t._id);

    if (tournamentIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          revenue: {
            total: 0,
            platformFees: 0,
            netRevenue: 0,
            perEvent: [],
            averagePayment: 0
          },
          registrations: {
            totalTeams: 0,
            paidTeams: 0,
            fillRate: 0,
            completionRate: 0,
            perEvent: []
          },
          demographics: {
            skillLevels: [],
            locations: []
          },
          eventPopularity: [],
          summary: {
            totalTournaments: 0,
            totalEvents: 0,
            uniqueParticipants: 0
          }
        }
      });
    }

    // 1. REVENUE ANALYTICS
    const revenueData = await Payment.aggregate([
      {
        $match: {
          tournament: { $in: tournamentIds },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
        }
      }
    ]);

    // Calculate platform fees and net revenue
    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const paymentCount = revenueData[0]?.paymentCount || 0;

    // Get average platform fee from tournaments (in case it varies)
    const avgPlatformFeePercent = tournaments.reduce((sum, t) => sum + (t.platformFeePercent || 10), 0) / tournaments.length;
    const platformFees = totalRevenue * (avgPlatformFeePercent / 100);
    const netRevenue = totalRevenue - platformFees;
    const averagePayment = paymentCount > 0 ? totalRevenue / paymentCount : 0;

    // Revenue per event (using eventBreakdown)
    const revenuePerEvent = await Payment.aggregate([
      {
        $match: {
          tournament: { $in: tournamentIds },
          status: 'completed'
        }
      },
      { $unwind: '$eventBreakdown' },
      {
        $group: {
          _id: {
            eventId: '$eventBreakdown.eventId',
            eventName: '$eventBreakdown.eventName'
          },
          revenue: { $sum: '$eventBreakdown.amount' },
          registrations: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      {
        $project: {
          _id: 0,
          eventId: '$_id.eventId',
          eventName: '$_id.eventName',
          revenue: 1,
          registrations: 1
        }
      }
    ]);

    // 2. REGISTRATION METRICS
    const eventIds = tournaments.flatMap(t => t.events.map(e => e._id));

    const registrationData = await Team.aggregate([
      {
        $match: {
          event: { $in: eventIds }
        }
      },
      {
        $group: {
          _id: null,
          totalTeams: { $sum: 1 },
          paidTeams: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const totalTeams = registrationData[0]?.totalTeams || 0;
    const paidTeams = registrationData[0]?.paidTeams || 0;
    const completionRate = totalTeams > 0 ? (paidTeams / totalTeams) * 100 : 0;

    // Registration metrics per event
    const registrationsPerEvent = await Team.aggregate([
      {
        $match: {
          event: { $in: eventIds }
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData'
        }
      },
      { $unwind: '$eventData' },
      {
        $group: {
          _id: '$event',
          eventName: { $first: '$eventData.name' },
          maxTeams: { $first: '$eventData.maxTeams' },
          totalTeams: { $sum: 1 },
          paidTeams: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          eventId: '$_id',
          eventName: 1,
          maxTeams: 1,
          totalTeams: 1,
          paidTeams: 1,
          fillRate: {
            $multiply: [
              { $divide: ['$totalTeams', '$maxTeams'] },
              100
            ]
          },
          completionRate: {
            $multiply: [
              { $divide: ['$paidTeams', '$totalTeams'] },
              100
            ]
          }
        }
      },
      { $sort: { fillRate: -1 } }
    ]);

    // Calculate overall fill rate
    const totalMaxTeams = tournaments.reduce((sum, t) => {
      return sum + t.events.reduce((eSum, e) => eSum + (e.maxTeams || 0), 0);
    }, 0);
    const fillRate = totalMaxTeams > 0 ? (totalTeams / totalMaxTeams) * 100 : 0;

    // 3. PARTICIPANT DEMOGRAPHICS
    // Get all unique players from teams
    const playerIds = await Team.aggregate([
      {
        $match: {
          event: { $in: eventIds }
        }
      },
      { $unwind: '$players' },
      {
        $group: {
          _id: '$players'
        }
      }
    ]);

    const uniquePlayerIds = playerIds.map(p => p._id);

    // Skill level distribution
    const skillLevelDistribution = await User.aggregate([
      {
        $match: {
          _id: { $in: uniquePlayerIds }
        }
      },
      {
        $group: {
          _id: '$skillLevel',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          skillLevel: '$_id',
          count: 1,
          percentage: {
            $multiply: [
              { $divide: ['$count', uniquePlayerIds.length] },
              100
            ]
          }
        }
      },
      { $sort: { skillLevel: 1 } }
    ]);

    // Location distribution (top 10)
    const locationDistribution = await User.aggregate([
      {
        $match: {
          _id: { $in: uniquePlayerIds },
          $or: [
            { 'location.city': { $exists: true, $ne: '' } },
            { 'location.state': { $exists: true, $ne: '' } }
          ]
        }
      },
      {
        $group: {
          _id: {
            city: '$location.city',
            state: '$location.state'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          city: '$_id.city',
          state: '$_id.state',
          count: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 4. EVENT POPULARITY
    const eventPopularity = registrationsPerEvent.map(event => ({
      eventId: event.eventId,
      eventName: event.eventName,
      registrations: event.totalTeams,
      maxTeams: event.maxTeams,
      fillRate: event.fillRate,
      revenue: revenuePerEvent.find(r => r.eventId.toString() === event.eventId.toString())?.revenue || 0
    }));

    // 5. SUMMARY STATISTICS
    const summary = {
      totalTournaments: tournaments.length,
      totalEvents: eventIds.length,
      uniqueParticipants: uniquePlayerIds.length
    };

    res.status(200).json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue,
          platformFees: platformFees,
          netRevenue: netRevenue,
          perEvent: revenuePerEvent,
          averagePayment: averagePayment
        },
        registrations: {
          totalTeams: totalTeams,
          paidTeams: paidTeams,
          fillRate: fillRate,
          completionRate: completionRate,
          perEvent: registrationsPerEvent
        },
        demographics: {
          skillLevels: skillLevelDistribution,
          locations: locationDistribution
        },
        eventPopularity: eventPopularity,
        summary: summary
      }
    });
  } catch (error) {
    console.error('Error in getOrganizationAnalytics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching analytics',
      message: error.message
    });
  }
};

// @desc    Export analytics to CSV
// @route   GET /api/analytics/organization/:userId/export/csv
// @access  Private (organizer/admin)
export const exportAnalyticsCSV = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to export analytics' });
    }

    const analyticsData = await getAnalyticsData(userId, req.query);
    const rows = analyticsData.eventPopularity ?? [];

    // Build CSV in memory — no temp files needed
    const headers = ['Event Name', 'Registrations', 'Max Teams', 'Fill Rate (%)', 'Revenue ($)'];
    const lines = [
      headers.join(','),
      ...rows.map((e) => [
        `"${(e.eventName ?? '').replace(/"/g, '""')}"`,
        e.registrations ?? 0,
        e.maxTeams ?? 0,
        (e.fillRate ?? 0).toFixed(1),
        (e.revenue ?? 0).toFixed(2),
      ].join(',')),
    ];
    const csv = lines.join('\n');

    const filename = `analytics-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Error in exportAnalyticsCSV:', error);
    res.status(500).json({ success: false, error: 'Server error while exporting CSV', message: error.message });
  }
};

// @desc    Export analytics to PDF
// @route   GET /api/analytics/organization/:userId/export/pdf
// @access  Private (organizer/admin)
export const exportAnalyticsPDF = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Verify authorization
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to export analytics'
      });
    }

    // Get analytics data
    const analyticsData = await getAnalyticsData(userId, req.query);

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    const filename = `analytics-${userId}-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Organization Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Revenue Section
    doc.fontSize(16).text('Revenue Overview', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Revenue: $${analyticsData.revenue.total.toFixed(2)}`);
    doc.text(`Platform Fees: $${analyticsData.revenue.platformFees.toFixed(2)}`);
    doc.text(`Net Revenue: $${analyticsData.revenue.netRevenue.toFixed(2)}`);
    doc.text(`Average Payment: $${analyticsData.revenue.averagePayment.toFixed(2)}`);
    doc.moveDown(2);

    // Registration Section
    doc.fontSize(16).text('Registration Metrics', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Teams: ${analyticsData.registrations.totalTeams}`);
    doc.text(`Paid Teams: ${analyticsData.registrations.paidTeams}`);
    doc.text(`Fill Rate: ${analyticsData.registrations.fillRate.toFixed(1)}%`);
    doc.text(`Completion Rate: ${analyticsData.registrations.completionRate.toFixed(1)}%`);
    doc.moveDown(2);

    // Summary Section
    doc.fontSize(16).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Tournaments: ${analyticsData.summary.totalTournaments}`);
    doc.text(`Total Events: ${analyticsData.summary.totalEvents}`);
    doc.text(`Unique Participants: ${analyticsData.summary.uniqueParticipants}`);
    doc.moveDown(2);

    // Event Popularity Table
    if (analyticsData.eventPopularity.length > 0) {
      doc.addPage();
      doc.fontSize(16).text('Event Popularity', { underline: true });
      doc.moveDown();
      doc.fontSize(10);

      analyticsData.eventPopularity.forEach((event, index) => {
        doc.text(`${index + 1}. ${event.eventName}`);
        doc.text(`   Registrations: ${event.registrations}/${event.maxTeams} (${event.fillRate.toFixed(1)}%)`);
        doc.text(`   Revenue: $${event.revenue.toFixed(2)}`);
        doc.moveDown(0.5);
      });
    }

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error in exportAnalyticsPDF:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while exporting PDF',
      message: error.message
    });
  }
};

// Helper function to get analytics data (DRY for export functions)
async function getAnalyticsData(userId, queryParams) {
  const { startDate, endDate, tournamentId } = queryParams;

  // Build tournament filter
  const tournamentFilter = { organizer: userId };
  if (tournamentId) {
    tournamentFilter._id = tournamentId;
  }
  if (startDate || endDate) {
    tournamentFilter.startDate = {};
    if (startDate) tournamentFilter.startDate.$gte = new Date(startDate);
    if (endDate) tournamentFilter.startDate.$lte = new Date(endDate);
  }

  // Get tournaments for this organizer
  const tournaments = await Tournament.find(tournamentFilter).populate('events');
  const tournamentIds = tournaments.map(t => t._id);

  if (tournamentIds.length === 0) {
    return {
      revenue: { total: 0, platformFees: 0, netRevenue: 0, perEvent: [], averagePayment: 0 },
      registrations: { totalTeams: 0, paidTeams: 0, fillRate: 0, completionRate: 0, perEvent: [] },
      demographics: { skillLevels: [], locations: [] },
      eventPopularity: [],
      summary: { totalTournaments: 0, totalEvents: 0, uniqueParticipants: 0 }
    };
  }

  // Revenue analytics
  const revenueData = await Payment.aggregate([
    { $match: { tournament: { $in: tournamentIds }, status: 'completed' } },
    { $group: { _id: null, totalRevenue: { $sum: '$amount' }, paymentCount: { $sum: 1 } } }
  ]);

  const totalRevenue = revenueData[0]?.totalRevenue || 0;
  const paymentCount = revenueData[0]?.paymentCount || 0;
  const avgPlatformFeePercent = tournaments.reduce((sum, t) => sum + (t.platformFeePercent || 10), 0) / tournaments.length;
  const platformFees = totalRevenue * (avgPlatformFeePercent / 100);
  const netRevenue = totalRevenue - platformFees;
  const averagePayment = paymentCount > 0 ? totalRevenue / paymentCount : 0;

  const revenuePerEvent = await Payment.aggregate([
    { $match: { tournament: { $in: tournamentIds }, status: 'completed' } },
    { $unwind: '$eventBreakdown' },
    {
      $group: {
        _id: { eventId: '$eventBreakdown.eventId', eventName: '$eventBreakdown.eventName' },
        revenue: { $sum: '$eventBreakdown.amount' },
        registrations: { $sum: 1 }
      }
    },
    { $sort: { revenue: -1 } },
    {
      $project: {
        _id: 0,
        eventId: '$_id.eventId',
        eventName: '$_id.eventName',
        revenue: 1,
        registrations: 1
      }
    }
  ]);

  // Registration metrics
  const eventIds = tournaments.flatMap(t => t.events.map(e => e._id));

  const registrationData = await Team.aggregate([
    { $match: { event: { $in: eventIds } } },
    {
      $group: {
        _id: null,
        totalTeams: { $sum: 1 },
        paidTeams: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } }
      }
    }
  ]);

  const totalTeams = registrationData[0]?.totalTeams || 0;
  const paidTeams = registrationData[0]?.paidTeams || 0;
  const completionRate = totalTeams > 0 ? (paidTeams / totalTeams) * 100 : 0;

  const registrationsPerEvent = await Team.aggregate([
    { $match: { event: { $in: eventIds } } },
    { $lookup: { from: 'events', localField: 'event', foreignField: '_id', as: 'eventData' } },
    { $unwind: '$eventData' },
    {
      $group: {
        _id: '$event',
        eventName: { $first: '$eventData.name' },
        maxTeams: { $first: '$eventData.maxTeams' },
        totalTeams: { $sum: 1 },
        paidTeams: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        eventId: '$_id',
        eventName: 1,
        maxTeams: 1,
        totalTeams: 1,
        paidTeams: 1,
        fillRate: { $multiply: [{ $divide: ['$totalTeams', '$maxTeams'] }, 100] },
        completionRate: { $multiply: [{ $divide: ['$paidTeams', '$totalTeams'] }, 100] }
      }
    },
    { $sort: { fillRate: -1 } }
  ]);

  const totalMaxTeams = tournaments.reduce((sum, t) => {
    return sum + t.events.reduce((eSum, e) => eSum + (e.maxTeams || 0), 0);
  }, 0);
  const fillRate = totalMaxTeams > 0 ? (totalTeams / totalMaxTeams) * 100 : 0;

  // Demographics
  const playerIds = await Team.aggregate([
    { $match: { event: { $in: eventIds } } },
    { $unwind: '$players' },
    { $group: { _id: '$players' } }
  ]);

  const uniquePlayerIds = playerIds.map(p => p._id);

  const skillLevelDistribution = await User.aggregate([
    { $match: { _id: { $in: uniquePlayerIds } } },
    { $group: { _id: '$skillLevel', count: { $sum: 1 } } },
    {
      $project: {
        _id: 0,
        skillLevel: '$_id',
        count: 1,
        percentage: { $multiply: [{ $divide: ['$count', uniquePlayerIds.length || 1] }, 100] }
      }
    },
    { $sort: { skillLevel: 1 } }
  ]);

  const locationDistribution = await User.aggregate([
    {
      $match: {
        _id: { $in: uniquePlayerIds },
        $or: [
          { 'location.city': { $exists: true, $ne: '' } },
          { 'location.state': { $exists: true, $ne: '' } }
        ]
      }
    },
    {
      $group: {
        _id: { city: '$location.city', state: '$location.state' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        city: '$_id.city',
        state: '$_id.state',
        count: 1
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Event popularity
  const eventPopularity = registrationsPerEvent.map(event => ({
    eventId: event.eventId,
    eventName: event.eventName,
    registrations: event.totalTeams,
    maxTeams: event.maxTeams,
    fillRate: event.fillRate,
    revenue: revenuePerEvent.find(r => r.eventId.toString() === event.eventId.toString())?.revenue || 0
  }));

  return {
    revenue: {
      total: totalRevenue,
      platformFees: platformFees,
      netRevenue: netRevenue,
      perEvent: revenuePerEvent,
      averagePayment: averagePayment
    },
    registrations: {
      totalTeams: totalTeams,
      paidTeams: paidTeams,
      fillRate: fillRate,
      completionRate: completionRate,
      perEvent: registrationsPerEvent
    },
    demographics: {
      skillLevels: skillLevelDistribution,
      locations: locationDistribution
    },
    eventPopularity: eventPopularity,
    summary: {
      totalTournaments: tournaments.length,
      totalEvents: eventIds.length,
      uniqueParticipants: uniquePlayerIds.length
    }
  };
}
