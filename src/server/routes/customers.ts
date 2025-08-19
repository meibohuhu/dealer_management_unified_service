import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { CustomerService } from '../services/CustomerService';

const router = Router();
const customerService = new CustomerService(process.env.USE_SQLITE !== 'true');

// Validation schemas
const CustomerCreateSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone_number: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().optional()
});

const CustomerUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone_number: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z.string().optional()
});

// Get all customers
router.get('/', async (req: Request, res: Response) => {
  try {
    const customers = await customerService.getAllCustomers();
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer by phone
router.get('/phone/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const customer = await customerService.getCustomerByPhone(phone);
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  } catch (error) {
    console.error('Error fetching customer by phone:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search customers by name
router.get('/search/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const customers = await customerService.searchCustomersByName(name);
    res.json(customers);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new customer
router.post('/new', async (req: Request, res: Response) => {
  try {
    const validatedData = CustomerCreateSchema.parse(req.body);
    const customer = await customerService.createCustomer(validatedData);
    res.status(201).json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update customer
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = CustomerUpdateSchema.parse(req.body);
    const customer = await customerService.updateCustomer(id, validatedData);
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Error updating customer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete customer
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await customerService.deleteCustomer(id);
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
