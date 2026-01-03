import { useState } from 'react';
import { ImageUpload } from '../components/ui/image-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function TestUpload() {
  const [productImage, setProductImage] = useState('');
  const [productImagePath, setProductImagePath] = useState('');
  const [userImage, setUserImage] = useState('');
  const [userImagePath, setUserImagePath] = useState('');
  const [serviceImage, setServiceImage] = useState('');
  const [serviceImagePath, setServiceImagePath] = useState('');

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Image Upload Test</h1>
        <p className="text-muted-foreground">
          Test the Bunny.net CDN integration by uploading images to different folders.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Image</CardTitle>
            <CardDescription>Upload a product image (stored in /products folder)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product Image</Label>
              <ImageUpload
                value={productImage}
                onChange={(url, path) => {
                  setProductImage(url);
                  setProductImagePath(path);
                }}
                folder="products"
                className="mt-2"
              />
            </div>
            {productImage && (
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={productImage} readOnly className="font-mono text-xs" />
                <Label>Storage Path</Label>
                <Input value={productImagePath} readOnly className="font-mono text-xs" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Profile Image</CardTitle>
            <CardDescription>Upload a user profile image (stored in /users folder)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Profile Image</Label>
              <ImageUpload
                value={userImage}
                onChange={(url, path) => {
                  setUserImage(url);
                  setUserImagePath(path);
                }}
                folder="users"
                className="mt-2"
              />
            </div>
            {userImage && (
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={userImage} readOnly className="font-mono text-xs" />
                <Label>Storage Path</Label>
                <Input value={userImagePath} readOnly className="font-mono text-xs" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Image</CardTitle>
            <CardDescription>Upload a service image (stored in /services folder)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Service Image</Label>
              <ImageUpload
                value={serviceImage}
                onChange={(url, path) => {
                  setServiceImage(url);
                  setServiceImagePath(path);
                }}
                folder="services"
                className="mt-2"
              />
            </div>
            {serviceImage && (
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={serviceImage} readOnly className="font-mono text-xs" />
                <Label>Storage Path</Label>
                <Input value={serviceImagePath} readOnly className="font-mono text-xs" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Product Image Uploaded:</span>
              <span className={productImage ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                {productImage ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>User Image Uploaded:</span>
              <span className={userImage ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                {userImage ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Service Image Uploaded:</span>
              <span className={serviceImage ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                {serviceImage ? '✓ Yes' : '✗ No'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
