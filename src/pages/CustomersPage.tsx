import { useState, useEffect, useRef } from "react";
import { Upload, Users, Search, Trash2, Plus, Loader2, ShoppingCart, Star } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Customer {
  id: string;
  customer_id: string | null;
  name: string;
  email: string;
  created_at: string;
  cart_status: string | null;
  last_purchase_date: string | null;
  total_purchases: number | null;
  engagement_level: string | null;
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual add state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCustomerId, setNewCustomerId] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("File must contain at least a header row and one data row");
      }

      // Parse header
      const header = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""));
      const nameIndex = header.findIndex(h => h.includes("name"));
      const emailIndex = header.findIndex(h => h.includes("email"));
      const customerIdIndex = header.findIndex(h => h.includes("customer") && h.includes("id"));

      if (emailIndex === -1) {
        throw new Error("CSV must contain an 'email' column");
      }
      if (nameIndex === -1) {
        throw new Error("CSV must contain a 'name' column");
      }

      // Parse data rows
      const customersToInsert = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
        const email = values[emailIndex];
        const name = values[nameIndex] || "Unknown";
        const customerId = customerIdIndex !== -1 ? values[customerIdIndex] : null;

        if (email && email.includes("@")) {
          customersToInsert.push({
            email,
            name,
            customer_id: customerId,
            user_id: user.id,
          });
        }
      }

      if (customersToInsert.length === 0) {
        throw new Error("No valid customer data found in file");
      }

      // Get existing customer emails to filter duplicates
      const { data: existingCustomers } = await supabase
        .from("customers")
        .select("email");
      
      const existingEmails = new Set(
        (existingCustomers || []).map(c => c.email.toLowerCase())
      );

      // Filter out duplicates
      const uniqueCustomers = customersToInsert.filter(
        c => !existingEmails.has(c.email.toLowerCase())
      );

      if (uniqueCustomers.length === 0) {
        toast.info("All customers in this file already exist");
        return;
      }

      // Insert only unique customers
      const { error } = await supabase
        .from("customers")
        .insert(uniqueCustomers);

      if (error) throw error;

      const skipped = customersToInsert.length - uniqueCustomers.length;
      const message = skipped > 0 
        ? `Imported ${uniqueCustomers.length} customers (${skipped} duplicates skipped)`
        : `Successfully imported ${uniqueCustomers.length} customers!`;
      toast.success(message);
      fetchCustomers();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to import customers");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddCustomer = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Please fill in name and email");
      return;
    }

    if (!newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsAdding(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("customers")
        .insert({
          name: newName,
          email: newEmail,
          customer_id: newCustomerId || null,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success("Customer added successfully!");
      setNewName("");
      setNewEmail("");
      setNewCustomerId("");
      setShowAddForm(false);
      fetchCustomers();
    } catch (error: any) {
      console.error("Error adding customer:", error);
      toast.error(error.message || "Failed to add customer");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateBehavior = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from("customers")
        .update({ [field]: value } as any)
        .eq("id", id);

      if (error) throw error;
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
      );
      toast.success("Updated successfully");
    } catch (error: any) {
      toast.error("Failed to update");
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Customer deleted");
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.customer_id && customer.customer_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-4 pt-16">
        <Header title="Customers" subtitle="Manage your customer list for email campaigns" />
        
        <main className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="gap-2"
                >
                  <Plus size={16} />
                  Add Customer
                </Button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                />
                <Button
                  variant="gradient"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Import CSV
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Add Customer Form */}
            {showAddForm && (
              <div className="glass-card p-6 animate-slide-up">
                <h3 className="text-lg font-semibold text-foreground mb-4">Add New Customer</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Customer ID (optional)"
                    value={newCustomerId}
                    onChange={(e) => setNewCustomerId(e.target.value)}
                  />
                  <Input
                    placeholder="Name *"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <Input
                    placeholder="Email *"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCustomer} disabled={isAdding}>
                    {isAdding ? <Loader2 size={16} className="animate-spin" /> : "Add Customer"}
                  </Button>
                </div>
              </div>
            )}

            {/* Import Instructions */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Import Instructions</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Upload a CSV file with the following columns:
              </p>
              <div className="bg-secondary/30 rounded-lg p-4 font-mono text-sm">
                customer_id,name,email<br />
                C001,John Doe,john@example.com<br />
                C002,Jane Smith,jane@example.com
              </div>
            </div>

            {/* Customer List */}
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users size={20} className="text-primary" />
                  Customer List ({filteredCustomers.length})
                </h3>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">
                    {customers.length === 0 
                      ? "No customers yet. Import a CSV or add manually."
                      : "No customers match your search."
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/30">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Name</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Email</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Cart</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Engagement</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Purchases</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-foreground">
                            {customer.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {customer.email}
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={customer.cart_status || "empty"}
                              onValueChange={(val) => handleUpdateBehavior(customer.id, "cart_status", val)}
                            >
                              <SelectTrigger className="h-7 text-xs w-28 bg-secondary/50 border-border/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="empty">Empty</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="abandoned">Abandoned</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={customer.engagement_level || "new"}
                              onValueChange={(val) => handleUpdateBehavior(customer.id, "engagement_level", val)}
                            >
                              <SelectTrigger className="h-7 text-xs w-24 bg-secondary/50 border-border/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="vip">VIP</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {customer.total_purchases || 0}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomersPage;
