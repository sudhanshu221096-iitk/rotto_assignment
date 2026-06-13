const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createCar,
  getMyCars,
  getCarById,
  updateCar,
  deleteCar,
} = require('../controllers/carController');

router.use(authenticate);

router.get('/', getMyCars);
router.post('/', createCar);
router.get('/:id', getCarById);
router.put('/:id', updateCar);
router.delete('/:id', deleteCar);

module.exports = router;
