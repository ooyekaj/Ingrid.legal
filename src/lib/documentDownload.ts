// Document download utility for calling the Heroku backend API

export interface PrepareDocketRequest {
  state: string;
  county: string;
  division: string;
  judge: string;
  document_type: string;
}

export async function downloadDocument(formData: {
  state: string;
  county: string;
  division: string;
  judge: string;
  documentType: string;
}): Promise<void> {
  try {
    // Prepare request data matching the backend API structure
    const requestData: PrepareDocketRequest = {
      state: formData.state,
      county: formData.county,
      division: formData.division,
      judge: formData.judge,
      document_type: formData.documentType
    };

    // Call the Heroku backend API
    const response = await fetch('https://ingrid-legal-720da964f241.herokuapp.com/api/prepareDocket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.status} ${response.statusText}`);
    }

    // Get the blob from the response
    const blob = await response.blob();

    // Create a download link and trigger it
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Generate filename based on the form data
    const filename = `${formData.documentType.replace(/\s+/g, '_')}_${formData.county}_${formData.judge.replace(/\s+/g, '_')}.docx`;
    a.download = filename;
    
    // Append to DOM, click, and remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
}