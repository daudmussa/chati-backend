import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Plus, Pencil, Trash2, Package, Search, Store as StoreIcon, Save, ShoppingCart, Clock, CheckCircle2, XCircle, ArrowUpDown } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { ImageUpload } from '@/components/ui/image-upload';
import { Switch } from '@/components/ui/switch';

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

interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

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
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('products');
  
  // Category management state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });
  
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
    paymentRequired: false,
  });
  const [editingStoreName, setEditingStoreName] = useState(false);
  const [tempStoreName, setTempStoreName] = useState('');
  const [editingStorePhone, setEditingStorePhone] = useState(false);
  const [tempStorePhone, setTempStorePhone] = useState('');
  const [loadingStore, setLoadingStore] = useState(true);

  // Fetch store settings and products on mount
  useEffect(() => {
    if (user?.id) {
      fetchStoreSettings();
      fetchProducts();
      fetchOrders();
      fetchCategories();
    }
  }, [user?.id]);

  const fetchProducts = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(API_ENDPOINTS.PRODUCTS, {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchOrders = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(API_ENDPOINTS.ORDERS, {
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

  const fetchCategories = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(API_ENDPOINTS.CATEGORIES, {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchStoreSettings = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(API_ENDPOINTS.STORE_SETTINGS, {
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
      const response = await fetch(API_ENDPOINTS.STORE_SETTINGS, {
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

  const togglePaymentRequired = async (required: boolean) => {
    if (!user?.id) return;
    try {
      const response = await fetch(API_ENDPOINTS.STORE_PAYMENT_REQUIRED, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ paymentRequired: required }),
      });

      if (response.ok) {
        setStoreSettings(prev => ({ ...prev, paymentRequired: required }));
        toast({
          title: required ? "Payment Required Enabled" : "Payment Required Disabled",
          description: required ? "Customers must pay online to complete orders" : "Orders no longer require online payment",
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to toggle payment required", variant: "destructive" });
    }
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
      const response = await fetch(API_ENDPOINTS.STORE_SETTINGS, {
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
      const response = await fetch(`${API_ENDPOINTS.ORDERS}/${orderId}`, {
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

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.ORDER_BY_ID(orderId), {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      });

      if (response.ok) {
        setOrders(orders.filter(o => o.id !== orderId));
        toast({
          title: "Order deleted",
          description: "Order has been removed successfully",
        });
      } else {
        throw new Error('Failed to delete order');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete order",
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
    imagePath: '',
    category: '',
    inStock: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      image: '',
      imagePath: '',
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
        imagePath: '',
        category: product.category,
        inStock: product.inStock,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.title || !formData.price || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Double-check limit before saving (in case products were added elsewhere)
    if (!editingProduct && user?.limits) {
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

    const productData: Product = {
      id: editingProduct?.id || '',
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      image: formData.image || 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image',
      category: formData.category,
      inStock: formData.inStock,
    };

    try {
      const endpoint = editingProduct 
        ? API_ENDPOINTS.PRODUCT_BY_ID(editingProduct.id)
        : API_ENDPOINTS.PRODUCTS;
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        const savedProduct = await response.json();
        if (editingProduct) {
          setProducts(products.map(p => p.id === editingProduct.id ? savedProduct : p));
          toast({ title: "Product updated", description: "Product has been updated successfully" });
        } else {
          setProducts([...products, savedProduct]);
          toast({ title: "Product added", description: "New product has been added to your store" });
        }
        setIsDialogOpen(false);
        resetForm();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save product' }));
        if (response.status === 403 && errorData.message) {
          // Handle limit reached error from server
          toast({
            title: "Product Limit Reached",
            description: errorData.message,
            variant: "destructive",
          });
        } else {
          throw new Error(errorData.error || 'Failed to save product');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.PRODUCT_BY_ID(id), {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== id));
        toast({ title: "Product deleted", description: "Product has been removed from your store" });
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  // Category management functions
  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditingCategory(null);
      setCategoryFormData({ name: '', description: '' });
    }
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    try {
      const endpoint = editingCategory 
        ? API_ENDPOINTS.CATEGORY_BY_ID(editingCategory.id)
        : API_ENDPOINTS.CATEGORIES;
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(categoryFormData),
      });

      if (response.ok) {
        const savedCategory = await response.json();
        if (editingCategory) {
          setCategories(categories.map(c => c.id === editingCategory.id ? savedCategory : c));
          toast({ title: "Category updated", description: "Category has been updated successfully" });
        } else {
          setCategories([...categories, savedCategory]);
          toast({ title: "Category added", description: "New category has been added" });
        }
        setIsCategoryDialogOpen(false);
        setCategoryFormData({ name: '', description: '' });
        setEditingCategory(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save category' }));
        throw new Error(errorData.error || 'Failed to save category');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    // Check if any products use this category
    const productsUsingCategory = products.filter(p => {
      const cat = categories.find(c => c.id === id);
      return cat && p.category === cat.name;
    });

    if (productsUsingCategory.length > 0) {
      toast({
        title: "Cannot delete category",
        description: `This category is used by ${productsUsingCategory.length} product(s). Please reassign or delete those products first.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.CATEGORY_BY_ID(id), {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      });

      if (response.ok) {
        setCategories(categories.filter(c => c.id !== id));
        toast({ title: "Category deleted", description: "Category has been removed" });
      } else {
        throw new Error('Failed to delete category');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
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
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-[#25D366] to-[#1DA851] text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <StoreIcon className="w-5 h-5" />
              Store Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Store ID - Read Only */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Store ID</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={loadingStore ? 'Loading...' : storeSettings.storeId}
                  disabled
                  className="bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200"
                />
                <Badge variant="secondary" className="whitespace-nowrap bg-gray-100 text-gray-500 border-0">
                  Read Only
                </Badge>
              </div>
              <p className="text-xs text-gray-400">
                This ID is unique and cannot be changed
              </p>
            </div>

            {/* Store Name - Editable */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Store Name (URL)</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={tempStoreName}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    setTempStoreName(value);
                  }}
                  disabled={!editingStoreName || loadingStore}
                  className={editingStoreName ? 'border-[#25D366] ring-2 ring-green-100' : 'bg-gray-50 border-gray-200'}
                  placeholder="my-store-name"
                />
                {!editingStoreName ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingStoreName(true)}
                    disabled={loadingStore}
                    className="shrink-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSaveStoreName}
                      className="bg-[#25D366] hover:bg-[#20BD5A] text-white shrink-0"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="shrink-0"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Your store will be at: <span className="font-mono text-[#25D366]">/shop/{tempStoreName || 'store-name'}</span>
              </p>
            </div>

            {/* Store Phone - Editable */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">WhatsApp Number</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={tempStorePhone}
                  onChange={(e) => setTempStorePhone(e.target.value)}
                  disabled={!editingStorePhone || loadingStore}
                  className={editingStorePhone ? 'border-blue-400 ring-2 ring-blue-100' : 'bg-gray-50 border-gray-200'}
                  placeholder="+255712345678"
                />
                {!editingStorePhone ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingStorePhone(true)}
                    disabled={loadingStore}
                    className="shrink-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSaveStorePhone}
                      className="bg-[#25D366] hover:bg-[#20BD5A] text-white shrink-0"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelPhoneEdit}
                      className="shrink-0"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Receives customer orders from the cart. Include country code (e.g., +255)
              </p>
            </div>
            </div>

            <hr className="border-gray-100" />

            {/* Payment Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Payment</h3>
              <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${storeSettings.paymentRequired ? 'bg-green-600 text-white border-green-700 shadow-lg shadow-green-200' : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${storeSettings.paymentRequired ? 'bg-white/20' : 'bg-green-50'}`}>
                    <ShoppingCart className={`w-5 h-5 ${storeSettings.paymentRequired ? 'text-white' : 'text-[#25D366]'}`} />
                  </div>
                  <div>
                    <Label className={`font-medium ${storeSettings.paymentRequired ? 'text-white' : 'text-gray-900'}`}>Online Payment Required</Label>
                    <p className={`text-xs mt-0.5 ${storeSettings.paymentRequired ? 'text-green-100' : 'text-gray-500'}`}>
                      {storeSettings.paymentRequired 
                        ? 'Customers must pay online to complete orders' 
                        : 'Orders can be placed without online payment'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={storeSettings.paymentRequired}
                  onCheckedChange={togglePaymentRequired}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-3xl grid-cols-3 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="products" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#25D366]">
              <Package className="w-4 h-4" />
              Products
              {user?.limits && (
                <Badge variant={products.length >= user.limits.maxProducts ? "destructive" : "secondary"} className="ml-1">
                  {products.length}/{user.limits.maxProducts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#25D366]">
              <StoreIcon className="w-4 h-4" />
              Categories ({categories.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#25D366]">
              <ShoppingCart className="w-4 h-4" />
              Orders ({orders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                <p className="text-sm text-gray-500 mt-1">
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
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                        {categories.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No categories yet. Create one in the Categories tab.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Product Image</Label>
                  <ImageUpload
                    value={formData.image}
                    onChange={(url, path) => {
                      setFormData({ ...formData, image: url, imagePath: path });
                    }}
                    folder="products"
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
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
          {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first product to get started'}
            </p>
            {!searchQuery && categoryFilter === 'all' && (
              <Button
                className="bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg shadow-green-200"
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
              <Card key={product.id} className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={product.image || 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image';
                    }}
                  />
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <Badge variant="secondary" className="bg-white/90 text-gray-800 font-medium px-3 py-1">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                  {product.inStock && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleOpenDialog(product)}
                        className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-[#25D366] transition-colors">{product.title}</h3>
                    <Badge variant="secondary" className="text-xs flex-shrink-0 bg-gray-100 text-gray-600 font-normal border-0">
                      {product.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">Price</p>
                      <p className="text-lg font-bold text-[#25D366]">
                        TZS {product.price.toLocaleString()}
                      </p>
                    </div>
                    <Badge className={`${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border-0 font-normal`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </Badge>
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
                <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Track customer orders from your store
                </p>
              </div>
              <Badge className="bg-green-50 text-green-700 border-0 font-medium px-4 py-2">
                {orders.length} Total Orders
              </Badge>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total', value: orders.length, color: 'bg-gray-50 text-gray-700', border: 'border-gray-200' },
                { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: 'bg-yellow-50 text-yellow-700', border: 'border-yellow-200' },
                { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: 'bg-green-50 text-green-700', border: 'border-green-200' },
                { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, color: 'bg-red-50 text-red-700', border: 'border-red-200' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.color} ${stat.border} rounded-xl border p-4 text-center`}>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs font-medium mt-1">{stat.label}</p>
                </div>
              ))}
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
              <Card className="p-12 text-center border-0 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                <p className="text-sm text-gray-500">
                  Orders will appear here when customers checkout from your store
                </p>
              </Card>
            ) : filteredOrders.length === 0 ? (
              <Card className="p-12 text-center border-0 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
                <p className="text-sm text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {paginatedOrders.map((order) => (
                  <Card key={order.id} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-green-600">
                                    {order.customerName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{order.customerName}</h3>
                                  <p className="text-sm text-gray-500">{order.customerPhone}</p>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
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
                                order.status === 'completed' ? 'bg-green-100 text-green-700 border-0 font-normal' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-0 font-normal' :
                                'bg-red-100 text-red-700 border-0 font-normal'
                              }
                            >
                              {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {order.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {order.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Items</p>
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{item.title} × {item.quantity}</span>
                                <span className="font-medium text-gray-900">TZS {(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-4">
                              <p className="text-sm text-gray-500">
                                Items: <span className="font-semibold text-gray-900">{order.totalItems}</span>
                              </p>
                            </div>
                            <p className="text-sm">
                              <span className="text-gray-500">Total: </span>
                              <span className="text-lg font-bold text-[#25D366]">TZS {order.totalAmount.toLocaleString()}</span>
                            </p>
                          </div>
                        </div>

                        {order.status === 'pending' && (
                          <div className="flex flex-row md:flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1.5" />
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              className="border-red-200 text-red-600 hover:bg-red-50 flex-1 md:flex-none"
                            >
                              <XCircle className="w-4 h-4 mr-1.5" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 flex-1 md:flex-none"
                            >
                              <Trash2 className="w-4 h-4 mr-1.5" />
                              Delete
                            </Button>
                          </div>
                        )}
                        {order.status !== 'pending' && (
                          <div className="flex flex-row md:flex-col gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 flex-1 md:flex-none"
                            >
                              <Trash2 className="w-4 h-4 mr-1.5" />
                              Delete
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

          <TabsContent value="categories" className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage product categories for your store
                </p>
              </div>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                    onClick={() => handleOpenCategoryDialog()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                    <DialogDescription>
                      {editingCategory ? 'Update category details' : 'Add a new category to organize your products'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-name">Category Name *</Label>
                      <Input
                        id="category-name"
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                        placeholder="e.g., Electronics, Clothing"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category-description">Description (Optional)</Label>
                      <Textarea
                        id="category-description"
                        value={categoryFormData.description}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                        placeholder="Brief description of this category"
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveCategory}
                      className="bg-[#25D366] hover:bg-[#20BD5A]"
                    >
                      {editingCategory ? 'Update' : 'Add'} Category
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {categories.length === 0 ? (
              <Card className="p-12 border-0 shadow-sm">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <StoreIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories yet</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Create categories to organize your products
                  </p>
                  <Button
                    onClick={() => handleOpenCategoryDialog()}
                    className="bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg shadow-green-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Category
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const productCount = products.filter(p => p.category === category.name).length;
                  return (
                    <Card key={category.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#25D366] to-[#1DA851] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                {category.name.charAt(0).toUpperCase()}
                              </div>
                              <CardTitle className="text-lg text-gray-900">{category.name}</CardTitle>
                            </div>
                            <Badge variant="secondary" className="mt-2 bg-gray-100 text-gray-600 border-0 font-normal">
                              {productCount} {productCount === 1 ? 'product' : 'products'}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenCategoryDialog(category)}
                              className="text-gray-400 hover:text-[#25D366]"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {category.description ? (
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-500">{category.description}</p>
                        </CardContent>
                      ) : (
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-400 italic">No description</p>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
