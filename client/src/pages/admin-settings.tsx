import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Network {
  id: string;
  name: string;
  ssid: string;
  tokenPrice: number;
  tokenDuration: string;
  isActive: boolean;
}

export default function AdminSettings() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<Network | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    ssid: "",
    tokenPrice: 5,
    tokenDuration: "12",
    isActive: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadNetworks();
  }, []);

  const loadNetworks = async () => {
    try {
      const response = await apiRequest("GET", "/api/networks");
      const data = await response.json();
      setNetworks(data);
    } catch (error) {
      console.error('Failed to load networks:', error);
      toast({
        title: "Error",
        description: "Failed to load networks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingNetwork ? `/api/networks/${editingNetwork.id}` : "/api/networks";
      const method = editingNetwork ? "PUT" : "POST";

      await apiRequest(method, url, formData);

      toast({
        title: editingNetwork ? "Network updated" : "Network created",
        description: `Network "${formData.name}" has been ${editingNetwork ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingNetwork(null);
      resetForm();
      loadNetworks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save network",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (network: Network) => {
    setEditingNetwork(network);
    setFormData({
      name: network.name,
      ssid: network.ssid,
      tokenPrice: network.tokenPrice,
      tokenDuration: network.tokenDuration,
      isActive: network.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the network "${name}"?`)) return;

    try {
      await apiRequest("DELETE", `/api/networks/${id}`);
      toast({
        title: "Network deleted",
        description: `Network "${name}" has been deleted successfully`,
      });
      loadNetworks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete network",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      ssid: "",
      tokenPrice: 5,
      tokenDuration: "12",
      isActive: true
    });
  };

  const openCreateDialog = () => {
    setEditingNetwork(null);
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Network Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure WiFi networks with different pricing and duration settings
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Network
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNetwork ? 'Edit Network' : 'Create New Network'}</DialogTitle>
              <DialogDescription>
                Configure network settings including pricing and duration.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Network Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Guest WiFi"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ssid">SSID (WiFi Name)</Label>
                  <Input
                    id="ssid"
                    value={formData.ssid}
                    onChange={(e) => setFormData({ ...formData, ssid: e.target.value })}
                    placeholder="e.g., GuestWiFi"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tokenPrice">Token Price ($)</Label>
                    <Input
                      id="tokenPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.tokenPrice}
                      onChange={(e) => setFormData({ ...formData, tokenPrice: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenDuration">Duration (hours)</Label>
                    <Input
                      id="tokenDuration"
                      type="number"
                      min="1"
                      value={formData.tokenDuration}
                      onChange={(e) => setFormData({ ...formData, tokenDuration: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNetwork ? 'Update' : 'Create'} Network
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>WiFi Networks</CardTitle>
          <CardDescription>
            Manage your WiFi networks and their pricing configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading networks...</div>
          ) : networks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No networks configured yet. Click "Add Network" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Network Name</TableHead>
                  <TableHead>SSID</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networks.map((network) => (
                  <TableRow key={network.id}>
                    <TableCell className="font-medium">{network.name}</TableCell>
                    <TableCell>{network.ssid}</TableCell>
                    <TableCell>${network.tokenPrice}</TableCell>
                    <TableCell>{network.tokenDuration} hours</TableCell>
                    <TableCell>
                      <Badge variant={network.isActive ? "default" : "secondary"}>
                        {network.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(network)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(network.id, network.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
