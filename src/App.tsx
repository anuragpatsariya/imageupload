import React, { useState } from 'react';

const App: React.FC = () => {
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setFiles(fileList);
    }
  };

  const uploadFileToServer = async (file: File): Promise<{fileUploadId: string, imageAnalysis: any, generatedTitle: string}> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('http://localhost:3001/api/upload-file', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }
    
    const data = await response.json();
    return { fileUploadId: data.fileUploadId, imageAnalysis: data.imageAnalysis, generatedTitle: data.generatedTitle };
  };

  const uploadMultipleFilesToServer = async (files: File[]): Promise<{fileUploadId: string, imageAnalysis: any, generatedTitle: string}[]> => {
    const results = [];
    for (const file of files) {
      try {
        const result = await uploadFileToServer(file);
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        throw error;
      }
    }
    return results;
  };

  const createPageOnServer = async (title: string, fileUploadId: string, imageAnalysis: any): Promise<string> => {
    const response = await fetch('http://localhost:3001/api/create-page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        fileUploadId,
        imageAnalysis,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create page');
    }
    
    const data = await response.json();
    return data.pageId;
  };

  const createMultiplePagesOnServer = async (title: string, uploadResults: {fileUploadId: string, imageAnalysis: any, generatedTitle: string}[]): Promise<string[]> => {
    const pageIds = [];
    for (let i = 0; i < uploadResults.length; i++) {
      const { fileUploadId, imageAnalysis, generatedTitle } = uploadResults[i];
      // Use generated title if available, otherwise use the user-provided title
      const pageTitle = generatedTitle || (uploadResults.length > 1 ? `${title} - ${i + 1}` : title);
      try {
        const pageId = await createPageOnServer(pageTitle, fileUploadId, imageAnalysis);
        pageIds.push(pageId);
      } catch (error) {
        console.error(`Failed to create page for file ${i + 1}:`, error);
        throw error;
      }
    }
    return pageIds;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (files.length === 0) {
      setMessage('Please select at least one file.');
      return;
    }
    setLoading(true);
    try {
      // 1. Upload multiple files through backend server
      const uploadResults = await uploadMultipleFilesToServer(files);
      // 2. Create Notion pages through backend server
      const pageIds = await createMultiplePagesOnServer(title, uploadResults);
      setMessage(`Success! Created ${pageIds.length} Notion page(s). Page IDs: ${pageIds.join(', ')}`);
      setTitle('');
      setFiles([]);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Create Notion Page with File Upload</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Page Title (Optional - will auto-generate if empty):</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            placeholder="Leave empty for auto-generated titles"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Files:</label>
          <input type="file" multiple onChange={handleFileChange} required />
          {files.length > 0 && (
            <div style={{ marginTop: 8, fontSize: '0.9em', color: '#666' }}>
              Selected {files.length} file(s): {files.map(f => f.name).join(', ')}
            </div>
          )}
        </div>
        <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? 'Processing...' : `Create ${files.length > 1 ? 'Pages' : 'Page'}`}
        </button>
      </form>
      {message && <div style={{ marginTop: 16 }}>{message}</div>}
    </div>
  );
};

export default App;
