# Notion Image Upload with AI Analysis

This application allows you to upload multiple images to Notion with automatic AI-powered analysis, categorization, and title generation. Each image is automatically categorized and placed in the appropriate Notion database based on its content.

## 🚀 Features

- **Multiple File Upload**: Upload multiple images at once
- **AI-Powered Analysis**: OpenAI analyzes each image for content and type
- **Automatic Title Generation**: AI generates descriptive titles for each image
- **Smart Database Categorization**: Automatically places images in the correct database:
  - 🦅 **Bird Database**: Birds, eagles, hawks, owls, parrots, etc.
  - 🐾 **Animal Database**: Mammals, reptiles, fish, etc.
  - 🏔️ **Landscape Database**: Mountains, forests, beaches, waterfalls, etc.
  - 🏢 **Others Database**: Buildings, cities, objects, etc.
- **Image Resizing**: Automatically resizes large images for optimal upload
- **Real-time Processing**: Shows upload progress and results

## 🛠️ Setup Instructions

### 1. Prerequisites

- Node.js (v14 or higher)
- Notion API key
- OpenAI API key
- Four Notion databases (Animals, Birds, Landscape, Others)

### 2. Installation

```bash
# Clone and navigate to the project
cd image-upload

# Install dependencies
npm install

# Install additional backend dependencies
npm install express cors multer node-fetch@2 form-data dotenv sharp
```

### 3. Environment Configuration

Create a `.env` file in the `image-upload` directory:

```env
# Notion API Configuration
NOTION_API_KEY=your_notion_api_key_here

# Database IDs (get these from your Notion database URLs)
NOTION_ANIMAL_DATABASE_ID=your_animal_database_id_here
NOTION_BIRD_DATABASE_ID=your_bird_database_id_here
NOTION_LANDSCAPE_DATABASE_ID=your_landscape_database_id_here
NOTION_OTHERS_DATABASE_ID=your_others_database_id_here

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Database Setup

Create four databases in Notion:
1. **Animals Database**: For mammals, reptiles, fish, etc.
2. **Birds Database**: For all bird species
3. **Landscape Database**: For nature scenes, mountains, beaches, etc.
4. **Others Database**: For buildings, objects, cities, etc.

Share each database with your Notion integration and copy the database IDs from the URLs.

### 5. Start the Application

```bash
# Terminal 1: Start the backend server
node server.js

# Terminal 2: Start the React frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📖 How to Use

### Single Image Upload
1. Open http://localhost:3000
2. Optionally enter a custom title (or leave empty for AI-generated title)
3. Select an image file
4. Click "Create Page"
5. The image will be:
   - Analyzed by OpenAI
   - Given an AI-generated title (if no custom title provided)
   - Categorized and placed in the appropriate database
   - Added to a new Notion page with analysis

### Multiple Image Upload
1. Open http://localhost:3000
2. Optionally enter a base title
3. Select multiple image files (Ctrl/Cmd + click)
4. Click "Create Pages"
5. Each image will be processed individually:
   - Each gets its own AI-generated title
   - Each is categorized and placed in the correct database
   - Each creates a separate Notion page

## 🔧 API Endpoints

### POST `/api/upload-file`
Uploads a single image and returns analysis data.

**Request:**
- `file`: Image file (multipart/form-data)

**Response:**
```json
{
  "fileUploadId": "notion-file-id",
  "imageAnalysis": {
    "type": "animal",
    "description": "A brown squirrel on a tree branch"
  },
  "generatedTitle": "Brown Squirrel on Tree Branch"
}
```

### POST `/api/create-page`
Creates a Notion page with the uploaded image and analysis.

**Request:**
```json
{
  "title": "Page Title",
  "fileUploadId": "notion-file-id",
  "imageAnalysis": {
    "type": "animal",
    "description": "Description"
  }
}
```

**Response:**
```json
{
  "pageId": "notion-page-id"
}
```

## 🧠 AI Analysis Features

### Image Categorization
The AI analyzes each image and categorizes it into one of four types:
- **Bird**: Any bird species (eagle, hawk, owl, parrot, etc.)
- **Animal**: Mammals, reptiles, fish, etc. (excluding birds)
- **Landscape**: Nature scenes, mountains, forests, beaches, etc.
- **Others**: Buildings, cities, objects, etc.

### Title Generation
AI generates descriptive, specific titles for each image:
- Maximum 60 characters
- Focuses on the most prominent element
- Examples: "Red Cardinal on Snowy Branch", "Golden Retriever in Garden"

### Content Analysis
Each Notion page includes:
- The uploaded image
- AI-generated title
- Image type and description
- Automatic database placement

## 🔄 Processing Flow

1. **File Upload** → Image is resized if too large (>5MB)
2. **Notion Upload** → File is uploaded to Notion's servers
3. **AI Analysis** → OpenAI analyzes image for type and description
4. **Title Generation** → OpenAI generates descriptive title
5. **Database Selection** → System selects appropriate database
6. **Page Creation** → Notion page is created with image and analysis

## 🛡️ Error Handling

- **File Size Limits**: Large images are automatically resized
- **API Failures**: Graceful handling of OpenAI/Notion API errors
- **Missing Analysis**: Falls back to default database if AI analysis fails
- **Network Issues**: Retry logic for failed uploads

## 📝 File Requirements

- **Supported Formats**: JPEG, PNG, GIF, WebP
- **Size Limit**: 5MB (larger files are automatically resized)
- **Multiple Files**: Up to 10 files per upload (browser limit)

## 🔍 Troubleshooting

### Common Issues

1. **"API token is invalid"**
   - Check your Notion API key in `.env`
   - Ensure the integration has access to your databases

2. **"Database ID not found"**
   - Verify all database IDs in `.env`
   - Make sure databases are shared with your integration

3. **"OpenAI API error"**
   - Check your OpenAI API key
   - Ensure you have sufficient API credits

4. **"File too large"**
   - Images are automatically resized, but very large files may still fail
   - Try uploading smaller images

### Debug Mode
Check the server console for detailed logs:
- File upload progress
- AI analysis results
- Database selection
- Page creation status

## 🚀 Future Enhancements

- [ ] Batch processing for large file sets
- [ ] Custom database categories
- [ ] Image editing capabilities
- [ ] Advanced filtering and search
- [ ] Export functionality
- [ ] User authentication

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
