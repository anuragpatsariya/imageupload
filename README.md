# Notion File Upload Application

This application allows you to upload files to Notion and create pages with those files attached.

## Setup Instructions

### 1. Backend Server Setup

First, install the backend dependencies:

   ```bash
cd image-upload
npm install --save express cors multer node-fetch@2 form-data
```

### 2. Environment Variables

Create a `.env` file in the `image-upload` directory with your Notion credentials:

```
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_notion_database_id_here
```

### 3. Start the Backend Server

```bash
node server.js
```

The server will run on port 3001.

### 4. Start the React Frontend

In a new terminal:

   ```bash
   npm start
   ```

The React app will run on port 3000.

## How to Use

1. Open your browser to `http://localhost:3000`
2. Enter a title for your Notion page
3. Select a file to upload
4. Click "Create Page" to upload the file and create a Notion page

## Troubleshooting

- Make sure both the backend server (port 3001) and frontend (port 3000) are running
- Ensure your Notion API key and database ID are correctly set in the `.env` file
- Check that your Notion API key has the necessary permissions for the database

## API Endpoints

- `POST /api/upload-file` - Uploads a file to Notion
- `POST /api/create-page` - Creates a Notion page with the uploaded file
