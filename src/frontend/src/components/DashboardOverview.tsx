import { useGetOverviewMetrics } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, Calendar, HelpCircle } from 'lucide-react';

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function DashboardOverview() {
  const { data: metrics, isLoading } = useGetOverviewMetrics();

  const conversionRate = metrics?.conversionRate 
    ? metrics.conversionRate.toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Key metrics and insights for your CRM</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Number(metrics?.totalCustomers || 0)}</div>
                <p className="text-xs text-muted-foreground">Active customer accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Number(metrics?.totalLeads || 0)}</div>
                <p className="text-xs text-muted-foreground">{conversionRate}% conversion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Queries</CardTitle>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Number(metrics?.customerQueryStats.openQueries || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Open queries of {Number(metrics?.customerQueryStats.totalQueries || 0)} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Number(metrics?.pendingFollowUps || 0)}</div>
                <p className="text-xs text-muted-foreground">Scheduled tasks</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {metrics?.recentFollowUps.slice(0, 5).map((followUp) => {
                    const customer = metrics.recentCustomers.find((c) => c.id === followUp.customerId);
                    return (
                      <div key={followUp.id.toString()} className="flex items-center gap-4 rounded-lg border p-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Follow-up with {customer?.name || `Customer #${followUp.customerId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(Number(followUp.dueDate) / 1000000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {(!metrics?.recentFollowUps || metrics.recentFollowUps.length === 0) && (
                    <p className="text-center text-sm text-muted-foreground py-4">No pending follow-ups</p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {metrics?.recentLeads.slice(0, 5).map((lead) => (
                    <div key={lead.id.toString()} className="flex items-center gap-4 rounded-lg border p-3">
                      <UserPlus className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(Number(lead.createdAt) / 1000000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!metrics?.recentLeads || metrics.recentLeads.length === 0) && (
                    <p className="text-center text-sm text-muted-foreground py-4">No recent leads</p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
