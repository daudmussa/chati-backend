import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  MessageSquare,
  Package,
  ChevronLeft,
  ChevronRight,
  Settings,
  Store as StoreIcon,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/config/api';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

const categories = [
  'All',
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
    inStock: true,
  },
  {
    id: '5',
    title: 'Portable Bluetooth Speaker',
    description: 'Waterproof speaker with 12-hour battery life',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80',
    category: 'Electronics',
    inStock: true,
  },
  {
    id: '6',
    title: 'Natural Honey',
    description: 'Pure organic honey from local beekeepers, 1kg jar',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80',
    category: 'Food & Beverages',
    inStock: true,
  },
  {
    id: '7',
    title: 'Leather Wallet',
    description: 'Genuine leather wallet with multiple card slots',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80',
    category: 'Clothing',
    inStock: true,
  },
  {
    id: '8',
    title: 'Aloe Vera Gel',
    description: 'Natural aloe vera gel for skin care, 250ml',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&q=80',
    category: 'Health & Beauty',
    inStock: true,
  },
  {
    id: '9',
    title: 'Indoor Plant Pot',
    description: 'Decorative ceramic pot for indoor plants',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&q=80',
    category: 'Home & Garden',
    inStock: false,
  },
  {
    id: '10',
    title: 'USB-C Charging Cable',
    description: 'Fast charging cable, 2 meters length',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80',
    category: 'Electronics',
    inStock: true,
  },
  {
    id: '11',
    title: 'Green Tea Collection',
    description: 'Assorted green tea flavors, 50 tea bags',
    price: 32000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
    category: 'Food & Beverages',
    inStock: true,
  },
  {
    id: '12',
    title: 'Sunglasses',
    description: 'UV protection polarized sunglasses',
    price: 42000,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80',
    category: 'Clothing',
    inStock: true,
  },
];

const ITEMS_PER_PAGE = 8;

export default function CustomerStore() {
  const { toast } = useToast();
  const { storeName: storeNameParam } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    storeId: '',
    storeName: 'Our Store',
    userId: '',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempStoreName, setTempStoreName] = useState('');
  const [loadingStore, setLoadingStore] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [storeNotFound, setStoreNotFound] = useState(false);
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Fetch store settings and products on mount
  useEffect(() => {
    fetchStoreSettings();
  }, [storeNameParam]);

  const fetchStoreSettings = async () => {
    setLoadingStore(true);
    setStoreNotFound(false);
    
    try {
      let response;
      
      // If storeName param exists, fetch by name, otherwise fetch default
      if (storeNameParam) {
        response = await fetch(API_ENDPOINTS.STORE_BY_NAME(storeNameParam));
      } else {
        response = await fetch(API_ENDPOINTS.STORE_SETTINGS);
      }
      
      if (response.ok) {
        const data = await response.json();
        setStoreSettings(data);
        setTempStoreName(data.storeName);
        
        // Fetch products for this store
        fetchProducts(data.storeName || storeNameParam);
      } else if (response.status === 404) {
        setStoreNotFound(true);
      }
    } catch (error) {
      console.error('Failed to fetch store settings:', error);
    } finally {
      setLoadingStore(false);
    }
  };
  
  const fetchProducts = async (storeName: string) => {
    setLoadingProducts(true);
    try {
      const response = await fetch(API_ENDPOINTS.PRODUCTS_BY_STORE(storeName));
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error('Failed to fetch products');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName: normalizedName }),
      });

      if (response.ok) {
        const data = await response.json();
        setStoreSettings(data);
        setTempStoreName(data.storeName);
        setIsSettingsOpen(false);
        
        // Update URL to reflect new store name
        navigate(`/shop/${data.storeName}`, { replace: true });
        
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

  const copyStoreId = () => {
    navigator.clipboard.writeText(storeSettings.storeId);
    setCopiedId(true);
    toast({
      title: "Copied!",
      description: "Store ID copied to clipboard",
    });
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Save cart to localStorage whenever it changes
  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    // Sort
    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
    }

    return result;
  }, [products, searchQuery, categoryFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  const handleFilterChange = (type: 'search' | 'category' | 'sort', value: string) => {
    setCurrentPage(1);
    if (type === 'search') setSearchQuery(value);
    if (type === 'category') setCategoryFilter(value);
    if (type === 'sort') setSortBy(value);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      updateCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      updateCart([...cart, { ...product, quantity: 1 }]);
    }
    toast({
      title: "Added to cart",
      description: `${product.title} has been added to your cart`,
    });
  };

  const getCartItemQuantity = (productId: string) => {
    const item = cart.find(item => item.id === productId);
    return item?.quantity || 0;
  };

  const updateQuantity = (productId: string, delta: number) => {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      updateCart(cart.filter(item => item.id !== productId));
    } else {
      updateCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#25D366] rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl">
                {loadingStore ? 'Loading...' : storeSettings.storeName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/cart">
                <Button variant="outline" className="relative">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Cart
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-[#25D366] text-white h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Store Not Found */}
        {storeNotFound && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h2>
            <p className="text-gray-600 mb-6">
              The store you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/shop">
              <Button className="bg-[#25D366] hover:bg-[#20BD5A] text-white">
                Browse Available Stores
              </Button>
            </Link>
          </div>
        )}

        {/* Store Content */}
        {!storeNotFound && (
          <>
            {/* Filters */}
            <div className="mb-8 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={(v) => handleFilterChange('category', v)}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => handleFilterChange('sort', v)}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {paginatedProducts.length} of {filteredProducts.length} products
          </p>
        </div>

        {/* Products Grid */}
        {loadingProducts ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          </Card>
        ) : paginatedProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-muted-foreground">
              {products.length === 0 ? 'This store has no products yet' : 'Try adjusting your search or filters'}
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => {
                const cartQuantity = getCartItemQuantity(product.id);
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                      </div>
                      <Badge variant="outline" className="text-xs mb-2">
                        {product.category}
                      </Badge>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-[#25D366]">
                          TZS {product.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="mt-3">
                        {cartQuantity > 0 ? (
                          <div className="flex items-center justify-between bg-gray-100 rounded-lg p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(product.id, -1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-semibold">{cartQuantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(product.id, 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
                            disabled={!product.inStock}
                            onClick={() => addToCart(product)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-[#25D366] hover:bg-[#20BD5A]" : ""}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Floating Cart Summary */}
        {cartItemCount > 0 && (
          <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80">
            <Card className="bg-white shadow-lg border-[#25D366] border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold">{cartItemCount} items in cart</span>
                  <span className="font-bold text-[#25D366]">TZS {cartTotal.toLocaleString()}</span>
                </div>
                <Link to="/cart">
                  <Button className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    View Cart & Checkout
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
          </>
        )}
      </main>

      {/* Store Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Store Settings
            </DialogTitle>
            <DialogDescription>
              View your store ID and update your store name
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Store ID */}
            <div className="space-y-2">
              <Label htmlFor="storeId" className="flex items-center gap-2">
                <StoreIcon className="w-4 h-4" />
                Store ID
              </Label>
              <div className="flex gap-2">
                <Input
                  id="storeId"
                  value={storeSettings.storeId}
                  readOnly
                  className="bg-gray-50 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyStoreId}
                  className="shrink-0"
                >
                  {copiedId ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                This is your permanent store identifier
              </p>
            </div>

            {/* Store Name */}
            <div className="space-y-2">
              <Label htmlFor="storeName" className="flex items-center gap-2">
                <StoreIcon className="w-4 h-4" />
                Store Name (URL)
              </Label>
              <Input
                id="storeName"
                value={tempStoreName}
                onChange={(e) => {
                  // Only allow lowercase letters, numbers, and hyphens
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setTempStoreName(value);
                }}
                placeholder="my-store-name"
              />
              <p className="text-xs text-gray-500">
                Only lowercase letters, numbers, and hyphens (min. 3 characters)
              </p>
            </div>

            {/* Shareable Store Link */}
            {storeSettings.storeName && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Shareable Store Link
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/shop/${storeSettings.storeName}`}
                    readOnly
                    className="bg-gray-50 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const link = `${window.location.origin}/shop/${storeSettings.storeName}`;
                      navigator.clipboard.writeText(link);
                      toast({
                        title: "Copied!",
                        description: "Store link copied to clipboard",
                      });
                    }}
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Share this link with your customers to access your store
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSettingsOpen(false);
                setTempStoreName(storeSettings.storeName);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveStoreName}
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-[#25D366] rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">{storeSettings.storeName}</span>
              </div>
              <p className="text-gray-600 text-sm">
                Shop quality products and get instant support via WhatsApp.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/shop" className="text-gray-600 hover:text-[#25D366]">
                    Find Stores
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="text-gray-600 hover:text-[#25D366]">
                    Shopping Cart
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href={`https://wa.me/${storeSettings.storePhone || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-[#25D366] flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Contact via WhatsApp
                  </a>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-600 hover:text-[#25D366]">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 text-center text-gray-600 text-sm">
            <p>Powered by Chati Solutions</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
