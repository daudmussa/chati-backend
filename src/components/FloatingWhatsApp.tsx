import { MessageCircle } from 'lucide-react';

export default function FloatingWhatsApp() {
  const handleClick = () => {
    // WhatsApp Web URL with your number
    const phoneNumber = '255719995897'; // Remove the + for WhatsApp API
    const message = encodeURIComponent('Hi, I would like to know more about your services.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 group hover:animate-none"
      style={{ animation: 'bounce 3s infinite' }}
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
      <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Chat with us
      </span>
    </button>
  );
}
