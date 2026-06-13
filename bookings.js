const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  updateBookingStatus,
  getAllBookings,
} = require('../controllers/bookingController');

router.use(authenticate);

router.get('/my', getMyBookings);
router.post('/', createBooking);
router.put('/:id/status', requireAdmin, updateBookingStatus);
router.get('/', requireAdmin, getAllBookings);

module.exports = router;
