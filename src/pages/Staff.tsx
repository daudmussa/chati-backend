import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Users, Pencil, Trash2, Search, User } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';

interface Staff {
  id: string;
  userId: string;
  name: string;
  gender: string | null;
  promoCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Staff() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    promoCode: '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }
    fetchStaff();
  }, [user]);

  const fetchStaff = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.STAFF, {
        headers: {
          'x-user-id': user.id,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      } else {
        throw new Error('Failed to fetch staff');
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!user?.id) return;
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.STAFF, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          gender: formData.gender || null,
          promoCode: formData.promoCode.trim() || null,
        }),
      });

      if (response.ok) {
        const newStaff = await response.json();
        setStaff([newStaff, ...staff]);
        setIsAddDialogOpen(false);
        setFormData({ name: '', gender: '', promoCode: '' });
        toast({
          title: "Success",
          description: "Staff member added successfully",
        });
      } else {
        throw new Error('Failed to add staff');
      }
    } catch (error) {
      console.error('Failed to add staff:', error);
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStaff = async () => {
    if (!user?.id || !editingStaff) return;
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.STAFF_BY_ID(editingStaff.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          gender: formData.gender || null,
          promoCode: formData.promoCode.trim() || null,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setStaff(staff.map(s => s.id === updated.id ? updated : s));
        setIsEditDialogOpen(false);
        setEditingStaff(null);
        setFormData({ name: '', gender: '', promoCode: '' });
        toast({
          title: "Success",
          description: "Staff member updated successfully",
        });
      } else {
        throw new Error('Failed to update staff');
      }
    } catch (error) {
      console.error('Failed to update staff:', error);
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!user?.id) return;
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const response = await fetch(API_ENDPOINTS.STAFF_BY_ID(staffId), {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
        },
      });

      if (response.ok) {
        setStaff(staff.filter(s => s.id !== staffId));
        toast({
          title: "Success",
          description: "Staff member deleted successfully",
        });
      } else {
        throw new Error('Failed to delete staff');
      }
    } catch (error) {
      console.error('Failed to delete staff:', error);
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      gender: staffMember.gender || '',
      promoCode: staffMember.promoCode || '',
    });
    setIsEditDialogOpen(true);
  };

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.promoCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-500 mt-1">Manage your staff members</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  Add a new staff member to your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter staff name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promoCode">Promo Code</Label>
                  <Input
                    id="promoCode"
                    placeholder="Enter promo code (optional)"
                    value={formData.promoCode}
                    onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStaff}>Add Staff</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">With Promo Code</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {staff.filter(s => s.promoCode).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Without Promo Code</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {staff.filter(s => !s.promoCode).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Staff Members</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No staff members found' : 'No staff members yet. Add your first staff member!'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStaff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          {member.gender && (
                            <Badge variant="secondary" className="text-xs">
                              {member.gender.charAt(0).toUpperCase() + member.gender.slice(1)}
                            </Badge>
                          )}
                          {member.promoCode && (
                            <Badge className="bg-green-600 text-xs">
                              🎁 {member.promoCode}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            Added {new Date(member.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(member)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStaff(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update staff member information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter staff name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-promoCode">Promo Code</Label>
                <Input
                  id="edit-promoCode"
                  placeholder="Enter promo code (optional)"
                  value={formData.promoCode}
                  onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStaff}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
