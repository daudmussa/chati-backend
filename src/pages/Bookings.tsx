import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Calendar, Clock, User, Phone, Search, CheckCircle2, XCircle, AlertCircle, Pencil, Trash2, Power, Download } from 'lucide-react';
import { format } from 'date-fns';
import { API_ENDPOINTS } from '@/config/api';

interface BookingService {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description: string;
  availableDates: string[]; // Array of dates in YYYY-MM-DD format
  timeSlots: string[]; // Array of available time slots
}

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  dateBooked: string;
  timeSlot: string;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  createdAt: string;
}

const mockServices: BookingService[] = [
  { id: '1', name: 'Consultation', duration: 30, price: 50000, description: 'One-on-one consultation session', availableDates: [], timeSlots: [] },
  { id: '2', name: 'Full Service', duration: 60, price: 100000, description: 'Complete service package', availableDates: [], timeSlots: [] },
  { id: '3', name: 'Premium Package', duration: 120, price: 200000, description: 'Premium service with extras', availableDates: [], timeSlots: [] },
];

const mockBookings: Booking[] = [
  {
    id: '1',
    customerName: 'John Mwangi',
    customerPhone: '+255 712 345 678',
    serviceId: '1',
    serviceName: 'Consultation',
    dateBooked: '2026-01-20',
    timeSlot: '10:00 AM',
    price: 50000,
    status: 'confirmed',
    notes: 'First time customer',
    createdAt: '2026-01-15T10:30:00Z',
  },
  {
    id: '2',
    customerName: 'Sarah Kimani',
    customerPhone: '+255 789 012 345',
    serviceId: '2',
    serviceName: 'Full Service',
    dateBooked: '2026-01-21',
    timeSlot: '2:00 PM',
    price: 100000,
    status: 'pending',
    notes: '',
    createdAt: '2026-01-16T14:20:00Z',
  },
  {
    id: '3',
    customerName: 'David Omondi',
    customerPhone: '+255 654 321 098',
    serviceId: '3',
    serviceName: 'Premium Package',
    dateBooked: '2026-01-18',
    timeSlot: '11:00 AM',
    price: 200000,
    status: 'completed',
    notes: 'Regular customer',
    createdAt: '2026-01-10T09:15:00Z',
  },
  {
    id: '4',
    customerName: 'Grace Wanjiku',
    customerPhone: '+255 741 852 963',
    serviceId: '1',
    serviceName: 'Consultation',
    dateBooked: '2026-01-19',
    timeSlot: '3:00 PM',
    price: 50000,
    status: 'cancelled',
    notes: 'Customer requested cancellation',
    createdAt: '2026-01-12T16:45:00Z',
  },
];

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

export default function Bookings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<BookingService | null>(null);
  const [bookingsEnabled, setBookingsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    name: '',
    duration: '30',
    price: '',
    description: '',
    availableDates: [] as string[],
    timeSlots: [] as string[],
  });

  const resetServiceForm = () => {
    setServiceForm({ name: '', duration: '30', price: '', description: '', availableDates: [], timeSlots: [] });
    setEditingService(null);
    setNewDate('');
    setSelectedTimes([]);
  };

  const handleOpenServiceDialog = (service?: BookingService) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name,
        duration: service.duration.toString(),
        price: service.price.toString(),
        description: service.description,
        availableDates: service.availableDates || [],
        timeSlots: service.timeSlots || [],
      });
      setSelectedTimes(service.timeSlots || []);
    } else {
      resetServiceForm();
    }
    setIsServiceDialogOpen(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.price) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const serviceData: BookingService = {
      id: editingService?.id || Math.random().toString(36).substr(2, 9),
      name: serviceForm.name,
      duration: parseInt(serviceForm.duration),
      price: parseFloat(serviceForm.price),
      description: serviceForm.description,
      availableDates: serviceForm.availableDates,
      timeSlots: serviceForm.timeSlots,
    };

    try {
      const response = await fetch(API_ENDPOINTS.SERVICES, {
        method: editingService ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) throw new Error('Failed to save service');

      if (editingService) {
        setServices(services.map(s => s.id === editingService.id ? serviceData : s));
        toast({ title: "Service updated", description: "Service has been updated successfully" });
      } else {
        setServices([...services, serviceData]);
        toast({ title: "Service added", description: "New service has been added" });
      }

      setIsServiceDialogOpen(false);
      resetServiceForm();
      loadServices();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save service", variant: "destructive" });
    }
  };

  const loadServices = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(API_ENDPOINTS.SERVICES, {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const loadBookings = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(API_ENDPOINTS.BOOKINGS, {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const loadBookingStatus = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(API_ENDPOINTS.BOOKINGS_STATUS, {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBookingsEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Failed to fetch bookings status:', error);
    }
  };

  const toggleBookings = async (enabled: boolean) => {
    if (!user?.id) return;
    try {
      const response = await fetch(API_ENDPOINTS.BOOKINGS_TOGGLE, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setBookingsEnabled(enabled);
        toast({
          title: enabled ? "Bookings Enabled" : "Bookings Disabled",
          description: enabled ? "Customers can now book via WhatsApp" : "Booking feature is now disabled",
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to toggle bookings", variant: "destructive" });
    }
  };

  const addDate = () => {
    if (newDate && !serviceForm.availableDates.includes(newDate)) {
      setServiceForm({
        ...serviceForm,
        availableDates: [...serviceForm.availableDates, newDate].sort(),
      });
      setNewDate('');
    }
  };

  const removeDate = (dateToRemove: string) => {
    setServiceForm({
      ...serviceForm,
      availableDates: serviceForm.availableDates.filter(d => d !== dateToRemove),
    });
  };

  const toggleTimeSlot = (time: string) => {
    const newTimeSlots = serviceForm.timeSlots.includes(time)
      ? serviceForm.timeSlots.filter(t => t !== time)
      : [...serviceForm.timeSlots, time].sort();
    
    setServiceForm({
      ...serviceForm,
      timeSlots: newTimeSlots,
    });
    setSelectedTimes(newTimeSlots);
  };

  const availableTimeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM',
  ];

  // Export bookings to CSV
  const exportToCSV = () => {
    const headers = ['Booking ID', 'Customer Name', 'Phone', 'Service', 'Date', 'Time', 'Price (TZS)', 'Status', 'Notes', 'Created At'];
    
    const rows = filteredBookings.map(booking => [
      booking.id,
      booking.customerName,
      booking.customerPhone,
      booking.serviceName,
      booking.dateBooked,
      booking.timeSlot,
      booking.price,
      booking.status,
      booking.notes || '',
      format(new Date(booking.createdAt), 'yyyy-MM-dd HH:mm:ss')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ 
      title: "Export Successful", 
      description: `${filteredBookings.length} bookings exported to CSV` 
    });
  };

  // Export bookings to Excel format (TSV - compatible with Excel and Google Sheets)
  const exportToExcel = () => {
    const headers = ['Booking ID', 'Customer Name', 'Phone', 'Service', 'Date', 'Time', 'Price (TZS)', 'Status', 'Notes', 'Created At'];
    
    const rows = filteredBookings.map(booking => [
      booking.id,
      booking.customerName,
      booking.customerPhone,
      booking.serviceName,
      booking.dateBooked,
      booking.timeSlot,
      booking.price,
      booking.status,
      booking.notes || '',
      format(new Date(booking.createdAt), 'yyyy-MM-dd HH:mm:ss')
    ]);

    // Create TSV format (Tab-separated values) which Excel and Google Sheets can open
    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_${format(new Date(), 'yyyy-MM-dd')}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ 
      title: "Export Successful", 
      description: `${filteredBookings.length} bookings exported to Excel format` 
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadServices(), loadBookings(), loadBookingStatus()]);
      setLoading(false);
    };
    loadData();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      loadBookings();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const deleteService = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.SERVICE_BY_ID(id), {
        method: 'DELETE',
      });

      if (response.ok) {
        setServices(services.filter(s => s.id !== id));
        toast({ title: "Service deleted", description: "Service has been removed" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const response = await fetch(API_ENDPOINTS.BOOKING_STATUS(bookingId), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setBookings(bookings.map(b => 
          b.id === bookingId ? { ...b, status: newStatus } : b
        ));
        toast({ title: "Booking updated", description: `Booking status changed to ${newStatus}` });
      } else {
        throw new Error('Failed to update booking');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update booking", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: Booking['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    const icons = {
      pending: <AlertCircle className="w-3 h-3 mr-1" />,
      confirmed: <CheckCircle2 className="w-3 h-3 mr-1" />,
      completed: <CheckCircle2 className="w-3 h-3 mr-1" />,
      cancelled: <XCircle className="w-3 h-3 mr-1" />,
    };
    return (
      <Badge variant="outline" className={`${styles[status]} flex items-center`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerPhone.includes(searchQuery) ||
      booking.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer bookings from WhatsApp
            </p>
          </div>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Power className={`w-5 h-5 ${bookingsEnabled ? 'text-green-600' : 'text-gray-400'}`} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Bookings System</span>
                <span className="text-xs text-muted-foreground">
                  {bookingsEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <Switch
                checked={bookingsEnabled}
                onCheckedChange={toggleBookings}
              />
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-700">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="pt-4">
              <p className="text-sm text-yellow-700">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-4">
              <p className="text-sm text-purple-700">Confirmed</p>
              <p className="text-2xl font-bold text-purple-900">{stats.confirmed}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4">
              <p className="text-sm text-green-700">Completed</p>
              <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="services">Services Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {/* Filters and Export */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, phone, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={exportToCSV}
                disabled={filteredBookings.length === 0}
                className="w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={exportToExcel}
                disabled={filteredBookings.length === 0}
                className="w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
              {filteredBookings.length === 0 ? (
                <Card className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
                  <p className="text-muted-foreground">
                    Bookings from WhatsApp will appear here
                  </p>
                </Card>
              ) : (
                filteredBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {booking.customerName}
                              </h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {booking.customerPhone}
                              </p>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              {booking.dateBooked}
                            </span>
                            <span className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-4 h-4" />
                              {booking.timeSlot}
                            </span>
                            <Badge variant="secondary">{booking.serviceName}</Badge>
                            <span className="font-semibold text-[#25D366]">
                              TZS {booking.price.toLocaleString()}
                            </span>
                          </div>
                          {booking.notes && (
                            <p className="text-sm text-muted-foreground italic">
                              Note: {booking.notes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Created: {format(new Date(booking.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">
                Configure the services customers can book via WhatsApp
              </p>
              <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                    onClick={() => handleOpenServiceDialog()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                    <DialogDescription>
                      Configure a bookable service for your customers
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="serviceName">Service Name *</Label>
                      <Input
                        id="serviceName"
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                        placeholder="e.g., Consultation"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Select
                          value={serviceForm.duration}
                          onValueChange={(value) => setServiceForm({ ...serviceForm, duration: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 min</SelectItem>
                            <SelectItem value="30">30 min</SelectItem>
                            <SelectItem value="45">45 min</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="servicePrice">Price (TZS) *</Label>
                        <Input
                          id="servicePrice"
                          type="number"
                          value={serviceForm.price}
                          onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                          placeholder="50000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serviceDescription">Description</Label>
                      <Textarea
                        id="serviceDescription"
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                        placeholder="Brief description of the service"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Available Dates</Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={addDate}
                          variant="outline"
                          disabled={!newDate}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                        {serviceForm.availableDates.map((date) => (
                          <Badge
                            key={date}
                            variant="secondary"
                            className="flex items-center gap-1 cursor-pointer hover:bg-red-100"
                            onClick={() => removeDate(date)}
                          >
                            <Calendar className="w-3 h-3" />
                            {format(new Date(date), 'MMM d, yyyy')}
                            <XCircle className="w-3 h-3" />
                          </Badge>
                        ))}
                        {serviceForm.availableDates.length === 0 && (
                          <p className="text-sm text-muted-foreground">Click + to add dates</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Available Time Slots</Label>
                      <p className="text-xs text-muted-foreground mb-2">Select all times when this service can be booked</p>
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                        {availableTimeSlots.map((time) => (
                          <Button
                            key={time}
                            type="button"
                            variant={serviceForm.timeSlots.includes(time) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleTimeSlot(time)}
                            className={serviceForm.timeSlots.includes(time) ? "bg-[#25D366] hover:bg-[#20BD5A]" : ""}
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {time}
                          </Button>
                        ))}
                      </div>
                      {serviceForm.timeSlots.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {serviceForm.timeSlots.length} time slot{serviceForm.timeSlots.length > 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                      onClick={handleSaveService}
                    >
                      {editingService ? 'Update' : 'Add Service'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenServiceDialog(service)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteService(service.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {service.duration} min
                      </Badge>
                      <span className="font-bold text-[#25D366]">
                        TZS {service.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700">Available Dates:</p>
                      <div className="flex flex-wrap gap-1">
                        {service.availableDates && service.availableDates.length > 0 ? (
                          service.availableDates.slice(0, 3).map((date) => (
                            <Badge key={date} variant="secondary" className="text-xs">
                              {format(new Date(date), 'MMM d')}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No dates set</span>
                        )}
                        {service.availableDates && service.availableDates.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{service.availableDates.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700">Time Slots:</p>
                      <div className="flex flex-wrap gap-1">
                        {service.timeSlots && service.timeSlots.length > 0 ? (
                          service.timeSlots.slice(0, 4).map((time) => (
                            <Badge key={time} variant="outline" className="text-xs">
                              {time}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No times set</span>
                        )}
                        {service.timeSlots && service.timeSlots.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{service.timeSlots.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
