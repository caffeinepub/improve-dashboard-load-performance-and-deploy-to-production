import { useState } from 'react';
import { useGetAllFollowUps, useGetAllCustomers, useGetAllLeads, useAddFollowUp, useCompleteFollowUp } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Calendar, CheckCircle2, Clock } from 'lucide-react';
import type { FollowUp } from '../backend';

export default function FollowUpsSection() {
  const { data: followUps = [], isLoading } = useGetAllFollowUps();
  const { data: customers = [] } = useGetAllCustomers();
  const { data: leads = [] } = useGetAllLeads();
  const addFollowUp = useAddFollowUp();
  const completeFollowUp = useCompleteFollowUp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    leadId: '',
    dueDate: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.dueDate) return;

    const followUp: FollowUp = {
      id: BigInt(0),
      customerId: BigInt(formData.customerId),
      dueDate: BigInt(new Date(formData.dueDate).getTime() * 1000000),
      completed: false,
      notes: formData.notes.trim() || undefined,
    };

    const leadId = formData.leadId ? BigInt(formData.leadId) : null;

    addFollowUp.mutate({ followUp, leadId }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ customerId: '', leadId: '', dueDate: '', notes: '' });
        
        // Automatic WhatsApp follow-up will be triggered by backend
      },
    });
  };

  const handleToggleComplete = (followUpId: bigint, currentStatus: boolean) => {
    completeFollowUp.mutate({ id: followUpId, isCompleted: !currentStatus });
  };

  const sortedFollowUps = [...followUps].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return Number(a.dueDate - b.dueDate);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Follow-up Tracking</h2>
          <p className="text-muted-foreground">Schedule and track customer follow-ups</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Follow-up
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Follow-up</DialogTitle>
              <DialogDescription>Create a new follow-up task for a customer</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id.toString()} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead">Related Lead (Optional)</Label>
                <Select value={formData.leadId} onValueChange={(value) => setFormData({ ...formData, leadId: value })}>
                  <SelectTrigger id="lead">
                    <SelectValue placeholder="Select a lead (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id.toString()} value={lead.id.toString()}>
                        {lead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Follow-up details"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addFollowUp.isPending || !formData.customerId || !formData.dueDate}>
                  {addFollowUp.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    'Schedule'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {sortedFollowUps.map((followUp) => {
            const customer = customers.find((c) => c.id === followUp.customerId);
            const dueDate = new Date(Number(followUp.dueDate) / 1000000);
            const isOverdue = !followUp.completed && dueDate < new Date();

            return (
              <Card key={followUp.id.toString()}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={followUp.completed}
                        onCheckedChange={() => handleToggleComplete(followUp.id, followUp.completed)}
                        className="mt-1"
                      />
                      <div>
                        <CardTitle className={followUp.completed ? 'line-through text-muted-foreground' : ''}>
                          Follow-up with {customer?.name || `Customer #${followUp.customerId}`}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          {dueDate.toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {followUp.completed ? (
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      ) : isOverdue ? (
                        <Badge variant="destructive">
                          <Clock className="mr-1 h-3 w-3" />
                          Overdue
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {followUp.notes && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{followUp.notes}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && followUps.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No follow-ups scheduled. Create your first follow-up task.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
