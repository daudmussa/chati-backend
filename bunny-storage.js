/**
 * Bunny.net Storage Service
 * Handles image uploads and retrieval from Bunny CDN
 */

import axios from 'axios';

class BunnyStorage {
  constructor() {
    this.storageZone = process.env.BUNNY_STORAGE_ZONE;
    this.apiKey = process.env.BUNNY_API_KEY;
    this.cdnUrl = process.env.BUNNY_CDN_URL;
    this.storageUrl = `https://storage.bunnycdn.com/${this.storageZone}`;
  }

  /**
   * Upload a file to Bunny Storage
   * @param {Buffer} fileBuffer - The file buffer to upload
   * @param {string} fileName - The name to save the file as
   * @param {string} folder - Optional folder path (e.g., 'products', 'users')
   * @returns {Promise<{url: string, path: string}>}
   */
  async uploadFile(fileBuffer, fileName, folder = '') {
    try {
      // Sanitize filename
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = folder ? `${folder}/${sanitizedFileName}` : sanitizedFileName;
      const uploadUrl = `${this.storageUrl}/${filePath}`;

      const response = await axios.put(uploadUrl, fileBuffer, {
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': 'application/octet-stream'
        }
      });

      if (response.status === 201) {
        return {
          success: true,
          url: `${this.cdnUrl}/${filePath}`,
          path: filePath
        };
      }

      throw new Error('Upload failed');
    } catch (error) {
      console.error('[Bunny Storage] Upload error:', error.message);
      throw error;
    }
  }

  /**
   * Delete a file from Bunny Storage
   * @param {string} filePath - The path of the file to delete
   * @returns {Promise<boolean>}
   */
  async deleteFile(filePath) {
    try {
      const deleteUrl = `${this.storageUrl}/${filePath}`;
      
      const response = await axios.delete(deleteUrl, {
        headers: {
          'AccessKey': this.apiKey
        }
      });

      return response.status === 200;
    } catch (error) {
      console.error('[Bunny Storage] Delete error:', error.message);
      throw error;
    }
  }

  /**
   * List files in a directory
   * @param {string} path - Directory path to list
   * @returns {Promise<Array>}
   */
  async listFiles(path = '') {
    try {
      const listUrl = `${this.storageUrl}/${path}/`;
      
      const response = await axios.get(listUrl, {
        headers: {
          'AccessKey': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('[Bunny Storage] List error:', error.message);
      throw error;
    }
  }

  /**
   * Get the CDN URL for a file
   * @param {string} filePath - The file path
   * @returns {string}
   */
  getCdnUrl(filePath) {
    return `${this.cdnUrl}/${filePath}`;
  }
}

export default new BunnyStorage();
