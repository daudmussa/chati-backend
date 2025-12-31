import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft,
  MessageSquare,
  Send,
  ShoppingBag
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CartItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  quantity: number;
}

export default function Cart() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [loadingPhone, setLoadingPhone] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      setCart(JSON.parse(saved));
    }
    
    // Fetch store phone from API
    fetchStorePhone();
  }, []);

  const fetchStorePhone = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/store/settings');
      if (response.ok) {
        const data = await response.json();
        setBusinessPhone(data.storePhone || '+255719958997');
      }
    } catch (error) {
      console.error('Failed to fetch store phone:', error);
      setBusinessPhone('+255719958997'); // Fallback
    } finally {
      setLoadingPhone(false);
    }
  };

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
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

  const removeItem = (productId: string) => {
    updateCart(cart.filter(item => item.id !== productId));
    toast({
      title: "Item removed",
      description: "Item has been removed from your cart",
    });
  };

  const clearCart = () => {
    updateCart([]);
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const generateWhatsAppMessage = () => {
    let message = `🛒 *New Order*\n\n`;
    message += `*Customer:* ${customerName}\n`;
    message += `*Phone:* ${customerPhone}\n\n`;
    message += `*Order Details:*\n`;
    message += `─────────────────\n`;
    
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.title}\n`;
      message += `   Qty: ${item.quantity} × TZS ${item.price.toLocaleString()}\n`;
      message += `   Subtotal: TZS ${(item.price * item.quantity).toLocaleString()}\n\n`;
    });
    
    message += `─────────────────\n`;
    message += `*Total Items:* ${cartItemCount}\n`;
    message += `*Total Amount:* TZS ${cartTotal.toLocaleString()}\n\n`;
    message += `Thank you for your order! 🙏`;
    
    return encodeURIComponent(message);
  };

  const generateSmsMessage = () => {
    let message = `New Order\n\n`;
    message += `Customer: ${customerName}\n`;
    message += `Phone: ${customerPhone}\n\n`;
    message += `Order Details:\n`;
    message += `─────────────────\n`;
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.title}\n`;
      message += `   Qty: ${item.quantity} × TZS ${item.price.toLocaleString()}\n`;
      message += `   Subtotal: TZS ${(item.price * item.quantity).toLocaleString()}\n\n`;
    });
    message += `─────────────────\n`;
    message += `Total Items: ${cartItemCount}\n`;
    message += `Total Amount: TZS ${cartTotal.toLocaleString()}\n\n`;
    message += `Thank you for your order!`;
    return message;
  };

  const sendToWhatsApp = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }
    if (!customerPhone.trim()) {
      toast({
        title: "Phone required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart first",
        variant: "destructive",
      });
      return;
    }

    // Save order to backend
    try {
      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: cart.map(item => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: cartTotal,
        totalItems: cartItemCount
      };

      const response = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }
    } catch (error) {
      console.error('Failed to save order:', error);
      // Continue with WhatsApp even if saving fails
    }

    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${businessPhone.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Order sent!",
      description: "Your order has been sent to WhatsApp",
    });
    
    // Clear cart after successful order
    setTimeout(() => {
      clearCart();
    }, 1000);
  };


  if (cart.length === 0) {
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
                <span className="font-bold text-xl">Shopping Cart</span>
              </div>
              <Link to="/shop">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center p-8">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link to="/shop">
              <Button className="bg-[#25D366] hover:bg-[#20BD5A] text-white">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Start Shopping
              </Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

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
              <span className="font-bold text-xl">Shopping Cart</span>
            </div>
            <Link to="/shop">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in cart
              </h2>
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-1" />
                Clear Cart
              </Button>
            </div>

            {cart.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            TZS {item.price.toLocaleString()} × {item.quantity}
                          </p>
                          <p className="font-bold text-[#25D366]">
                            TZS {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.title} × {item.quantity}
                      </span>
                      <span>TZS {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-[#25D366]">TZS {cartTotal.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Your Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="+255 7XX XXX XXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              

              <Button
                className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white py-6 text-lg"
                onClick={sendToWhatsApp}
              >
                <Send className="w-5 h-5 mr-2" />
                Send Order via WhatsApp
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Your order will be sent to our WhatsApp number. We'll confirm your order and arrange delivery.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
