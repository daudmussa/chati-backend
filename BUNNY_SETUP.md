# Bunny.net Storage Setup Guide

## Step 1: Create a Bunny.net Account

1. Go to [https://dash.bunny.net/auth/register](https://dash.bunny.net/auth/register)
2. Sign up for a free account (no credit card required)
3. Verify your email address

## Step 2: Create a Storage Zone

1. Log in to your Bunny.net dashboard
2. Click on **"Storage"** in the left sidebar
3. Click **"Add Storage Zone"**
4. Configure your storage zone:
   - **Name**: Choose a unique name (e.g., `chati-images`)
   - **Region**: Select the region closest to your users (e.g., `New York`, `London`, `Singapore`)
   - **Storage Type**: 
     - Choose **Standard (HDD)** for $0.01/GB (recommended for most use cases)
     - Choose **Edge (SSD)** for $0.02/GB (if you need faster speeds)
   - **Replication**: Enable if you want global replication (optional, costs extra)
5. Click **"Add Storage Zone"**

## Step 3: Get Your API Key

1. In the Bunny.net dashboard, click on your **Storage Zone**
2. Go to the **"FTP & API Access"** tab
3. Copy your **Storage Zone Name** and **Password (API Key)**

## Step 4: Configure Environment Variables

### For Local Development (.env):

```bash
# Bunny.net Storage Configuration
BUNNY_STORAGE_ZONE=your_storage_zone_name
BUNNY_API_KEY=your_bunny_api_key_here
BUNNY_CDN_URL=https://your-storage-zone.b-cdn.net
```

### For Railway (Production):

1. Go to your Railway project
2. Click on **"Variables"**
3. Add the following variables:
   - `BUNNY_STORAGE_ZONE`: Your storage zone name
   - `BUNNY_API_KEY`: Your API key/password
   - `BUNNY_CDN_URL`: Your CDN URL (format: `https://[zone-name].b-cdn.net`)

## Step 5: Get Your CDN URL

Your CDN URL follows this format:
```
https://[your-storage-zone-name].b-cdn.net
```

For example, if your storage zone is named `chati-images`, your CDN URL is:
```
https://chati-images.b-cdn.net
```

## Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   npm run server
   ```

2. Try uploading an image through your application

3. Check the Bunny.net dashboard to see your uploaded files

## Usage in Your Application

### Import the ImageUpload component:

```tsx
import { ImageUpload } from '@/components/ui/image-upload';

function MyComponent() {
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState('');

  return (
    <ImageUpload
      value={imageUrl}
      onChange={(url, path) => {
        setImageUrl(url);
        setImagePath(path);
      }}
      folder="products" // Optional: organize by folder
    />
  );
}
```

### Available folders:
- `products` - Product images
- `users` - User profile images
- `services` - Service images
- `general` - General uploads

## Pricing

**Storage Costs:**
- Standard (HDD): $0.01/GB per month
- Edge (SSD): $0.02/GB per month

**Additional features:**
- ✅ No API request fees
- ✅ No egress fees for API access
- ✅ Free CDN delivery
- ✅ $1 minimum monthly charge
- ✅ 14-day free trial

**Example:**
- 20GB storage across 3 regions = $0.50/month
- 100GB storage = $1.00/month (Standard) or $2.00/month (Edge)

## Troubleshooting

### Upload fails with 401 error:
- Check that your `BUNNY_API_KEY` is correct
- Verify the API key matches the storage zone

### Image doesn't display:
- Verify your `BUNNY_CDN_URL` is correct
- Check if the storage zone is active
- Try accessing the image URL directly in your browser

### CORS errors:
- Bunny CDN automatically handles CORS for public files
- No additional configuration needed

## Security Notes

- ✅ API keys are stored server-side only
- ✅ File uploads require authentication
- ✅ Images are uploaded with unique names to prevent conflicts
- ✅ 5MB file size limit enforced
- ✅ Only image files are allowed

## Next Steps

1. ✅ Set up your Bunny.net account
2. ✅ Configure environment variables
3. ✅ Test image upload in your application
4. ✅ Use the `ImageUpload` component in your forms
5. 🔄 Deploy to production (Railway will use production env vars)

Need help? Contact Bunny.net support: [https://support.bunny.net](https://support.bunny.net)
