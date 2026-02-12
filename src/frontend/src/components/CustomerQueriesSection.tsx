import { useState } from 'react';
import { useGetAllCustomerQueriesForAdmin, useGetAgentCustomerQueries, useIsCallerAdmin, useCreateCustomerQuery, useUpdateCustomerQueryStatus, useGetUserProfile, QueryStatus } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Phone, Home, DollarSign, User } from 'lucide-react';
import type { CustomerQuery } from '../backend';
import { toast } from 'sonner';

export default function CustomerQueriesSection() {
  const { data: isAdmin = false } = useIsCallerAdmin();
  const { data: adminQueries = [], isLoading: adminLoading } = useGetAllCustomerQueriesForAdmin();
  const { data: agentQueries = [], isLoading: agentLoading } = useGetAgentCustomerQueries();
  const createQuery = useCreateCustomerQuery();
  const updateStatus = useUpdateCustomerQueryStatus();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    flatType: '',
    rentRange: '',
    contactPhone: '',
  });

  const queries = isAdmin ? adminQueries : agentQueries;
  const isLoading = isAdmin ? adminLoading : agentLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!formData.flatType.trim()) {
      toast.error('Flat type is required');
      return;
    }
    if (!formData.rentRange || isNaN(Number(formData.rentRange)) || Number(formData.rentRange) <= 0) {
      toast.error('Valid rent range is required');
      return;
    }
    if (!formData.contactPhone.trim() || formData.contactPhone.length !== 10 || !/^\d+$/.test(formData.contactPhone)) {
      toast.error('Contact phone must be exactly 10 digits');
      return;
    }

    const newQuery: CustomerQuery = {
      id: BigInt(0),
      customerName: formData.customerName,
      flatType: formData.flatType,
      rentRange: BigInt(formData.rentRange),
      contactPhone: formData.contactPhone,
      assignedAgent: undefined,
      status: QueryStatus.open as any,
      createdAt: BigInt(Date.now() * 1000000),
    };

    try {
      await createQuery.mutateAsync(newQuery);
      setFormData({ customerName: '', flatType: '', rentRange: '', contactPhone: '' });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating query:', error);
    }
  };

  const handleStatusChange = async (queryId: bigint, newStatus: QueryStatus) => {
    try {
      await updateStatus.mutateAsync({ queryId, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status: any) => {
    const statusStr = typeof status === 'object' && status !== null ? Object.keys(status)[0] : status;
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      'open': { label: 'Open', variant: 'default' },
      'inProgress': { label: 'In Progress', variant: 'secondary' },
      'resolved': { label: 'Resolved', variant: 'outline' },
      'closed': { label: 'Closed', variant: 'outline' },
    };
    const { label, variant } = statusMap[statusStr] || { label: 'Unknown', variant: 'outline' as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isAdmin ? 'Customer Panel' : 'My Customer Queries'}
          </h2>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'View all customer registrations and raised queries with assigned agents'
              : 'View and manage your assigned customer queries'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Query
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Customer Query</DialogTitle>
              <DialogDescription>
                Add a new customer query. It will be automatically assigned to an available agent.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="flatType">Flat Type</Label>
                  <Input
                    id="flatType"
                    value={formData.flatType}
                    onChange={(e) => setFormData({ ...formData, flatType: e.target.value })}
                    placeholder="e.g., 2BHK, 3BHK"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rentRange">Rent Range (₹)</Label>
                  <Input
                    id="rentRange"
                    type="number"
                    value={formData.rentRange}
                    onChange={(e) => setFormData({ ...formData, rentRange: e.target.value })}
                    placeholder="Enter rent amount"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="10-digit phone number"
                    maxLength={10}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createQuery.isPending}>
                  {createQuery.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Query
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Queries</CardTitle>
          <CardDescription>
            {queries.length} {queries.length === 1 ? 'query' : 'queries'} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No customer queries found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Flat Type</TableHead>
                    <TableHead>Rent Range</TableHead>
                    <TableHead>Contact</TableHead>
                    {isAdmin && <TableHead>Assigned Agent</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queries.map((query) => (
                    <TableRow key={query.id.toString()}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {query.customerName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          {query.flatType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          ₹{query.rentRange.toString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {query.contactPhone}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <AgentDisplay agentId={query.assignedAgent} />
                        </TableCell>
                      )}
                      <TableCell>{getStatusBadge(query.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(Number(query.createdAt) / 1000000).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={QueryStatus.open}
                          onValueChange={(value) => handleStatusChange(query.id, value as QueryStatus)}
                          disabled={updateStatus.isPending}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={QueryStatus.open}>Open</SelectItem>
                            <SelectItem value={QueryStatus.inProgress}>In Progress</SelectItem>
                            <SelectItem value={QueryStatus.resolved}>Resolved</SelectItem>
                            <SelectItem value={QueryStatus.closed}>Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AgentDisplay({ agentId }: { agentId: any }) {
  const { data: profile } = useGetUserProfile(agentId || null);

  if (!agentId) {
    return <span className="text-muted-foreground text-sm">Unassigned</span>;
  }

  if (!profile) {
    return <span className="text-muted-foreground text-sm">Loading...</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{profile.name}</span>
    </div>
  );
}
