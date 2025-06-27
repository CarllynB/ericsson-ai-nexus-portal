
import { useState } from "react";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSidebarItems, SidebarItem } from "@/hooks/useSidebarItems";
import { Badge } from "@/components/ui/badge";

export const SidebarManagement = () => {
  const { items, loading, addItem, updateItem, deleteItem, reorderItems } = useSidebarItems();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SidebarItem | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [draggedItem, setDraggedItem] = useState<SidebarItem | null>(null);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const success = await addItem(newTitle.trim(), newUrl.trim());
    if (success) {
      setNewTitle("");
      setNewUrl("");
      setAddDialogOpen(false);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !newTitle.trim() || !newUrl.trim()) return;

    const success = await updateItem(editingItem.id, {
      title: newTitle.trim(),
      url: newUrl.trim()
    });

    if (success) {
      setEditDialogOpen(false);
      setEditingItem(null);
      setNewTitle("");
      setNewUrl("");
    }
  };

  const openEditDialog = (item: SidebarItem) => {
    setEditingItem(item);
    setNewTitle(item.title);
    setNewUrl(item.url);
    setEditDialogOpen(true);
  };

  const handleDragStart = (item: SidebarItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetItem: SidebarItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
    const targetIndex = items.findIndex(item => item.id === targetItem.id);

    const newItems = [...items];
    newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    await reorderItems(newItems);
    setDraggedItem(null);
  };

  const isDefaultItem = (id: string) => {
    return ['home', 'agents', 'dashboard', 'pitchbox'].includes(id);
  };

  const isExternalUrl = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sidebar Management</h2>
          <p className="text-sm text-muted-foreground">
            Customize the sidebar navigation items. Drag and drop to reorder.
          </p>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Sidebar Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Reports"
                  required
                />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="e.g., /reports or https://example.com"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use relative URLs (e.g., /reports) for internal pages or full URLs for external links
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  Add Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <Card 
            key={item.id}
            className="cursor-move hover:shadow-md transition-shadow"
            draggable
            onDragStart={() => handleDragStart(item)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      {isDefaultItem(item.id) && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                      {/* Removed the ExternalLink icon */}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.url}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!isDefaultItem(item.id) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteItem(item.id)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sidebar Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditItem} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
