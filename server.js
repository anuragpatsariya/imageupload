require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Environment variables
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Validate environment variables
if (!NOTION_API_KEY) {
  console.error('ERROR: NOTION_API_KEY is not set in environment variables');
  process.exit(1);
}

if (!NOTION_DATABASE_ID) {
  console.error('ERROR: NOTION_DATABASE_ID is not set in environment variables');
  process.exit(1);
}


// Proxy endpoint for file uploads
app.post('/api/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    
    // Step 1: Create a file upload
    console.log('Creating file upload for:', file.originalname, 'size:', file.size);
    const createUploadRes = await fetch('https://api.notion.com/v1/file_uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filename: file.originalname,
        size: file.size,
      }),
    });

    if (!createUploadRes.ok) {
      const error = await createUploadRes.json();
      console.error('Create upload error:', createUploadRes.status, error);
      throw new Error(error.message || 'Failed to create file upload');
    }
    
    const uploadData = await createUploadRes.json();
    const fileUploadId = uploadData.id;
    const uploadUrl = uploadData.upload_url;
    console.log('Upload created, ID:', fileUploadId, 'URL:', uploadUrl);

    // Step 2: Send the file content
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    
    const sendFileRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
      },
      body: formData,
    });
    
    if (!sendFileRes.ok) {
      const errorText = await sendFileRes.text();
      console.error('Upload URL response:', sendFileRes.status, errorText);
      throw new Error(`Failed to upload file content: ${sendFileRes.status} ${errorText}`);
    }

    console.log('File uploaded successfully, ID:', fileUploadId);
    res.json({ fileUploadId });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for creating Notion pages
app.post('/api/create-page', async (req, res) => {
  try {
    const { title, fileUploadId } = req.body;

    if (!title || !fileUploadId) {
      return res.status(400).json({ error: 'Title and fileUploadId are required' });
    }

    // Create the page
    const pageRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          title: [
            {
              type: 'text',
              text: { content: title },
            },
          ],
        },
      }),
    });

    const pageData = await pageRes.json();
    if (!pageRes.ok) {
      throw new Error(pageData.message || 'Failed to create Notion page');
    }
    
    const pageId = pageData.id;

    // Add uploaded file as a child block
    const blockRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        children: [
          {
            object: 'block',
            type: 'image',
            image: {
              type: 'file_upload',
              file_upload: {
                id: fileUploadId,
              },
            },
          },
        ],
      }),
    });

    const blockData = await blockRes.json();
    if (!blockRes.ok) {
      throw new Error(blockData.message || 'Failed to add file to Notion page');
    }

    res.json({ pageId });
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 