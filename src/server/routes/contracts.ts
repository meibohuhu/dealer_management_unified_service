import { Router, Request, Response } from 'express';
import { ContractService } from '../services/ContractService';
import { ContractCreate, ContractUpdate } from '../models/Contract';
import { z } from 'zod';

const router = Router();
let contractService: ContractService;

// Initialize service lazily
function getContractService(): ContractService {
  if (!contractService) {
    contractService = new ContractService();
  }
  return contractService;
}

// Validation schemas
const ContractCreateSchema = z.object({
  contract_number: z.string().min(1),
  vehicle_id: z.number().positive(),
  customer_id: z.number().positive(),
  vin_number: z.string().length(17),
  customer_name: z.string().min(1),
  customer_phone: z.string().min(1),
  start_date: z.union([z.string(), z.date()]).transform((val) => {
    if (val instanceof Date) return val;
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date;
  }),
  end_date: z.union([z.string(), z.date()]).transform((val) => {
    if (val instanceof Date) return val;
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date;
  }),
  payment_amount: z.number().positive(),
  deposit_amount: z.number().min(0),
  status: z.string().optional(),
  created_by: z.string().optional()
});

const ContractUpdateSchema = z.object({
  contract_number: z.string().min(1).optional(),
  vehicle_id: z.number().positive().optional(),
  customer_id: z.number().positive().optional(),
  vin_number: z.string().length(17).optional(),
  customer_name: z.string().min(1).optional(),
  customer_phone: z.string().min(1).optional(),
  start_date: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date;
  }),
  end_date: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date;
  }),
  payment_amount: z.number().positive().optional(),
  deposit_amount: z.number().min(0).optional(),
  status: z.string().optional(),
  created_by: z.string().optional()
});

// Create new contract
router.post('/new', async (req: Request, res: Response) => {
  try {
    const validatedData = ContractCreateSchema.parse(req.body);
    
    // The schema already transforms dates
    const contractData: ContractCreate = validatedData;

    const contract = await getContractService().createContract(contractData);
    res.status(201).json(contract);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Error creating contract:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get all contracts with pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const contracts = await getContractService().getAllContracts(skip, limit);
    res.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get contract by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contract = await getContractService().getContractById(id);
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update contract
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = ContractUpdateSchema.parse(req.body);
    
    // The schema already transforms dates
    const updateData: ContractUpdate = validatedData;

    const contract = await getContractService().updateContract(id, updateData);
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json(contract);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Error updating contract:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete contract
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await getContractService().deleteContract(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search contracts
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, customer_name, contract_number, vin_number, skip, limit } = req.query;
    
    // For now, we'll use the basic getAllContracts with filters
    // TODO: Implement proper search functionality
    const contracts = await getContractService().getAllContracts(
      parseInt(skip as string) || 0,
      parseInt(limit as string) || 100
    );
    
    // Apply basic filtering
    let filteredContracts = contracts;
    
    if (customer_name) {
      filteredContracts = filteredContracts.filter(c => 
        c.customer_name.toLowerCase().includes((customer_name as string).toLowerCase())
      );
    }
    
    if (contract_number) {
      filteredContracts = filteredContracts.filter(c => 
        c.contract_number.toLowerCase().includes((contract_number as string).toLowerCase())
      );
    }
    
    if (vin_number) {
      filteredContracts = filteredContracts.filter(c => 
        c.vin_number.toLowerCase().includes((vin_number as string).toLowerCase())
      );
    }
    
    if (q) {
      const searchTerm = (q as string).toLowerCase();
      filteredContracts = filteredContracts.filter(c => 
        c.customer_name.toLowerCase().includes(searchTerm) ||
        c.contract_number.toLowerCase().includes(searchTerm) ||
        c.vin_number.toLowerCase().includes(searchTerm) ||
        c.customer_phone.includes(searchTerm)
      );
    }
    
    res.json(filteredContracts);
  } catch (error) {
    console.error('Error searching contracts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
