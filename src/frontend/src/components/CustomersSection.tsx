import { useState } from 'react';
import { useGetAllCustomersPaginated, useAddCustomer } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Loader2, Mail, Phone, MapPin, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Customer } from '../backend';

function CustomerCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export default function CustomersSection() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  
  const { data: paginatedData, isLoading } = useGetAllCustomersPaginated(currentPage, pageSize);
  const addCustomer = useAddCustomer();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const customers = paginatedData?.customers || [];
  const totalCustomers = Number(paginatedData?.total || 0);
  const hasNextPage = paginatedData?.hasNextPage || false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const customer: Customer = {
      id: BigInt(0),
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      serviceHistory: [],
      createdAt: BigInt(Date.now() * 1000000),
    };

    addCustomer.mutate(customer, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
          <p className="text-muted-foreground">Manage your customer database ({totalCustomers} total)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Enter customer details to add them to your database</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Customer name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Customer address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about the customer"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addCustomer.isPending || !formData.name.trim()}>
                  {addCustomer.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Customer'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CustomerCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <Card key={customer.id.toString()}>
                <CardHeader>
                  <CardTitle>{customer.name}</CardTitle>
                  <CardDescription>Customer ID: {customer.id.toString()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}
                  {customer.notes && (
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="line-clamp-2">{customer.notes}</span>
                    </div>
                  )}
                  <div className="pt-2 text-xs text-muted-foreground">
                    Added: {new Date(Number(customer.createdAt) / 1000000).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      )}

      {!isLoading && customers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No customers found. Add your first customer to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
