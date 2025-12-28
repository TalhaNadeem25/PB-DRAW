import express from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  assignPlayerToPool,
  removePlayerFromPool
} from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);
router.put('/:eventId/assign-player/:playerId', protect, authorize('organizer', 'admin'), assignPlayerToPool);
router.put('/:eventId/remove-player/:playerId', protect, authorize('organizer', 'admin'), removePlayerFromPool);

export default router;
