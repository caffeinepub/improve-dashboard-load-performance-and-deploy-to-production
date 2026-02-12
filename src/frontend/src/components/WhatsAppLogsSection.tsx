import { useGetAllWhatsAppMessageLogs, useGetAgentWhatsAppMessageLogs, useIsCallerAdmin, useGetAllLeads } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import type { WhatsAppMessageLog } from '../backend';

export default function WhatsAppLogsSection() {
  const { data: isAdmin = false, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: adminLogs = [], isLoading: adminLogsLoading } = useGetAllWhatsAppMessageLogs();
  const { data: agentLogs = [], isLoading: agentLogsLoading } = useGetAgentWhatsAppMessageLogs();
  const { data: leads = [] } = useGetAllLeads();

  const logs = isAdmin ? adminLogs : agentLogs;
  const isLoading = adminLoading || (isAdmin ? adminLogsLoading : agentLogsLoading);

  const getLeadName = (leadId: bigint | undefined) => {
    if (!leadId) return 'N/A';
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.name : `Lead #${leadId}`;
  };

  const sortedLogs = [...logs].sort((a, b) => Number(b.timestamp - a.timestamp));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">WhatsApp Message Logs</h2>
        <p className="text-muted-foreground">
          {isAdmin ? 'View all automatic WhatsApp follow-up messages' : 'View your automatic WhatsApp follow-up messages'}
        </p>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No WhatsApp messages logged yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Messages will appear here when leads are created or follow-ups are added.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedLogs.map((log) => (
            <Card key={log.id.toString()}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">Message #{log.id.toString()}</CardTitle>
                      {log.sentStatus ? (
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Logged
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500/20 text-amber-700 dark:text-amber-400">
                          <XCircle className="mr-1 h-3 w-3" />
                          No Template
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(Number(log.timestamp) / 1000000).toLocaleString()}
                    </CardDescription>
                  </div>
                  {log.leadId !== undefined && (
                    <Badge variant="outline" className="ml-2">
                      {getLeadName(log.leadId)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm whitespace-pre-wrap">{log.messageContent}</p>
                </div>
                {!log.sentStatus && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: This message was logged but no default template was configured at the time.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
