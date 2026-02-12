import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DashboardOverview from '../components/DashboardOverview';
import LeadsSection from '../components/LeadsSection';
import CustomersSection from '../components/CustomersSection';
import CustomerQueriesSection from '../components/CustomerQueriesSection';
import FollowUpsSection from '../components/FollowUpsSection';
import TemplatesSection from '../components/TemplatesSection';
import WhatsAppSection from '../components/WhatsAppSection';
import AttendanceSection from '../components/AttendanceSection';
import CustomerAppLinkSection from '../components/CustomerAppLinkSection';
import AgentPanelSection from '../components/AgentPanelSection';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { LayoutDashboard, Users, UserPlus, Calendar, FileText, MessageCircle, ClipboardCheck, HelpCircle, ExternalLink, UserCheck } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['overview']));
  const { data: isAdmin = false } = useIsCallerAdmin();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setVisitedTabs((prev) => new Set(prev).add(value));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-2">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Leads</span>
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Customers</span>
              </TabsTrigger>
              <TabsTrigger value="queries" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Queries</span>
              </TabsTrigger>
              <TabsTrigger value="followups" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Follow-ups</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Attendance</span>
              </TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger value="agents" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Agents</span>
                  </TabsTrigger>
                  <TabsTrigger value="customer-link" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden sm:inline">Customer App</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview />
            </TabsContent>

            <TabsContent value="leads" className="space-y-6">
              {visitedTabs.has('leads') && <LeadsSection />}
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              {visitedTabs.has('customers') && <CustomersSection />}
            </TabsContent>

            <TabsContent value="queries" className="space-y-6">
              {visitedTabs.has('queries') && <CustomerQueriesSection />}
            </TabsContent>

            <TabsContent value="followups" className="space-y-6">
              {visitedTabs.has('followups') && <FollowUpsSection />}
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              {visitedTabs.has('templates') && <TemplatesSection />}
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-6">
              {visitedTabs.has('whatsapp') && <WhatsAppSection />}
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              {visitedTabs.has('attendance') && <AttendanceSection />}
            </TabsContent>

            {isAdmin && (
              <>
                <TabsContent value="agents" className="space-y-6">
                  {visitedTabs.has('agents') && <AgentPanelSection />}
                </TabsContent>
                <TabsContent value="customer-link" className="space-y-6">
                  {visitedTabs.has('customer-link') && <CustomerAppLinkSection />}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
