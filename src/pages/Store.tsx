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
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Plus, Pencil, Trash2, Package, Search, Store as StoreIcon, Save, ShoppingCart, Clock, CheckCircle2, XCircle, ArrowUpDown } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: {
    title: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  totalItems: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

const categories = [
  'Electronics',
  'Clothing',
  'Food & Beverages',
  'Home & Garden',
  'Health & Beauty',
  'Services',
  'Other',
];

const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 85000,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    category: 'Electronics',
    inStock: true,
  },
  {
    id: '2',
    title: 'Smart Watch Pro',
    description: 'Fitness tracker with heart rate monitor and GPS',
    price: 150000,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    category: 'Electronics',
    inStock: true,
  },
  {
    id: '3',
    title: 'Organic Coffee Beans',
    description: 'Premium Tanzanian coffee beans, 500g pack',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80',
    category: 'Food & Beverages',
    inStock: true,
  },
  {
    id: '4',
    title: 'Cotton T-Shirt',
    description: 'Comfortable 100% cotton t-shirt, various colors',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
    category: 'Clothing',
    inStock: false,
  },
];

export default function Store() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('products');
  
  // Orders filters
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [orderDateFilter, setOrderDateFilter] = useState('');

  // Pagination state
  const [productsPage, setProductsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const itemsPerPage = 12;

  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    storeId: '',
    storeName: '',
    storePhone: '',
  });
  const [editingStoreName, setEditingStoreName] = useState(false);
  const [tempStoreName, setTempStoreName] = useState('');
  const [editingStorePhone, setEditingStorePhone] = useState(false);
  const [tempStorePhone, setTempStorePhone] = useState('');
  const [loadingStore, setLoadingStore] = useState(true);

  // Fetch store settings on mount
  useEffect(() => {
    if (user?.id) {
      fetchStoreSettings();
      fetchOrders();
    }
  }, [user?.id]);

  const fetchOrders = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch('http://localhost:3000/api/orders', {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchStoreSettings = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch('http://localhost:3000/api/store/settings', {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStoreSettings(data);
        setTempStoreName(data.storeName);
        setTempStorePhone(data.storePhone || '');
      }
    } catch (error) {
      console.error('Failed to fetch store settings:', error);
    } finally {
      setLoadingStore(false);
    }
  };

  const handleSaveStoreName = async () => {
    if (!tempStoreName.trim()) {
      toast({
        title: "Error",
        description: "Store name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Validate URL-friendly format (lowercase letters, numbers, hyphens only)
    const urlFriendlyRegex = /^[a-z0-9-]+$/;
    const normalizedName = tempStoreName.trim().toLowerCase();
    
    if (!urlFriendlyRegex.test(normalizedName)) {
      toast({
        title: "Invalid Store Name",
        description: "Store name can only contain lowercase letters, numbers, and hyphens (no spaces or special characters)",
        variant: "destructive",
      });
      return;
    }

    if (normalizedName.length < 3) {
      toast({
        title: "Invalid Store Name",
        description: "Store name must be at least 3 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/store/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ storeName: normalizedName }),
      });

      if (response.ok) {
        const data = await response.json();
        setStoreSettings(data);
        setTempStoreName(data.storeName);
        setEditingStoreName(false);
        toast({
          title: "Success",
          description: "Store name updated successfully",
        });
      } else {
        throw new Error('Failed to update store name');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update store name",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setTempStoreName(storeSettings.storeName);
    setEditingStoreName(false);
  };

  const handleSaveStorePhone = async () => {
    if (!tempStorePhone.trim()) {
      toast({
        title: "Error",
        description: "Store phone cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Basic phone validation (should start with + and contain only digits and spaces)
    const phoneRegex = /^\+?[0-9\s-]+$/;
    if (!phoneRegex.test(tempStorePhone.trim())) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with country code (e.g., +255123456789)",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/store/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ 
          storeName: storeSettings.storeName,
          storePhone: tempStorePhone.trim() 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStoreSettings(data);
        setTempStorePhone(data.storePhone);
        setEditingStorePhone(false);
        toast({
          title: "Success",
          description: "Store phone updated successfully",
        });
      } else {
        throw new Error('Failed to update store phone');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update store phone",
        variant: "destructive",
      });
    }
  };

  const handleCancelPhoneEdit = () => {
    setTempStorePhone(storeSettings.storePhone);
    setEditingStorePhone(false);
  };

  const updateOrderStatus = async (orderId: string, status: 'completed' | 'cancelled') => {
    try {
      const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status } : order
        ));
        toast({
          title: "Order updated",
          description: `Order has been marked as ${status}`,
        });
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    image: '',
    category: '',
    inStock: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      image: '',
      category: '',
      inStock: true,
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: Product) => {
    // Check if user has reached product limit when adding new
    if (!product && user?.limits) {
      const currentProductCount = products.length;
      if (currentProductCount >= user.limits.maxProducts) {
        toast({
          title: "Product Limit Reached",
          description: `You have reached your maximum limit of ${user.limits.maxProducts} products. Please contact admin to increase your limit.`,
          variant: "destructive",
        });
        return;
      }
    }

    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        description: product.description,
        price: product.price.toString(),
        image: product.image,
        category: product.category,
        inStock: product.inStock,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!formData.title || !formData.price || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const productData: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      image: formData.image || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&q=80',
      category: formData.category,
      inStock: formData.inStock,
    };

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? productData : p));
      toast({ title: "Product updated", description: "Product has been updated successfully" });
    } else {
      setProducts([...products, productData]);
      toast({ title: "Product added", description: "New product has been added to your store" });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast({ title: "Product deleted", description: "Product has been removed from your store" });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order.customerPhone.includes(orderSearchQuery) ||
        order.items.some(item => item.title.toLowerCase().includes(orderSearchQuery.toLowerCase()));
      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      
      // Filter by date if selected
      let matchesDate = true;
      if (orderDateFilter) {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        matchesDate = orderDate === orderDateFilter;
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Always newest first

  // Pagination logic
  const totalProductsPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const totalOrdersPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginatedProducts = filteredProducts.slice(
    (productsPage - 1) * itemsPerPage,
    productsPage * itemsPerPage
  );

  const paginatedOrders = filteredOrders.slice(
    (ordersPage - 1) * itemsPerPage,
    ordersPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setProductsPage(1);
  }, [searchQuery, categoryFilter]);

  useEffect(() => {
    setOrdersPage(1);
  }, [orderSearchQuery, orderStatusFilter, orderDateFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Store Settings Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <StoreIcon className="w-5 h-5" />
              Store Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Store ID - Read Only */}
              <div className="space-y-2">
                <Label className="text-blue-900">Store ID</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={loadingStore ? 'Loading...' : storeSettings.storeId}
                    disabled
                    className="bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                  <Badge variant="secondary" className="whitespace-nowrap">
                    Read Only
                  </Badge>
                </div>
                <p className="text-xs text-blue-700">
                  This ID is unique and cannot be changed
                </p>
              </div>

              {/* Store Name - Editable */}
              <div className="space-y-2">
                <Label className="text-blue-900">Store Name (URL)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={tempStoreName}
                    onChange={(e) => {
                      // Only allow lowercase letters, numbers, and hyphens
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setTempStoreName(value);
                    }}
                    disabled={!editingStoreName || loadingStore}
                    className={editingStoreName ? '' : 'bg-gray-50'}
                    placeholder="my-store-name"
                  />
                  {!editingStoreName ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingStoreName(true)}
                      disabled={loadingStore}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSaveStoreName}
                        className="bg-[#25D366] hover:bg-[#20BD5A]"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-xs text-blue-700">
                  Only lowercase letters, numbers, and hyphens allowed. Your store will be at: /shop/{tempStoreName || 'store-name'}
                </p>
              </div>

              {/* Store Phone - Editable */}
              <div className="space-y-2 md:col-span-2">
                <Label className="text-blue-900">Store WhatsApp Number</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={tempStorePhone}
                    onChange={(e) => setTempStorePhone(e.target.value)}
                    disabled={!editingStorePhone || loadingStore}
                    className={editingStorePhone ? '' : 'bg-gray-50'}
                    placeholder="+255712345678"
                  />
                  {!editingStorePhone ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingStorePhone(true)}
                      disabled={loadingStore}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSaveStorePhone}
                        className="bg-[#25D366] hover:bg-[#20BD5A]"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelPhoneEdit}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-xs text-blue-700">
                  This number will receive customer orders from the cart. Include country code (e.g., +255 for Tanzania)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products
              {user?.limits && (
                <Badge variant={products.length >= user.limits.maxProducts ? "destructive" : "secondary"} className="ml-2">
                  {products.length}/{user.limits.maxProducts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Orders ({orders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your products for WhatsApp customers
                </p>
              </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? 'Update product details' : 'Add a new product to your store'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Wireless Headphones"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Short Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the product"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (TZS) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="inStock">In Stock</Label>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                  onClick={handleSaveProduct}
                >
                  {editingProduct ? 'Update' : 'Add Product'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first product to get started'}
            </p>
            {!searchQuery && categoryFilter === 'all' && (
              <Button
                className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="secondary" className="bg-white text-gray-900">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{product.title}</h3>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {product.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-[#25D366]">
                      TZS {product.price.toLocaleString()}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(product)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>

            {totalProductsPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setProductsPage(p => Math.max(1, p - 1))}
                      className={productsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalProductsPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setProductsPage(page)}
                        isActive={productsPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setProductsPage(p => Math.min(totalProductsPages, p + 1))}
                      className={productsPage === totalProductsPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                <p className="text-muted-foreground mt-1">
                  Track customer orders from your store
                </p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {orders.length} Total Orders
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by customer name, phone, or items..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={orderStatusFilter} onValueChange={(value: any) => setOrderStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={orderDateFilter}
                onChange={(e) => setOrderDateFilter(e.target.value)}
                className="w-full sm:w-[180px]"
                placeholder="Filter by date"
              />
            </div>

            {orders.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                <p className="text-muted-foreground">
                  Orders will appear here when customers checkout from your store
                </p>
              </Card>
            ) : filteredOrders.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {paginatedOrders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{order.customerName}</h3>
                              <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(order.createdAt).toLocaleString('en-US', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </p>
                            </div>
                            <Badge 
                              variant={
                                order.status === 'completed' ? 'default' : 
                                order.status === 'cancelled' ? 'destructive' : 
                                'secondary'
                              }
                              className={
                                order.status === 'completed' ? 'bg-green-600' :
                                order.status === 'pending' ? 'bg-yellow-600' : ''
                              }
                            >
                              {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {order.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {order.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-medium">Order Items:</p>
                            {order.items.map((item, idx) => (
                              <p key={idx} className="text-sm text-muted-foreground">
                                • {item.title} × {item.quantity} - TZS {(item.price * item.quantity).toLocaleString()}
                              </p>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 pt-2 border-t">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Total Items:</span>{' '}
                              <span className="font-semibold">{order.totalItems}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Total Amount:</span>{' '}
                              <span className="font-bold text-[#25D366]">TZS {order.totalAmount.toLocaleString()}</span>
                            </p>
                          </div>
                        </div>

                        {order.status === 'pending' && (
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredOrders.length > 0 && totalOrdersPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                      className={ordersPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalOrdersPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setOrdersPage(page)}
                        isActive={ordersPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setOrdersPage(p => Math.min(totalOrdersPages, p + 1))}
                      className={ordersPage === totalOrdersPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
