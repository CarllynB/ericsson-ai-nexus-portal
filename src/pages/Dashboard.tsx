import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoles } from "@/hooks/useRoles";
import { useAgents } from "@/hooks/useAgents";
import { DataTableView } from "@/components/data-table-view";
import { AgentManagement } from "@/components/AgentManagement";
import { UserManagement } from "@/components/UserManagement";
import { NovaSettings } from "@/components/NovaSettings";

const Dashboard = () => {
  const { isAdmin, isSuperAdmin } = useRoles();
  const { agents, loading, error } = useAgents();
  const [timeSavings, setTimeSavings] = useState(0);
  const [dollarSavings, setDollarSavings] = useState(0);

  useEffect(() => {
    // Mock data for time and dollar savings
    setTimeSavings(1234);
    setDollarSavings(5678);
  }, []);

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="agents">Agents</TabsTrigger>
            {isAdmin && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="user-management">User Management</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="agent-management">Agent Management</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="nova-settings">NOVA Settings</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent List</CardTitle>
                <CardDescription>
                  View and manage the list of available agents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTableView agents={agents} loading={loading} error={error} />
              </CardContent>
            </Card>
          </TabsContent>
          
          {isAdmin && (
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Time Savings</CardTitle>
                    <CardDescription>
                      Total time saved by using AI agents.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{timeSavings} hours</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dollar Savings</CardTitle>
                    <CardDescription>
                      Total dollar amount saved by using AI agents.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${dollarSavings}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Adoption</CardTitle>
                  <CardDescription>
                    Agent adoption rate over time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>[Adoption Graph]</div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {isSuperAdmin && (
            <TabsContent value="user-management" className="space-y-6">
              <UserManagement />
            </TabsContent>
          )}
          
          {isSuperAdmin && (
            <TabsContent value="agent-management" className="space-y-6">
              <AgentManagement />
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="nova-settings" className="space-y-6">
              <NovaSettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
