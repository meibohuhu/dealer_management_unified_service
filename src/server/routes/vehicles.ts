import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { VehicleService } from '../services/VehicleService';

export const createVehiclesRouter = () => {
  const router = Router();
  const vehicleService = new VehicleService(process.env.USE_SQLITE !== 'true');

// Validation schemas
const VehicleCreateSchema = z.object({
  vin_number: z.string().length(17),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().positive(),
  color: z.string().min(1),
  mileage: z.number().int().min(0).optional().default(0),
  price: z.number().min(0).optional().default(0),
  status: z.string().optional().default('available')
});

const VehicleUpdateSchema = z.object({
  vin_number: z.string().length(17).optional(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().positive().optional(),
  color: z.string().min(1).optional(),
  mileage: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
  status: z.string().optional()
});

// Get all vehicles
router.get('/', async (req: Request, res: Response) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vehicle by VIN
router.get('/vin/:vin', async (req: Request, res: Response) => {
  try {
    const { vin } = req.params;
    const vehicle = await vehicleService.getVehicleByVin(vin);
    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error) {
    console.error('Error fetching vehicle by VIN:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vehicle by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await vehicleService.getVehicleById(id);
    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new vehicle
router.post('/new', async (req: Request, res: Response) => {
  try {
    const validatedData = VehicleCreateSchema.parse(req.body);
    const vehicle = await vehicleService.createVehicle(validatedData);
    res.status(201).json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Error creating vehicle:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update vehicle
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = VehicleUpdateSchema.parse(req.body);
    const vehicle = await vehicleService.updateVehicle(id, validatedData);
    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Error updating vehicle:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete vehicle
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await vehicleService.deleteVehicle(id);
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  return router;
};
