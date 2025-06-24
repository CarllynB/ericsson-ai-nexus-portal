
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useRoles } from '@/hooks/useRoles';

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'coming_soon';
  key_features: string[];
  access_link?: string;
  owner: string;
}

export const AgentManagement = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { currentUserRole } = useRoles();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    status: 'active' as const,
    key_features: '',
    access_link: '',
    owner: ''
  });

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      return;
    }

    setAgents(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const agentData = {
      ...formData,
      key_features: formData.key_features.split('\n').filter(f => f.trim()),
      last_updated: new Date().toISOString()
    };

    if (editingAgent) {
      const { error } = await supabase
        .from('agents')
        .update(agentData)
        .eq('id', editingAgent.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update agent",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Agent updated successfully"
      });
    } else {
      const { error } = await supabase
        .from('agents')
        .insert({
          ...agentData,
          id: formData.name.toLowerCase().replace(/\s+/g, '-')
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create agent",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Agent created successfully"
      });
    }

    setIsDialogOpen(false);
    setEditingAgent(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      status: 'active',
      key_features: '',
      access_link: '',
      owner: ''
    });
    fetchAgents();
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description,
      category: agent.category,
      status: agent.status,
      key_features: agent.key_features.join('\n'),
      access_link: agent.access_link || '',
      owner: agent.owner
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Agent deleted successfully"
    });
    fetchAgents();
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  if (!currentUserRole || !['admin', 'super_admin'].includes(currentUserRole)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Agent Management</h2>
        {currentUserRole === 'super_admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAgent ? 'Edit Agent' : 'Create New Agent'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Agent Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
                <Input
                  placeholder="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                />
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive' | 'coming_soon') => 
                    setFormData({...formData, status: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Key Features (one per line)"
                  value={formData.key_features}
                  onChange={(e) => setFormData({...formData, key_features: e.target.value})}
                />
                <Input
                  placeholder="Access Link"
                  value={formData.access_link}
                  onChange={(e) => setFormData({...formData, access_link: e.target.value})}
                />
                <Input
                  placeholder="Owner"
                  value={formData.owner}
                  onChange={(e) => setFormData({...formData, owner: e.target.value})}
                  required
                />
                <Button type="submit" className="w-full">
                  {editingAgent ? 'Update Agent' : 'Create Agent'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{agent.name}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{agent.category}</Badge>
                    <Badge variant={
                      agent.status === 'active' ? 'default' :
                      agent.status === 'inactive' ? 'destructive' : 'secondary'
                    }>
                      {agent.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(agent)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {currentUserRole === 'super_admin' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(agent.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{agent.description}</p>
              <div className="space-y-2">
                <p><strong>Owner:</strong> {agent.owner}</p>
                {agent.access_link && (
                  <p><strong>Access Link:</strong> 
                    <a href={agent.access_link} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline ml-2">
                      {agent.access_link}
                    </a>
                  </p>
                )}
                <div>
                  <strong>Key Features:</strong>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    {agent.key_features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
