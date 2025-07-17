require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const sharp = require('sharp');
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
const NOTION_ANIMAL_DATABASE_ID = process.env.NOTION_ANIMAL_DATABASE_ID;
const NOTION_BIRD_DATABASE_ID = process.env.NOTION_BIRD_DATABASE_ID;
const NOTION_LANDSCAPE_DATABASE_ID = process.env.NOTION_LANDSCAPE_DATABASE_ID;
const NOTION_OTHERS_DATABASE_ID = process.env.NOTION_OTHERS_DATABASE_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Validate environment variables
if (!NOTION_API_KEY) {
  console.error('ERROR: NOTION_API_KEY is not set in environment variables');
  process.exit(1);
}

if (!NOTION_ANIMAL_DATABASE_ID) {
  console.error('ERROR: NOTION_ANIMAL_DATABASE_ID is not set in environment variables');
  process.exit(1);
}

if (!NOTION_BIRD_DATABASE_ID) {
  console.error('ERROR: NOTION_BIRD_DATABASE_ID is not set in environment variables');
  process.exit(1);
}

if (!NOTION_LANDSCAPE_DATABASE_ID) {
  console.error('ERROR: NOTION_LANDSCAPE_DATABASE_ID is not set in environment variables');
  process.exit(1);
}

if (!NOTION_OTHERS_DATABASE_ID) {
  console.error('ERROR: NOTION_OTHERS_DATABASE_ID is not set in environment variables');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('WARNING: OPENAI_API_KEY is not set. Image analysis will be skipped.');
}

// Function to select database based on image analysis
function selectDatabase(imageAnalysis) {
  if (!imageAnalysis) {
    return NOTION_OTHERS_DATABASE_ID; // Default to others database
  }
  
  const type = imageAnalysis.type.toLowerCase();
  
  // Check for bird-related keywords
  if (type.includes('bird') || type.includes('avian') || type.includes('fowl') || 
      type.includes('eagle') || type.includes('hawk') || type.includes('owl') ||
      type.includes('parrot') || type.includes('penguin') || type.includes('duck') ||
      type.includes('chicken') || type.includes('turkey') || type.includes('goose') ||
      type.includes('sparrow') || type.includes('crow') || type.includes('raven') ||
      type.includes('finch') || type.includes('cardinal') || type.includes('bluejay')) {
    console.log('Selected BIRD database based on analysis:', type);
    return NOTION_BIRD_DATABASE_ID;
  }
  
  // Check for landscape-related keywords
  if (type.includes('landscape') || type.includes('mountain') || type.includes('forest') ||
      type.includes('beach') || type.includes('ocean') || type.includes('lake') ||
      type.includes('river') || type.includes('waterfall') || type.includes('desert') ||
      type.includes('valley') || type.includes('canyon') || type.includes('meadow') ||
      type.includes('field') || type.includes('hill') || type.includes('cliff') ||
      type.includes('sunset') || type.includes('sunrise') || type.includes('sky')) {
    console.log('Selected LANDSCAPE database based on analysis:', type);
    return NOTION_LANDSCAPE_DATABASE_ID;
  }
  
  // Check for animal-related keywords (excluding birds)
  if (type.includes('animal') || type.includes('mammal') || type.includes('dog') ||
      type.includes('cat') || type.includes('horse') || type.includes('cow') ||
      type.includes('elephant') || type.includes('lion') || type.includes('tiger') ||
      type.includes('bear') || type.includes('wolf') || type.includes('fox') ||
      type.includes('deer') || type.includes('rabbit') || type.includes('squirrel') ||
      type.includes('monkey') || type.includes('gorilla') || type.includes('zebra') ||
      type.includes('giraffe') || type.includes('rhino') || type.includes('hippo') ||
      type.includes('penguin') || type.includes('dolphin') || type.includes('whale') ||
      type.includes('shark') || type.includes('fish') || type.includes('snake') ||
      type.includes('lizard') || type.includes('frog') || type.includes('turtle')) {
    console.log('Selected ANIMAL database based on analysis:', type);
    return NOTION_ANIMAL_DATABASE_ID;
  }
  
  // Default to others database for everything else
  console.log('Selected OTHERS database based on analysis:', type);
  return NOTION_OTHERS_DATABASE_ID;
}

// Function to analyze image using OpenAI Vision API
async function analyzeImage(imageBuffer) {
  if (!OPENAI_API_KEY) {
    return null;
  }

  try {
    // Resize image to reduce size for API
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Convert to base64
    const base64Image = resizedImageBuffer.toString('base64');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                //text: 'Analyze this image and categorize it into one of these types: 1. "bird" (for any bird species), 2. "animal" (for mammals, reptiles, fish, etc.), 3. "landscape" (for mountains, forests, beaches, waterfalls, etc.), 4. "others" (for buildings, cities, objects, etc.).Then provide a brief description. Format your response as: Type: [type] Description: [description]'
                text: 'Take a thoughtful look at this image and decide which of the following categories it fits best: Bird – if a bird (of any kind) is the main focus, Animal – if it shows a mammal, reptile, fish, or other creature (not a bird), Landscape – if it features natural scenery like mountains, forests, beaches, or waterfalls, Others – for anything else: buildings, objects, cities, people, abstract scenes, etc. Then, write a brief but vivid description of what’s going on in the image. If it feels natural, add a touch of artistic expression or light humor — but only when it fits the mood of the image. Don’t force it. Format your response like this:Type: [category] Description: [friendly and colorful description — with a dash of wit or artistry if appropriate]'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return null;
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    // Parse the response
    const typeMatch = analysis.match(/Type:\s*(.+?)(?:\n|$)/i);
    const descMatch = analysis.match(/Description:\s*(.+?)(?:\n|$)/i);
    
    return {
      type: typeMatch ? typeMatch[1].trim() : 'Unknown',
      description: descMatch ? descMatch[1].trim() : analysis
    };
  } catch (error) {
    console.error('Image analysis error:', error);
    return null;
  }
}

// Function to generate page title using OpenAI Vision API
async function generatePageTitle(imageBuffer) {
  if (!OPENAI_API_KEY) {
    return null;
  }

  try {
    // Resize image to reduce size for API
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Convert to base64
    const base64Image = resizedImageBuffer.toString('base64');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Generate a specific, descriptive title for this image. The title should be concise (max 60 characters) but descriptive enough to identify the main subject. Focus on the most prominent element in the image. Examples: "Red Cardinal on Snowy Branch", "Golden Retriever in Garden", "Mountain Lake at Sunset". Return only the title, no additional text.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI title generation error:', error);
      return null;
    }

    const data = await response.json();
    const title = data.choices[0].message.content.trim();
    
    return title;
  } catch (error) {
    console.error('Title generation error:', error);
    return null;
  }
}

// Proxy endpoint for file uploads
app.post('/api/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    
    // Resize image if it's too large (Notion has file size limits)
    let processedBuffer = file.buffer;
    let processedSize = file.size;
    let processedMimetype = file.mimetype;
    
    if (file.mimetype.startsWith('image/') && file.size > 5 * 1024 * 1024) { // 5MB limit
      console.log('Resizing large image from', file.size, 'bytes');
      try {
        processedBuffer = await sharp(file.buffer)
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        processedSize = processedBuffer.length;
        processedMimetype = 'image/jpeg';
        console.log('Resized image to', processedSize, 'bytes');
      } catch (error) {
        console.error('Error resizing image:', error);
        // Continue with original file if resizing fails
      }
    }
    
    // Step 1: Create a file upload
    console.log('Creating file upload for:', file.originalname, 'size:', processedSize);
    const createUploadRes = await fetch('https://api.notion.com/v1/file_uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filename: file.originalname,
        size: processedSize,
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
    formData.append('file', processedBuffer, {
      filename: file.originalname,
      contentType: processedMimetype,
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
    
    // Analyze image if it's an image file
    let imageAnalysis = null;
    let generatedTitle = null;
    if (file.mimetype.startsWith('image/')) {
      console.log('Analyzing image with OpenAI...');
      imageAnalysis = await analyzeImage(processedBuffer);
      if (imageAnalysis) {
        console.log('Image analysis result:', imageAnalysis);
      }
      
      console.log('Generating page title with OpenAI...');
      generatedTitle = await generatePageTitle(processedBuffer);
      if (generatedTitle) {
        console.log('Generated title:', generatedTitle);
      }
    }
    
    res.json({ fileUploadId, imageAnalysis, generatedTitle });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for creating Notion pages
app.post('/api/create-page', async (req, res) => {
  try {
    const { title, fileUploadId, imageAnalysis } = req.body;

    if (!title || !fileUploadId) {
      return res.status(400).json({ error: 'Title and fileUploadId are required' });
    }

    // Select database based on image analysis
    const selectedDatabaseId = selectDatabase(imageAnalysis);
    
    // Create the page
    const pageRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: selectedDatabaseId },
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

    // Prepare blocks to add
    const blocks = [
      {
        object: 'block',
        type: 'image',
        image: {
          type: 'file_upload',
          file_upload: {
            id: fileUploadId,
          },
        },
      }
    ];

    // Add image analysis if available
    if (imageAnalysis) {
      blocks.push(
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: `${imageAnalysis.type}`
                }
              }
            ]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: imageAnalysis.description
                }
              }
            ]
          }
        }
      );
    }

    // Add blocks to the page
    const blockRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        children: blocks,
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