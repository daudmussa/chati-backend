# Google Analytics & Search Console Setup Guide

## 🎯 Step 1: Google Analytics 4 Setup

### Create GA4 Property
1. Go to https://analytics.google.com/
2. Click "Admin" (bottom left)
3. Click "+ Create Property"
4. Enter Property Details:
   - Property name: "Chati Solutions"
   - Time zone: "Tanzania"
   - Currency: "Tanzanian Shilling (TZS)"
5. Click "Next" and fill business information
6. Click "Create"

### Get Your Measurement ID
1. In Admin > Property column > Data Streams
2. Click "Add stream" > "Web"
3. Enter your website URL: https://chati.solutions
4. Stream name: "Chati Solutions Website"
5. Copy your **Measurement ID** (starts with G-XXXXXXXXXX)

### Add to Your Website
Add this code to your `.env` file:
```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Then add to `index.html` in the `<head>` section:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 🔍 Step 2: Google Search Console Setup

### Add Property
1. Go to https://search.google.com/search-console
2. Click "Add property"
3. Choose "Domain" or "URL prefix"
   - For Domain: Enter `chati.solutions`
   - For URL prefix: Enter `https://chati.solutions`

### Verify Ownership
Choose one method:

#### Method 1: HTML File Upload
1. Download the verification file
2. Upload to `/public` folder
3. Deploy your site
4. Click "Verify" in Search Console

#### Method 2: HTML Tag (Easiest)
1. Copy the meta tag provided
2. Add to `index.html` in `<head>`:
```html
<meta name="google-site-verification" content="YOUR_CODE_HERE" />
```
3. Deploy and click "Verify"

### Submit Sitemap
1. In Search Console, go to "Sitemaps" (left menu)
2. Enter sitemap URL: `https://chati.solutions/sitemap.xml`
3. Click "Submit"

## 📊 Step 3: Key Metrics to Monitor

### Google Analytics
- **Users**: Total visitors
- **Sessions**: Total visits
- **Bounce Rate**: % who leave after one page
- **Session Duration**: Average time on site
- **Conversions**: Sign-ups, contact form submissions
- **Traffic Sources**: Where users come from

### Google Search Console
- **Total Clicks**: Clicks from Google search
- **Total Impressions**: Times shown in search
- **Average CTR**: Click-through rate
- **Average Position**: Ranking position
- **Top Queries**: What people search for
- **Top Pages**: Most visited pages

## 🎯 Step 4: Set Up Goals & Events

### Track Sign-ups (Important!)
Add this code after successful sign-up:
```javascript
gtag('event', 'sign_up', {
  method: 'Website'
});
```

### Track Contact Form Submissions
```javascript
gtag('event', 'generate_lead', {
  value: 1
});
```

### Track Pricing View
```javascript
gtag('event', 'view_item_list', {
  items: [{ item_name: 'Pricing Plans' }]
});
```

## 🚀 Step 5: Monitor & Optimize

### Weekly Checks
- Check Search Console for crawl errors
- Review top performing pages
- Monitor keyword rankings

### Monthly Analysis
- Traffic trends (growing?)
- Which pages get most visits?
- Where do users come from?
- Which keywords bring traffic?
- What's the bounce rate?

### Action Items Based on Data
- Low traffic page? Improve SEO
- High bounce rate? Improve content
- No conversions? Test different CTAs
- Traffic from specific keyword? Create more content

## 📱 Step 6: Additional Tracking (Optional)

### Facebook Pixel
If you run Facebook ads:
1. Create pixel in Facebook Business Manager
2. Add pixel code to index.html

### Microsoft Clarity (Free Heatmaps)
1. Sign up at https://clarity.microsoft.com
2. Add tracking code
3. See how users interact with your site

### Hotjar (User Recordings)
1. Sign up at https://www.hotjar.com
2. Add tracking code
3. Watch user session recordings

## 🔔 Set Up Alerts

### Google Analytics Alerts
1. Go to Admin > View > Custom Alerts
2. Create alert for:
   - Traffic drop > 20%
   - Traffic spike > 50%
   - Zero sessions in a day

### Search Console Email Notifications
1. Settings (gear icon)
2. Enable email notifications for:
   - Search issues
   - Manual actions
   - Security issues

## 📈 Tanzania-Specific Tips

### Track Local Performance
1. In GA4, create custom dimension for location
2. Focus on Tanzania traffic
3. Monitor Dar es Salaam, Arusha, Mwanza cities

### Mobile Analytics
Tanzania has high mobile usage:
1. Check mobile vs desktop traffic
2. Monitor mobile page speed
3. Test on slow connections

### Payment Tracking
Track M-Pesa or local payment methods:
```javascript
gtag('event', 'purchase', {
  currency: 'TZS',
  value: 45000,
  items: [{
    item_name: 'Starter Plan'
  }]
});
```

## 🎓 Resources

### Learn More
- [Google Analytics Academy](https://analytics.google.com/analytics/academy/)
- [Search Console Help](https://support.google.com/webmasters)
- [GA4 Documentation](https://support.google.com/analytics/answer/10089681)

### Tools
- [Google Tag Manager](https://tagmanager.google.com/) - Manage all tracking codes
- [Google Optimize](https://optimize.google.com/) - A/B testing
- [PageSpeed Insights](https://pagespeed.web.dev/) - Performance testing

---

**Questions?**
Contact: duadarts@gmail.com | WhatsApp: +255719958997
