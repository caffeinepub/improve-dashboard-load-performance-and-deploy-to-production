import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Search, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useGetAgentPanelData, useChangeAgentApprovalStatus } from '../hooks/useQueries';
import { ApprovalStatus } from '../backend';
import { Principal } from '@dfinity/principal';

export default function AgentPanelSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: agentPanelData, isLoading } = useGetAgentPanelData();
  const changeApprovalMutation = useChangeAgentApprovalStatus();

  const handleApprove = async (agentPrincipal: Principal) => {
    await changeApprovalMutation.mutateAsync({
      agentPrincipal,
      status: ApprovalStatus.approved,
    });
  };

  const handleReject = async (agentPrincipal: Principal) => {
    await changeApprovalMutation.mutateAsync({
      agentPrincipal,
      status: ApprovalStatus.rejected,
    });
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'approved') {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else if (normalizedStatus === 'pending') {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    } else if (normalizedStatus === 'rejected') {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const filteredAgents = agentPanelData?.agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.contactNumber.includes(searchTerm) ||
    agent.approvalStatus.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading agent data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Agent Panel</h2>
        <p className="text-muted-foreground">Manage agent registrations and approval status</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentPanelData?.agentStats.totalAgents.toString() || '0'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {agentPanelData?.agentStats.approvedAgents.toString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {agentPanelData?.agentStats.approvalRate.toFixed(1)}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {agentPanelData?.agentStats.pendingAgents.toString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {agentPanelData?.agentStats.rejectedAgents.toString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {agentPanelData?.agentStats.rejectionRate.toFixed(1)}% rejection rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Registered Agents
          </CardTitle>
          <CardDescription>
            View and manage agent approval status. Approved agents can access the CRM dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, contact, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Agent Table */}
          {filteredAgents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No agents found</p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search criteria' : 'No agents have registered yet'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => (
                    <TableRow key={agent.principal.toString()}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell className="font-mono text-sm">{agent.contactNumber}</TableCell>
                      <TableCell>{getStatusBadge(agent.approvalStatus)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {agent.approvalStatus.toLowerCase() !== 'approved' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(agent.principal)}
                              disabled={changeApprovalMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          {agent.approvalStatus.toLowerCase() !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(agent.principal)}
                              disabled={changeApprovalMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Changes */}
      {agentPanelData?.recentChanges && agentPanelData.recentChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Changes
            </CardTitle>
            <CardDescription>
              Latest agent registrations and status updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agentPanelData.recentChanges.map((agent) => (
                <div
                  key={agent.principal.toString()}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">{agent.contactNumber}</p>
                    </div>
                  </div>
                  {getStatusBadge(agent.approvalStatus)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
