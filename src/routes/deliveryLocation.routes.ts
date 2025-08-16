import { Router } from 'express';
import {
  createLocation,
  getLocations,
  updateLocation,
  deleteLocation,
} from '../controllers/deliveryLocation';
import { authenticateToken, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticateToken, authorize(['admin']), createLocation);
router.get('/', authenticateToken, getLocations);
router.patch('/:id', authenticateToken, authorize(['admin']), updateLocation);
router.delete('/:id', authenticateToken, authorize(['admin']), deleteLocation);

export default router;
