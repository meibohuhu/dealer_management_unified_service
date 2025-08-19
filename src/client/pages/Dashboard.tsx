import { useState, useEffect } from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Car, UserRound, FileText, Calendar } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { contractApi, vehicleApi, customerApi } from "@/lib/api";
import { Contract, Vehicle, Customer } from "@/types";

export default function Dashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch contracts data
        const contractsResponse = await contractApi.getAll(0, 100);
        setContracts(contractsResponse.data);
        
        // Fetch vehicles count
        const vehicles = await vehicleApi.getAll();
        setVehicleCount(vehicles.length);
        
        // Fetch customers count
        const customers = await customerApi.getAll();
        setCustomerCount(customers.length);
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to fetch dashboard data. Please try again later.");
        
        // For demo purposes, set mock data when API calls fail
        setContracts([
          { id: "1", contract_number: "CT001", vehicle_id: "v1", customer_id: "c1", start_date: "2023-06-01", end_date: "2023-06-07", payment: 350, deposit: 500, status: "completed", created_at: "2023-05-30", updated_at: "2023-06-07" },
          { id: "2", contract_number: "CT002", vehicle_id: "v2", customer_id: "c2", start_date: "2023-06-05", end_date: "2023-06-15", payment: 600, deposit: 800, status: "completed", created_at: "2023-06-04", updated_at: "2023-06-15" },
          { id: "3", contract_number: "CT003", vehicle_id: "v1", customer_id: "c3", start_date: "2023-06-20", end_date: "2023-06-25", payment: 275, deposit: 500, status: "completed", created_at: "2023-06-19", updated_at: "2023-06-25" },
          { id: "4", contract_number: "CT004", vehicle_id: "v3", customer_id: "c2", start_date: "2023-07-01", end_date: "2023-07-10", payment: 450, deposit: 600, status: "active", created_at: "2023-06-30", updated_at: "2023-07-01" }
        ]);
        setVehicleCount(8);
        setCustomerCount(15);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare chart data by month
  const getMonthlyData = () => {
    const monthlyData: Record<string, number> = {};
    
    contracts.forEach(contract => {
      const date = new Date(contract.created_at);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      
      monthlyData[monthYear] += 1;
    });
    
    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      contracts: count
    }));
  };

  // Get active contracts count
  const getActiveContractsCount = () => {
    return contracts.filter(contract => contract.status === "active").length;
  };

  // Calculate total revenue
  const getTotalRevenue = () => {
    return contracts.reduce((total, contract) => total + contract.payment_amount, 0);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your dealership performance and key metrics
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Vehicles
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : vehicleCount}</div>
              <p className="text-xs text-muted-foreground">
                Vehicles in inventory
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Customers
              </CardTitle>
              <UserRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : customerCount}</div>
              <p className="text-xs text-muted-foreground">
                Registered customers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Rentals
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : getActiveContractsCount()}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active contracts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${isLoading ? "..." : getTotalRevenue().toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From all contracts
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Contracts Overview</CardTitle>
              <CardDescription>
                Monthly contract creation trend
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {!isLoading && (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={getMonthlyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="contracts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {isLoading && (
                <div className="flex justify-center items-center h-[350px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}