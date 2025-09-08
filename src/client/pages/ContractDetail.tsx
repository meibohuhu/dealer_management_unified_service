import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, DollarSign, User, Car, FileText, Loader2, Trash2, Pencil, Upload, FolderOpen } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ContractDetail as ContractDetailType, ContractUpdate, Vehicle, Customer, ContractFile } from "@/types";
import { contractApi, vehicleApi, customerApi, contractFileApi } from "@/lib/api";
import { FileUpload } from "@/components/ui/file-upload";
import { FileViewer } from "@/components/ui/file-viewer";
import { FilePreviewModal } from "@/components/ui/file-preview-modal";

const contractSchema = z.object({
  contract_number: z.string().min(1, "Contract number is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  customer_id: z.string().min(1, "Customer is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  payment_amount: z.coerce.number().positive("Payment must be greater than 0"),
  tax_amount: z.coerce.number().nonnegative("Tax must be at least 0"),
  deposit_amount: z.coerce.number().nonnegative("Deposit must be at least 0"),
  status: z.enum(["active", "returned", "completed", "cancelled"]),
});

export default function ContractDetail() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<ContractDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contractFiles, setContractFiles] = useState<ContractFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ContractFile | null>(null);
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);

  const editForm = useForm<z.infer<typeof contractSchema>>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contract_number: "",
      vehicle_id: "",
      customer_id: "",
      start_date: "",
      end_date: "",
      payment_amount: 0,
      tax_amount: 0,
      deposit_amount: 0,
      status: "active",
    },
  });

  useEffect(() => {
    const fetchContractDetails = async () => {
      if (!contractId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await contractApi.getById(contractId);
        setContract(data);
        
        // Try to load files from localStorage first (for uploaded files)
        const localStorageKey = `contract_files_${contractId}`;
        const savedFiles = localStorage.getItem(localStorageKey);
        
        if (savedFiles) {
          try {
            const parsedFiles = JSON.parse(savedFiles);
            setContractFiles(parsedFiles);
            console.log('Loaded files from localStorage:', parsedFiles);
          } catch (parseError) {
            console.error('Error parsing saved files:', parseError);
            localStorage.removeItem(localStorageKey);
          }
        } else {
          // Fallback to API if no saved files
          try {
            const files = await contractFileApi.getByContract(contractId);
            setContractFiles(files);
          } catch (fileError) {
            console.error("Error fetching contract files:", fileError);
            // Set empty array when API call fails - no mock files
            setContractFiles([]);
          }
        }
      } catch (error) {
        console.error("Error fetching contract details:", error);
        setError("Failed to load contract details. Please try again later.");
        
        // For demo purposes, set mock data when API call fails
        setContract({
          id: parseInt(contractId),
          contract_number: "CONT-001",
          vehicle_id: 1,
          customer_id: 1,
          vin_number: "1HGCM82633A123456",
          customer_name: "John Smith",
          customer_phone: "555-123-4567",
          start_date: "2023-06-01",
          end_date: "2023-06-08",
          payment_amount: 350,
          deposit_amount: 500,
          status: "completed",
          created_by: "admin",
          created_at: "2023-05-30T10:30:00Z",
          updated_at: "2023-06-08T15:45:00Z",
          vehicle: {
            id: 1,
            vin_number: "1HGCM82633A123456",
            make: "Honda",
            model: "Accord",
            year: 2020,
            color: "Blue",
            license_plate: "ABC123",
            created_at: "2023-01-15T10:30:00Z",
            updated_at: "2021-01-15T10:30:00Z",
          },
          customer: {
            id: 1,
            first_name: "John",
            last_name: "Smith",
            gender: "male",
            phone_number: "555-123-4567",
            email: "john.smith@example.com",
            created_at: "2021-01-15T10:30:00Z",
            updated_at: "2021-01-15T10:30:00Z",
          },
          images: [
            {
              id: "img1",
              contract_id: contractId,
              image_url: "https://via.placeholder.com/800x600?text=Contract+Image",
              description: "Contract document page 1",
              created_at: "2023-05-30T10:35:00Z",
            }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContractDetails();
    
    // Cleanup function to clear files when switching contracts
    return () => {
      setContractFiles([]);
    };
  }, [contractId]);


  useEffect(() => {
    const fetchVehiclesAndCustomers = async () => {
      try {
        const [vehiclesData, customersData] = await Promise.all([
          vehicleApi.getAll(),
          customerApi.getAll(),
        ]);
        setVehicles(vehiclesData);
        setCustomers(customersData);
      } catch (error) {
        console.error("Error fetching vehicles and customers:", error);
        // Set mock data for demo purposes when API fails
        setVehicles([
          {
            id: 1,
            vin_number: "1HGCM82633A123456",
            make: "Honda",
            model: "Accord",
            year: 2020,
            color: "Blue",
            license_plate: "ABC123",
            created_at: "2023-01-15T10:30:00Z",
            updated_at: "2023-01-15T10:30:00Z",
          },
        ]);
        setCustomers([
          {
            id: 1,
            first_name: "John",
            last_name: "Smith",
            gender: "male",
            phone_number: "555-123-4567",
            email: "john.smith@example.com",
            created_at: "2023-01-15T10:30:00Z",
            updated_at: "2023-01-15T10:30:00Z",
          },
        ]);
      }
    };

    fetchVehiclesAndCustomers();
  }, []);

  // File management functions
  const handleFileUpload = async (file: File, description?: string) => {
    if (!contractId) return;
    
    try {
      const uploadedFile = await contractFileApi.upload({
        contract_id: contractId,
        file,
        description,
      });
      
      // Update local state
      const newFiles = [uploadedFile, ...contractFiles];
      setContractFiles(newFiles);
      
      // Save to localStorage to persist across navigation
      const localStorageKey = `contract_files_${contractId}`;
      localStorage.setItem(localStorageKey, JSON.stringify(newFiles));
      console.log('Saved files to localStorage:', newFiles);
      
      toast.success(`File "${file.name}" uploaded successfully`);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload "${file.name}"`);
      throw error;
    }
  };

  const handleFileDownload = async (file: ContractFile) => {
    try {
      await contractFileApi.download(contractId!, file.id, file.file_name);
      toast.success(`Downloading "${file.file_name}"`);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error(`Failed to download "${file.file_name}"`);
    }
  };

  const handleFileDelete = async (file: ContractFile) => {
    if (!contractId) return;
    
    try {
      await contractFileApi.delete(contractId, file.id);
      const newFiles = contractFiles.filter(f => f.id !== file.id);
      setContractFiles(newFiles);
      
      // Update localStorage
      const localStorageKey = `contract_files_${contractId}`;
      localStorage.setItem(localStorageKey, JSON.stringify(newFiles));
      console.log('Updated localStorage after deletion:', newFiles);
      
      toast.success(`File "${file.file_name}" deleted successfully`);
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error(`Failed to delete "${file.file_name}"`);
    }
  };

  const handleFileView = (file: ContractFile) => {
    setSelectedFile(file);
    setIsFilePreviewOpen(true);
  };

  const handleDeleteContract = async () => {
    if (!contract || !contractId) return;
    
    if (!window.confirm("Are you sure you want to delete this contract? This action cannot be undone.")) {
      return;
    }

    try {
      await contractApi.delete(contractId);
      toast.success("Contract deleted successfully");
      navigate("/contracts");
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast.error("Failed to delete contract");
    }
  };

  const openEditDialog = () => {
    if (!contract) return;
    
    // Format dates to YYYY-MM-DD for date inputs
    const formatDateForInput = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };
    
    editForm.reset({
      contract_number: contract.contract_number,
      vehicle_id: contract.vehicle_id.toString(),
      customer_id: contract.customer_id.toString(),
      start_date: formatDateForInput(contract.start_date),
      end_date: formatDateForInput(contract.end_date),
      payment_amount: contract.payment_amount,
      tax_amount: contract.tax_amount,
      deposit_amount: contract.deposit_amount,
      status: contract.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditContract = async (data: z.infer<typeof contractSchema>) => {
    if (!contract || !contractId) return;

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

      const updatedContract = await contractApi.update(contractId, {
        contract_number: data.contract_number,
        vehicle_id: parseInt(data.vehicle_id),
        customer_id: parseInt(data.customer_id),
        vin_number: selectedVehicle.vin_number,
        customer_name: `${selectedCustomer.first_name} ${selectedCustomer.last_name}`,
        customer_phone: selectedCustomer.phone_number,
        start_date: formatDateWithTime(data.start_date),
        end_date: formatDateWithTime(data.end_date),
        payment_amount: data.payment_amount,
        tax_amount: data.tax_amount,
        deposit_amount: data.deposit_amount,
        status: data.status,
      });

      // Update the contract state with the new data
      setContract({ ...contract, ...updatedContract });
      toast.success("Contract updated successfully");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating contract:", error);
      toast.error("Failed to update contract");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error && !contract) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate("/contracts")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contracts
          </Button>
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            {error}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!contract) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate("/contracts")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contracts
          </Button>
          <div className="text-center py-10">
            <h2 className="text-xl font-medium">Contract Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The requested contract could not be found.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Button variant="ghost" onClick={() => navigate("/contracts")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contracts
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openEditDialog}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDeleteContract}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Contract Information</CardTitle>
                  <CardDescription>Contract {contract.contract_number}</CardDescription>
                </div>
                <Badge variant={getStatusBadgeVariant(contract.status)}>
                  {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p>{formatDate(contract.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Date</p>
                  <p>{formatDate(contract.end_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment</p>
                  <p className="font-medium">${Number(contract.payment_amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tax</p>
                  <p>${Number(contract.tax_amount || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Deposit</p>
                  <p>${Number(contract.deposit_amount).toFixed(2)}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p>{formatDateTime(contract.created_at)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p>{formatDateTime(contract.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
              <CardDescription>Information about the rented vehicle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                  <h3 className="font-medium">
                    {contract.vehicle.year} {contract.vehicle.make} {contract.vehicle.model}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">VIN Number</p>
                    <p className="font-mono">{contract.vehicle.vin_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Color</p>
                    <p>{contract.vehicle.color}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => navigate(`/vehicles`)}>
                View All Vehicles
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Contact details for the customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <h3 className="font-medium">{contract.customer.first_name} {contract.customer.last_name}</h3>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{contract.customer.phone_number}</p>
                </div>
                {contract.customer.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{contract.customer.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => navigate(`/customers`)}>
                View All Customers
              </Button>
            </CardFooter>
          </Card>

          {contract.images && contract.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Contract Documents</CardTitle>
                <CardDescription>Uploaded contract images and documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {contract.images.map((image) => (
                    <div key={image.id} className="space-y-2">
                      <div className="overflow-hidden rounded-md border">
                        <img
                          src={image.image_url}
                          alt={image.description || "Contract document"}
                          className="w-full h-auto object-cover aspect-[4/3]"
                        />
                      </div>
                      {image.description && (
                        <p className="text-sm text-muted-foreground">{image.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* File Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Contract Files
            </CardTitle>
            <CardDescription>
              Upload and manage files associated with this contract
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="files" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="files">View Files</TabsTrigger>
                <TabsTrigger value="upload">Upload Files</TabsTrigger>
              </TabsList>
              
              <TabsContent value="files" className="mt-6">
                <FileViewer
                  files={contractFiles}
                  onDownload={handleFileDownload}
                  onDelete={handleFileDelete}
                  onView={handleFileView}
                />
              </TabsContent>
              
              <TabsContent value="upload" className="mt-6">
                <FileUpload
                  onFileUpload={handleFileUpload}
                  acceptedFileTypes={[
                    "image/*",
                    "application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "text/*"
                  ]}
                  maxFileSize={25 * 1024 * 1024} // 25MB
                  maxFiles={10}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Edit Contract Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Update the details for this rental contract.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditContract)} className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id.toString()} className="text-left">
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
                  control={editForm.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()} className="text-left">
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
                  control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
                  name="tax_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="deposit_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
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
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Contract"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      <FilePreviewModal
        file={selectedFile}
        isOpen={isFilePreviewOpen}
        onClose={() => {
          setIsFilePreviewOpen(false);
          setSelectedFile(null);
        }}
        onDownload={handleFileDownload}
      />
    </MainLayout>
  );
}