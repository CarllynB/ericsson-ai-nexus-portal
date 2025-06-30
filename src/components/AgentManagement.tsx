import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRoles } from '@/hooks/useRoles';
import { Agent } from '@/services/api';
import { backendApiService } from '@/services/backendApi';

export const AgentManagement = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { canEdit, isSuperAdmin } = useRoles();
  const { toast } = useToast();

  const pageSize = 12;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    status: 'active' as Agent['status'],
    key_features: '',
    access_link: '',
    contact_name: '',
    contact_email: '',
    access_type: 'link' as 'link' | 'contact',
    owner: ''
  });

  const fetchAgentsList = async () => {
    try {
      console.log('Fetching agents from backend API...');
      const data = await backendApiService.getAgents();
      console.log('Fetched agents:', data);
      
      // Sort agents: active first, then by name
      const sortedAgents = data.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return a.name.localeCompare(b.name);
      });
      setAgents(sortedAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents from backend database",
        variant: "destructive"
      });
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.key_features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredAgents.length / pageSize);
  const displayedAgents = showAll ? filteredAgents : filteredAgents.slice((page - 1) * pageSize, page * pageSize);

  const checkDuplicateName = (name: string, excludeId?: string) => {
    return agents.some(agent => 
      agent.name.toLowerCase() === name.toLowerCase() && 
      (!excludeId || agent.id !== excludeId)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate names
    if (checkDuplicateName(formData.name, editingAgent?.id)) {
      toast({
        title: "Error",
        description: "An agent with this name already exists. Please choose a different name.",
        variant: "destructive"
      });
      return;
    }

    const agentData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      status: formData.status,
      key_features: formData.key_features.split('\n').filter(f => f.trim()),
      access_link: formData.access_type === 'link' ? formData.access_link || undefined : undefined,
      contact_info: formData.access_type === 'contact' ? {
        name: formData.contact_name,
        email: formData.contact_email
      } : undefined,
      owner: formData.owner
    };

    try {
      if (editingAgent) {
        await backendApiService.updateAgent(editingAgent.id, agentData);
        toast({
          title: "Success",
          description: "Agent updated successfully and saved to backend database"
        });
      } else {
        await backendApiService.createAgent(agentData);
        toast({
          title: "Success",
          description: "Agent created successfully and saved to backend database"
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
        contact_name: '',
        contact_email: '',
        access_type: 'link',
        owner: ''
      });
      fetchAgentsList();
    } catch (error) {
      toast({
        title: "Error",
        description: editingAgent ? "Failed to update agent" : "Failed to create agent",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (agent: Agent) => {
    console.log('Edit button clicked for agent:', agent.name);
    console.log('Can edit:', canEdit);
    
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description,
      category: agent.category,
      status: agent.status,
      key_features: agent.key_features.join('\n'),
      access_link: agent.access_link || '',
      contact_name: agent.contact_info?.name || '',
      contact_email: agent.contact_info?.email || '',
      access_type: agent.contact_info ? 'contact' : 'link',
      owner: agent.owner
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent? This will permanently remove it from the backend database.')) return;

    try {
      await backendApiService.deleteAgent(agentId);
      toast({
        title: "Success",
        description: "Agent deleted successfully from backend database"
      });
      fetchAgentsList();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive"
      });
    }
  };

  const toggleCardExpansion = (agentId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  const getStatusBadgeColor = (status: Agent['status']) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "coming_soon":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    fetchAgentsList();
  }, []);

  useEffect(() => {
    setPage(1);
    setShowAll(false);
  }, [searchTerm]);

  if (!canEdit) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Agent Management</h2>
        {/* Only super admins can add new agents */}
        {isSuperAdmin && (
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
                  onValueChange={(value: Agent['status']) => 
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
                
                <div className="space-y-4">
                  <label className="text-sm font-medium">Access Type</label>
                  <Select
                    value={formData.access_type}
                    onValueChange={(value: 'link' | 'contact') => 
                      setFormData({...formData, access_type: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Access Link</SelectItem>
                      <SelectItem value="contact">Contact Information</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {formData.access_type === 'link' ? (
                    <Input
                      placeholder="Access Link (optional)"
                      value={formData.access_link}
                      onChange={(e) => setFormData({...formData, access_link: e.target.value})}
                    />
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Contact Name"
                        value={formData.contact_name}
                        onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                        required
                      />
                      <Input
                        placeholder="Contact Email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                        required
                      />
                    </div>
                  )}
                </div>
                
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

      <div className="max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="search"
            placeholder="Search agents by name, description, category, owner, or features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
        {displayedAgents.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground text-lg">No agents found matching your search.</p>
          </div>
        ) : (
          displayedAgents.map((agent) => {
            const isExpanded = expandedCards.has(agent.id);
            return (
              <Card key={agent.id} className="relative hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{agent.name}</CardTitle>
                        <button
                          onClick={() => toggleCardExpansion(agent.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {agent.category}
                        </Badge>
                        <Badge 
                          variant="secondary"
                          className={getStatusBadgeColor(agent.status)}
                        >
                          {agent.status === "coming_soon" ? "Coming Soon" : agent.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* All admins (including super admins) can edit */}
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(agent)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {/* Only super admins can delete */}
                      {isSuperAdmin && (
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
                  <p className="text-muted-foreground text-sm">{agent.description}</p>
                </CardHeader>

                {isExpanded && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <h4 className="font-semibold text-sm text-foreground mb-3 mt-4">Key Features:</h4>
                    <ul className="space-y-2">
                      {agent.key_features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Owner:</strong> {agent.owner}</p>
                    {agent.access_link && (
                      <p className="text-sm"><strong>Access Link:</strong> 
                        <a href={agent.access_link} target="_blank" rel="noopener noreferrer" 
                           className="text-primary hover:underline ml-2">
                          {agent.access_link}
                        </a>
                      </p>
                    )}
                    {agent.contact_info && (
                      <div className="text-sm">
                        <p><strong>Contact:</strong> {agent.contact_info.name}</p>
                        <p><strong>Email:</strong> {agent.contact_info.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {!showAll && totalPages > 1 && (
        <div className="flex justify-center gap-4">
          {page > 1 && (
            <Button 
              onClick={() => setPage(p => p - 1)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
          )}
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button 
              onClick={() => setPage(p => p + 1)}
              variant="outline"
            >
              Next
            </Button>
          )}
          <Button 
            onClick={() => setShowAll(true)}
            variant="default"
          >
            Show All
          </Button>
        </div>
      )}

      {showAll && (
        <div className="flex justify-center">
          <Button 
            onClick={() => {
              setShowAll(false);
              setPage(1);
            }}
            variant="outline"
          >
            Show Less
          </Button>
        </div>
      )}
    </div>
  );
};
