import { useState, useEffect } from "react";
import { Plus, Search, Eye, Trash2, Loader2, Calendar, DollarSign, User, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Contract, ContractCreate, Vehicle, Customer } from "@/types";
import { contractApi, vehicleApi, customerApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const contractSchema = z.object({
  contract_number: z.string().min(1, "Contract number is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  customer_id: z.string().min(1, "Customer is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  payment_amount: z.coerce.number().positive("Payment must be greater than 0"),
  deposit_amount: z.coerce.number().nonnegative("Deposit must be at least 0"),
  status: z.enum(["active", "completed", "cancelled"]),
});

export default function Contracts() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchType, setSearchType] = useState<"contract" | "vin" | "customer">("contract");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContracts, setTotalContracts] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const addForm = useForm<z.infer<typeof contractSchema>>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contract_number: "",
      vehicle_id: "",
      customer_id: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      payment_amount: 0,
      deposit_amount: 0,
      status: "active",
    },
  });

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      const response = await contractApi.getAll((page - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
      setContracts(response.data);
      setTotalContracts(response.total);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to load contracts");
      // Set mock data for demo purposes when API fails
      const mockContracts: Contract[] = [
        {
          id: 1,
          contract_number: "CONT-001",
          vehicle_id: 1,
          customer_id: 1,
          vin_number: "1HGBH41JXMN109186",
          customer_name: "John Smith",
          customer_phone: "555-123-4567",
          start_date: "2023-06-01",
          end_date: "2023-06-08",
          payment_amount: 350,
          deposit_amount: 500,
          status: "completed",
          created_by: "admin",
          created_at: "2023-05-30T10:30:00Z",
          updated_at: "2023-05-30T10:30:00Z",
        },
        {
          id: 2,
          contract_number: "CONT-002",
          vehicle_id: 2,
          customer_id: 2,
          vin_number: "5NPE34AF4FH012345",
          customer_name: "Jane Doe",
          customer_phone: "555-987-6543",
          start_date: "2023-06-10",
          end_date: "2023-06-20",
          payment_amount: 600,
          deposit_amount: 800,
          status: "completed",
          created_by: "admin",
          created_at: "2023-06-09T09:15:00Z",
          updated_at: "2023-06-09T09:15:00Z",
        },
        {
          id: 3,
          contract_number: "CONT-003",
          vehicle_id: 3,
          customer_id: 3,
          vin_number: "WBA3A5C50FD123456",
          customer_name: "Bob Johnson",
          customer_phone: "555-456-7890",
          start_date: "2023-07-01",
          end_date: "2023-07-15",
          payment_amount: 850,
          deposit_amount: 1000,
          status: "active",
          created_by: "admin",
          created_at: "2023-06-29T14:20:00Z",
          updated_at: "2023-06-29T14:20:00Z",
        },
      ];
      setContracts(mockContracts);
      setTotalContracts(mockContracts.length);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehiclesAndCustomers = async () => {
    try {
      // Fetch vehicles
      const vehiclesData = await vehicleApi.getAll();
      setVehicles(vehiclesData);

      // Fetch customers
      const customersData = await customerApi.getAll();
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching vehicles and customers:", error);
      
      // Set mock data for demo purposes when API fails
      const mockVehicles: Vehicle[] = [
        {
          id: 1,
          vin_number: "1HGBH41JXMN109186",
          make: "Honda",
          model: "Civic",
          year: 2020,
          color: "Blue",
          license_plate: "ABC123",
          created_at: "2023-05-15T10:00:00Z",
          updated_at: "2023-05-15T10:00:00Z",
        },
        {
          id: 2,
          vin_number: "5NPE34AF4FH012345",
          make: "Hyundai",
          model: "Sonata",
          year: 2021,
          color: "Silver",
          license_plate: "XYZ789",
          created_at: "2023-05-20T14:30:00Z",
          updated_at: "2023-05-20T14:30:00Z",
        },
        {
          id: 3,
          vin_number: "WBA3A5C50FD123456",
          make: "BMW",
          model: "3 Series",
          year: 2022,
          color: "Black",
          license_plate: "DEF456",
          created_at: "2023-06-01T09:15:00Z",
          updated_at: "2023-06-01T09:15:00Z",
        },
      ];
      
      const mockCustomers: Customer[] = [
        {
          id: 1,
          first_name: "John",
          last_name: "Smith",
          gender: "male",
          phone_number: "555-123-4567",
          email: "john.smith@example.com",
          created_at: "2023-05-10T08:00:00Z",
          updated_at: "2023-05-10T08:00:00Z",
        },
        {
          id: 2,
          first_name: "Jane",
          last_name: "Doe",
          gender: "female",
          phone_number: "555-987-6543",
          email: "jane.doe@example.com",
          created_at: "2023-05-12T11:30:00Z",
          updated_at: "2023-05-12T11:30:00Z",
        },
        {
          id: 3,
          first_name: "Bob",
          last_name: "Johnson",
          gender: "male",
          phone_number: "555-456-7890",
          email: "bob.johnson@example.com",
          created_at: "2023-05-15T16:45:00Z",
          updated_at: "2023-05-15T16:45:00Z",
        },
      ];
      setVehicles(mockVehicles);
      setCustomers(mockCustomers);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchVehiclesAndCustomers();
  }, [page]);

  const handleSearchTypeChange = (value: string) => {
    setSearchType(value as "contract" | "vin" | "customer");
    setSearchQuery("");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchContracts();
      return;
    }

    try {
      setIsLoading(true);
      let results: Contract[] = [];

      switch (searchType) {
        case "contract": {
          // In a real application, we would fetch by contract number
          // For demo, we'll filter the existing contracts
          results = contracts.filter(c => 
            c.contract_number.toLowerCase().includes(searchQuery.toLowerCase())
          );
          break;
        }
        case "vin": {
          // In a real application, we would use the API endpoint
          const vinContracts = await contractApi.getByVin(searchQuery);
          results = vinContracts;
          break;
        }
        case "customer": {
          // In a real application, we would search by customer name via API
          // For demo, we'll find the customer ID first then filter contracts
          const foundCustomers = await customerApi.searchByName(searchQuery);
          if (foundCustomers.length > 0) {
            results = contracts.filter(c => 
              foundCustomers.some(customer => customer.id === c.customer_id)
            );
          }
          break;
        }
      }

      setContracts(results);
      setTotalContracts(results.length);
      setTotalPages(Math.ceil(results.length / ITEMS_PER_PAGE));
      setPage(1);
    } catch (error) {
      console.error(`Error searching by ${searchType}:`, error);
      toast.error(`Failed to search contracts by ${searchType}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchQuery("");
    fetchContracts();
  };

  const handleAddContract = async (data: z.infer<typeof contractSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Format dates to include time component
      const formatDateWithTime = (dateString: string) => {
        return `${dateString}T00:00:00`;
      };

      // Find selected vehicle and customer to get additional info
      const selectedVehicle = vehicles.find(v => v.id === parseInt(data.vehicle_id));
      const selectedCustomer = customers.find(c => c.id === parseInt(data.customer_id));

      if (!selectedVehicle) {
        throw new Error("Selected vehicle not found");
      }
      if (!selectedCustomer) {
        throw new Error("Selected customer not found");
      }

      const newContract = await contractApi.create({
        contract_number: data.contract_number,
        vehicle_id: parseInt(data.vehicle_id),
        customer_id: parseInt(data.customer_id),
        vin_number: selectedVehicle.vin_number,
        customer_name: `${selectedCustomer.first_name} ${selectedCustomer.last_name}`,
        customer_phone: selectedCustomer.phone_number,
        start_date: formatDateWithTime(data.start_date),
        end_date: formatDateWithTime(data.end_date),
        payment_amount: data.payment_amount,
        deposit_amount: data.deposit_amount,
        status: data.status,
      });
      setContracts([...contracts, newContract]);
      toast.success("Contract added successfully");
      setIsAddDialogOpen(false);
      addForm.reset();
    } catch (error) {
      console.error("Error adding contract:", error);
      toast.error("Failed to add contract");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!selectedContract) return;

    try {
      setIsSubmitting(true);
      await contractApi.delete(selectedContract.id.toString());
      setContracts(contracts.filter((contract) => contract.id !== selectedContract.id));
      toast.success("Contract deleted successfully");
      setIsDeleteDialogOpen(false);
      
      // If we're on a page with no more items, go to previous page
      if (contracts.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        // Otherwise just refresh the current page
        fetchContracts();
      }
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast.error("Failed to delete contract");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setIsDeleteDialogOpen(true);
  };

  const viewContractDetails = (contractId: number) => {
    navigate(`/contracts/${contractId}`);
  };

  const getVehicleInfo = (vehicleId: number) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.vin_number})` : "Unknown Vehicle";
  };

  const getCustomerInfo = (customerId: number) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? `${customer.first_name} ${customer.last_name}` : "Unknown Customer";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Contracts</h2>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Contract
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Select
              defaultValue="contract"
              value={searchType}
              onValueChange={handleSearchTypeChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contract">Contract #</SelectItem>
                <SelectItem value="vin">VIN #</SelectItem>
                <SelectItem value="customer">Customer Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex w-full md:w-auto items-center space-x-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={`Search by ${searchType}...`}
                className="pl-8 w-full md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
            </div>
            <Button variant="secondary" onClick={handleSearch}>Search</Button>
            <Button variant="outline" onClick={resetSearch}>Reset</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract #</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(contracts) && contracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery
                          ? "No contracts match your search"
                          : "No contracts found. Add a contract to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (contracts ?? []).map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.contract_number}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {getVehicleInfo(contract.vehicle_id)}
                        </TableCell>
                        <TableCell>{getCustomerInfo(contract.customer_id)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>{formatDate(contract.start_date)}</span>
                            <span>to {formatDate(contract.end_date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>${contract.payment_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(contract.status)}>
                            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => viewContractDetails(contract.id)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => openDeleteDialog(contract)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        onClick={() => setPage(p)}
                        isActive={page === p}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>

      {/* Add Contract Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Contract</DialogTitle>
            <DialogDescription>
              Enter the details for the new rental contract.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddContract)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="contract_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Number</FormLabel>
                      <FormControl>
                        <Input placeholder="CONT-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                              {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.vin_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.first_name} {customer.last_name} ({customer.phone_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="payment_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="deposit_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Contract"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Contract Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contract? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-2 py-4">
              <div className="flex items-center">
                {/* FileText icon is not imported, so it's removed */}
                <span>Contract: {selectedContract.contract_number}</span>
              </div>
              <div className="flex items-center">
                <Car className="h-4 w-4 mr-2" />
                <span>{getVehicleInfo(selectedContract.vehicle_id)}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span>{getCustomerInfo(selectedContract.customer_id)}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {formatDate(selectedContract.start_date)} to {formatDate(selectedContract.end_date)}
                </span>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                <span>Payment: ${selectedContract.payment_amount.toFixed(2)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContract}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Contract"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}