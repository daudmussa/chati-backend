import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  structuredData?: object;
}

export default function SEO({
  title = "Chati Solutions - AI-Powered WhatsApp Business Automation for Tanzania",
  description = "Automate WhatsApp customer service 24/7 with AI, manage your online store, and accept bookings. Perfect for Tanzanian businesses. Start from TZS 45,000/month.",
  keywords = "WhatsApp automation Tanzania, WhatsApp business AI, automated customer service Tanzania, WhatsApp chatbot Tanzania, online store Tanzania, booking system Tanzania, business automation Tanzania, AI customer support, WhatsApp API Tanzania, Chati Solutions",
  ogImage = "https://chati.solutions/og-image.png",
  canonical,
  structuredData,
}: SEOProps) {
  const currentUrl = canonical || window.location.href;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
