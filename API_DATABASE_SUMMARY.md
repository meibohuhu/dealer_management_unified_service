# Dealer Management System - API & Database Summary

## 🔌 API Function Summary

### **Contracts API** (`/api/contracts`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/new` | Create new contract | `ContractCreate` | `Contract` (201) |
| `GET` | `/` | Get all contracts (paginated) | Query: `skip`, `limit` | `Contract[]` |
| `GET` | `/search` | Search contracts | Query: `q`, `customer_name`, `contract_number`, `vin_number` | `Contract[]` |
| `GET` | `/:id` | Get contract by ID | - | `ContractDetail` |
| `PUT` | `/:id` | Update contract | `ContractUpdate` | `Contract` |
| `DELETE` | `/:id` | Delete contract | - | 204 No Content |

**Contract Status Values:**
- `'active'` - Currently active contract
- `'returned'` - Car returned, deposit pending return to customer
- `'completed'` - Contract has been completed
- `'cancelled'` - Contract has been cancelled

### **Customers API** (`/api/customers`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/` | Get all customers | - | `Customer[]` |
| `GET` | `/phone/:phone` | Get customer by phone | - | `Customer` |
| `GET` | `/search/:name` | Search customers by name | - | `Customer[]` |
| `GET` | `/:id` | Get customer by ID | - | `Customer` |
| `POST` | `/new` | Create new customer | `CustomerCreate` | `Customer` (201) |
| `PUT` | `/:id` | Update customer | `CustomerUpdate` | `Customer` |
| `DELETE` | `/:id` | Delete customer | - | 204 No Content |

### **Vehicles API** (`/api/vehicles`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/` | Get all vehicles | - | `Vehicle[]` |
| `GET` | `/vin/:vin` | Get vehicle by VIN | - | `Vehicle` |
| `GET` | `/:id` | Get vehicle by ID | - | `Vehicle` |
| `POST` | `/new` | Create new vehicle | `VehicleCreate` | `Vehicle` (201) |
| `PUT` | `/:id` | Update vehicle | `VehicleUpdate` | `Vehicle` |
| `DELETE` | `/:id` | Delete vehicle | - | 204 No Content |

**Vehicle Status Values:**
- `'available'` - Vehicle is available for contract
- `'rented'` - Vehicle is currently under contract
- `'maintenance'` - Vehicle is under maintenance
- `'sold'` - Vehicle has been sold

### **Contract Files API** (`/api/contract-files`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/upload` | Upload file for contract | `multipart/form-data` | `ContractFile` (201) |
| `GET` | `/contract/:contractId` | Get all files for contract | - | `ContractImage[]` |
| `GET` | `/:fileId` | Get file by ID | - | `ContractImage` |
| `DELETE` | `/:fileId` | Delete file | - | 204 No Content |

**Supported File Types:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, TXT
- Spreadsheets: XLS, XLSX

**File Size Limit:** 25MB per file

### **Health & Info Endpoints**

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/health` | Service health status | Health status |
| `GET` | `/` | API information | API info |

---

## 🗄️ Database Summary

### **Database Schema**

#### **1. Users Table** (`ds_user`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL/INTEGER | PRIMARY KEY | Auto-incrementing ID |
| `email` | VARCHAR(255)/TEXT | UNIQUE | User email address |
| `wechat_id` | VARCHAR(255)/TEXT | UNIQUE, NOT NULL | WeChat ID (required) |
| `name` | VARCHAR(255)/TEXT | - | User's full name |
| `phone` | VARCHAR(50)/TEXT | - | Phone number |
| `role` | VARCHAR(50)/TEXT | DEFAULT 'user' | User role (admin/staff) |
| `hashed_password` | VARCHAR(255)/TEXT | - | Encrypted password |
| `is_active` | BOOLEAN/INTEGER | DEFAULT true/1 | Account status |
| `created_at` | TIMESTAMP/TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

#### **2. Vehicles Table** (`ds_vehicle`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL/INTEGER | PRIMARY KEY | Auto-incrementing ID |
| `vin_number` | VARCHAR(17)/TEXT | UNIQUE, NOT NULL | Vehicle identification number |
| `make` | VARCHAR(100)/TEXT | NOT NULL | Vehicle manufacturer |
| `model` | VARCHAR(100)/TEXT | NOT NULL | Vehicle model |
| `year` | INTEGER | NOT NULL | Manufacturing year |
| `color` | VARCHAR(50)/TEXT | NOT NULL | Vehicle color |
| `mileage` | INTEGER | NOT NULL | Current mileage |
| `price` | DECIMAL(10,2)/REAL | NOT NULL | Vehicle price |
| `status` | VARCHAR(50)/TEXT | DEFAULT 'available' | Vehicle status |
| `created_at` | TIMESTAMP/TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP/TEXT | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

#### **3. Customers Table** (`ds_customer`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL/INTEGER | PRIMARY KEY | Auto-incrementing ID |
| `first_name` | VARCHAR(100)/TEXT | NOT NULL | Customer's first name |
| `last_name` | VARCHAR(100)/TEXT | NOT NULL | Customer's last name |
| `phone_number` | VARCHAR(50)/TEXT | NOT NULL | Contact phone number |
| `email` | VARCHAR(255)/TEXT | - | Email address |
| `address` | TEXT | - | Physical address |
| `created_at` | TIMESTAMP/TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP/TEXT | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

#### **4. Contracts Table** (`ds_contract`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL/INTEGER | PRIMARY KEY | Auto-incrementing ID |
| `contract_number` | VARCHAR(100)/TEXT | UNIQUE, NOT NULL | Contract identifier |
| `vehicle_id` | INTEGER | NOT NULL, FK | Reference to vehicle |
| `customer_id` | INTEGER | NOT NULL, FK | Reference to customer |
| `vin_number` | VARCHAR(17)/TEXT | NOT NULL | Vehicle VIN |
| `customer_name` | VARCHAR(200)/TEXT | NOT NULL | Customer's full name |
| `customer_phone` | VARCHAR(50)/TEXT | NOT NULL | Customer's phone |
| `start_date` | TIMESTAMP/TEXT | NOT NULL | Contract start date |
| `end_date` | TIMESTAMP/TEXT | NOT NULL | Contract end date |
| `payment_amount` | DECIMAL(10,2)/REAL | NOT NULL | Monthly payment |
| `deposit_amount` | DECIMAL(10,2)/REAL | NOT NULL | Security deposit |
| `status` | VARCHAR(50)/TEXT | DEFAULT 'active' | Contract status |
| `created_by` | VARCHAR(100)/TEXT | - | User who created contract |
| `created_at` | TIMESTAMP/TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP/TEXT | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

#### **5. Contract Images Table** (`ds_contract_image`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL/INTEGER | PRIMARY KEY | Auto-incrementing ID |
| `contract_id` | INTEGER | NOT NULL, FK, CASCADE | Reference to contract |
| `file_name` | VARCHAR(255)/TEXT | NOT NULL | Original filename |
| `file_url` | TEXT | NOT NULL | File storage URL |
| `file_size` | INTEGER | NOT NULL | File size in bytes |
| `file_type` | VARCHAR(100)/TEXT | NOT NULL | MIME type |
| `description` | TEXT | - | File description |
| `uploaded_by` | VARCHAR(100)/TEXT | - | User who uploaded |
| `image_path` | TEXT | NOT NULL | Storage path |
| `uploaded_at` | TIMESTAMP/TEXT | DEFAULT CURRENT_TIMESTAMP | Upload timestamp |

### **Database Relationships**

```
ds_user (1) ←→ (N) ds_contract (created_by)
ds_vehicle (1) ←→ (N) ds_contract (vehicle_id)
ds_customer (1) ←→ (N) ds_contract (customer_id)
ds_contract (1) ←→ (N) ds_contract_image (contract_id)
```

### **Database Support**

- **Primary**: PostgreSQL (production)
- **Fallback**: SQLite (development/testing)
- **Configuration**: Set via `USE_SQLITE` environment variable

### **Sample Data**

The system includes seed data with:

**Sample Vehicles:**
- Honda Civic 2021 (Blue) - VIN: 1HGBH41JXMN109186
- Toyota Camry 2020 (Silver) - VIN: 2T1BURHE0JC123456
- Volkswagen Golf 2019 (White) - VIN: 3VWDX7AJ5DM123789
- Toyota Corolla 2022 (Red) - VIN: 4T1B11HK5JU123456
- Hyundai Sonata 2021 (Black) - VIN: 5NPE34AF5FH123789

**Sample Customers:**
- John Smith (555-0101) - john.smith@email.com
- Sarah Johnson (555-0102) - sarah.johnson@email.com
- Michael Brown (555-0103) - michael.brown@email.com
- Emily Davis (555-0104) - emily.davis@email.com
- David Wilson (555-0105) - david.wilson@email.com

### **Key Features**

- **Dual Database Support**: Seamless switching between PostgreSQL and SQLite
- **Foreign Key Constraints**: Maintains data integrity
- **Cascade Deletes**: Contract images deleted when contract is deleted
- **Timestamps**: Automatic creation and update timestamps
- **Unique Constraints**: VIN numbers, contract numbers, user emails/WeChat IDs
- **Status Tracking**: Vehicle availability and contract status management
- **File Management**: Support for document and image uploads
- **Search Functionality**: Multi-field search across contracts, customers, and vehicles

### **Data Types**

#### **Contract Status**
- `'active'` - Currently active contract
- `'returned'` - Car returned, deposit pending return to customer
- `'completed'` - Contract has been completed
- `'cancelled'` - Contract has been cancelled

#### **Vehicle Status**
- `'available'` - Vehicle is available for contract
- `'rented'` - Vehicle is currently under contract
- `'maintenance'` - Vehicle is under maintenance
- `'sold'` - Vehicle has been sold

#### **User Roles**
- `'admin'` - Administrator with full access
- `'staff'` - Staff member with limited access
- `'user'` - Regular user (default)

---

## 📋 TypeScript Interfaces

### **Core Types**

```typescript
// Vehicle Types
interface Vehicle {
  id: number;
  vin_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string | null;
  created_at: string;
  updated_at: string;
}

// Customer Types
interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  gender: string;
  phone_number: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Contract Types
interface Contract {
  id: number;
  contract_number: string;
  vehicle_id: number;
  customer_id: number;
  vin_number: string;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  payment_amount: number;
  deposit_amount: number;
  status: 'active' | 'returned' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// File Types
interface ContractImage {
  id: string;
  contract_id: string;
  image_url: string;
  description?: string;
  created_at: string;
}
```

---

## 🚀 Quick Reference Commands

### **Development**
```bash
npm install                    # Install dependencies
cp env.example .env           # Setup environment
npm run dev                   # Start development servers
```

### **Production**
```bash
npm run build                 # Build for production
npm start                     # Start production server
```

### **Database**
```bash
# PostgreSQL (Docker)
docker-compose up -d postgres

# SQLite (Local)
USE_SQLITE=true npm run dev
```

### **Testing**
```bash
curl http://localhost:8080/health    # Health check
curl http://localhost:8080/          # API info
```

---

*Generated on: $(date)*
*System: Dealer Management Unified Service*
*Version: 1.0.0*
