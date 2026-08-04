import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { useToast } from '@/components/ui/use-toast';

interface PaymentItem {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  isActive: boolean;
}

export default function CustomerPaymentItems() {
  const { storeName } = useParams<{ storeName: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    fetchItems();
  }, [storeName]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      // First get the store to find the user ID
      const storeRes = await fetch(API_ENDPOINTS.STORE_BY_NAME(storeName!), {
        headers: { 'x-user-id': '' }
      });
      
      if (!storeRes.ok) {
        throw new Error('Store not found');
      }
      
      const storeData = await storeRes.json();
      setBusinessName(storeData.store?.storeName || 'Business');
      
      // Get payment items for this store
      const userId = storeData.store?.userId;
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      const itemsRes = await fetch(`${API_ENDPOINTS.PAYMENT_ITEMS}?userId=${userId}`, {
        headers: { 'x-user-id': userId }
      });
      
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items?.filter((item: PaymentItem) => item.isActive) || []);
      }
    } catch (error) {
      console.error('Error fetching payment items:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load payment items', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayment = async (item: PaymentItem) => {
    setRequesting(item.id);
    try {
      // Get customer details (in a real scenario, you'd have a form or be logged in)
      const customerName = prompt('Please enter your name:');
      if (!customerName) {
        setRequesting(null);
        return;
      }
      
      const customerPhone = prompt('Please enter your phone number (with country code, e.g., +255...):');
      if (!customerPhone) {
        setRequesting(null);
        return;
      }
      
      const customerEmail = prompt('Please enter your email (optional):') || '';
      
      // Get the store owner's user ID
      const storeRes = await fetch(API_ENDPOINTS.STORE_BY_NAME(storeName!), {
        headers: { 'x-user-id': '' }
      });
      const storeData = await storeRes.json();
      const userId = storeData.store?.userId;
      
      // Create payment
      const res = await fetch(API_ENDPOINTS.PAYMENT_ITEM_PAY(item.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          paymentType: 'mobile',
          customerPhone,
          customerEmail,
          customerName,
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast({ 
          title: 'Payment Request Created', 
          description: data.message || 'Check your phone for payment instructions.', 
        });
        
        // Open payment URL if available
        if (data.paymentUrl) {
          window.open(data.paymentUrl, '_blank');
        }
      } else {
        toast({ 
          title: 'Error', 
          description: data.error || 'Failed to create payment', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error requesting payment:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to process payment request', 
        variant: 'destructive' 
      });
    } finally {
      setRequesting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#25D366] text-white py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="text-white mb-4"
            onClick={() => navigate(`/shop/${storeName}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Store
          </Button>
          <h1 className="text-3xl font-bold">{businessName} - Payment Items</h1>
          <p className="text-white/90 mt-2">
            Select a payment item to pay for
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No payment items available
              </h3>
              <p className="text-muted-foreground text-center">
                There are currently no active payment items
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-[#25D366]" />
                      <span className="text-2xl font-bold text-gray-900">
                        {item.currency} {item.amount.toLocaleString()}
                      </span>
                    </div>
                    <Button
                      className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
                      onClick={() => handleRequestPayment(item)}
                      disabled={requesting === item.id}
                    >
                      {requesting === item.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Pay Now
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
