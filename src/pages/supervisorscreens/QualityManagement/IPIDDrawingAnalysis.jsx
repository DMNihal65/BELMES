import React, { useState } from 'react';

const IPIDDrawingAnalysis = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      setPdfUrl(null);
      setFileName('');
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size should not exceed 10MB');
      setPdfUrl(null);
      setFileName('');
      return;
    }

    // Clear any previous errors
    setError(null);
    setFileName(file.name);

    // Create URL for the PDF
    const fileUrl = URL.createObjectURL(file);
    setPdfUrl(fileUrl);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      // Trigger the same file handling logic
      const input = document.createElement('input');
      input.files = e.dataTransfer.files;
      handleFileChange({ target: input });
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">IPID Drawing Analysis</h2>
        
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="mb-4">
            <label className="cursor-pointer">
              <span className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition-colors">
                Choose PDF Drawing
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <p className="text-sm text-gray-500">
            Drag and drop your PDF drawing here or click to browse
          </p>
          {fileName && (
            <p className="mt-2 text-sm text-green-600">
              Selected file: {fileName}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* PDF Preview */}
        {pdfUrl && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Drawing Preview:</h3>
            <div className="border rounded-lg overflow-hidden bg-gray-100 p-2">
              <object
                data={pdfUrl}
                type="application/pdf"
                className="w-full"
                style={{ height: '600px' }}
              >
                <div className="text-center p-4">
                  <p>Unable to display PDF preview directly.</p>
                  <a 
                    href={pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Click here to open the PDF
                  </a>
                </div>
              </object>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IPIDDrawingAnalysis;