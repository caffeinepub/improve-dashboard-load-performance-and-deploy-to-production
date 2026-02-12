import { useState } from 'react';
import { useGetLeadsByStatus, useCreateLead, useUpdateLead, useGetAllLeadsPaginated, useIsCallerAdmin, useAssignLead } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Loader2, Mail, Phone, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { LeadStatus } from '../backend';
import type { Lead } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

const leadStatusLabels: Record<LeadStatus, string> = {
  [LeadStatus.new_]: 'New',
  [LeadStatus.contacted]: 'Contacted',
  [LeadStatus.qualified]: 'Qualified',
  [LeadStatus.converted]: 'Converted',
  [LeadStatus.lost]: 'Lost',
};

const leadStatusColors: Record<LeadStatus, string> = {
  [LeadStatus.new_]: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  [LeadStatus.contacted]: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  [LeadStatus.qualified]: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  [LeadStatus.converted]: 'bg-green-500/10 text-green-700 dark:text-green-400',
  [LeadStatus.lost]: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

function LeadCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export default function LeadsSection() {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>(LeadStatus.new_);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  
  const { data: paginatedData, isLoading } = useGetAllLeadsPaginated(currentPage, pageSize);
  const { data: isAdmin = false } = useIsCallerAdmin();
  const { identity } = useInternetIdentity();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const assignLead = useAssignLead();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const leads = paginatedData?.leads.filter(lead => lead.status === selectedStatus) || [];
  const totalLeads = Number(paginatedData?.total || 0);
  const hasNextPage = paginatedData?.hasNextPage || false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const lead: Lead = {
      id: BigInt(0),
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      status: LeadStatus.new_,
      assignedAgent: undefined,
      createdAt: BigInt(Date.now() * 1000000),
    };

    createLead.mutate(lead, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ name: '', email: '', phone: '' });
      },
    });
  };

  const handleUpdateLeadStatus = (lead: Lead, newStatus: LeadStatus) => {
    const updatedLead: Lead = {
      ...lead,
      status: newStatus,
    };
    updateLead.mutate({ id: lead.id, lead: updatedLead });
  };

  const handleAssignToSelf = (leadId: bigint) => {
    if (!identity) {
      toast.error('Not authenticated');
      return;
    }
    const principal = identity.getPrincipal();
    assignLead.mutate({ leadId, agentId: principal });
  };

  const handleAssignToAgent = (leadId: bigint, agentPrincipal: string) => {
    try {
      const principal = Principal.fromText(agentPrincipal);
      assignLead.mutate({ leadId, agentId: principal });
    } catch (error) {
      toast.error('Invalid agent principal');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lead Management</h2>
          <p className="text-muted-foreground">Track and manage your sales leads ({totalLeads} total)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>Enter lead details to add them to your pipeline</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Lead name"
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
                  placeholder="lead@example.com"
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
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLead.isPending || !formData.name.trim()}>
                  {createLead.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Lead'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter by Status</CardTitle>
          <CardDescription>View leads by their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as LeadStatus)}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(leadStatusLabels).map(([status, label]) => (
                <SelectItem key={status} value={status}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LeadCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leads.map((lead) => (
              <Card key={lead.id.toString()}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                    <Badge className={leadStatusColors[lead.status]}>{leadStatusLabels[lead.status]}</Badge>
                  </div>
                  <CardDescription>Lead #{lead.id.toString()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  
                  {lead.assignedAgent && (
                    <div className="pt-2">
                      <Badge variant="outline" className="text-xs">
                        <UserPlus className="mr-1 h-3 w-3" />
                        Assigned
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <Label className="text-xs">Update Status:</Label>
                    <Select
                      value={lead.status}
                      onValueChange={(value) => handleUpdateLeadStatus(lead, value as LeadStatus)}
                      disabled={updateLead.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(leadStatusLabels).map(([status, label]) => (
                          <SelectItem key={status} value={status}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!isAdmin && !lead.assignedAgent && (
                    <Button
                      onClick={() => handleAssignToSelf(lead.id)}
                      disabled={assignLead.isPending}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {assignLead.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Assign to Me
                        </>
                      )}
                    </Button>
                  )}

                  {isAdmin && (
                    <div className="space-y-2 pt-2">
                      <Label className="text-xs">Assign to Agent:</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Agent Principal ID"
                          id={`agent-${lead.id}`}
                          className="text-xs"
                        />
                        <Button
                          onClick={() => {
                            const input = document.getElementById(`agent-${lead.id}`) as HTMLInputElement;
                            if (input?.value) {
                              handleAssignToAgent(lead.id, input.value);
                            }
                          }}
                          disabled={assignLead.isPending}
                          size="sm"
                        >
                          {assignLead.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Assign'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 text-xs text-muted-foreground">
                    Created: {new Date(Number(lead.createdAt) / 1000000).toLocaleDateString()}
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

      {!isLoading && leads.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No leads found with status: {leadStatusLabels[selectedStatus]}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
