
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Agent {
  id: number;
  name: string;
  description: string;
  category: string;
  status: string;
  owner: string;
}

interface DataTableViewProps {
  agents: Agent[];
  loading: boolean;
  error: string | null;
}

export const DataTableView = ({ agents, loading, error }: DataTableViewProps) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Error loading agents: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <Card key={agent.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Category: {agent.category} | Owner: {agent.owner}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {agent.status}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
