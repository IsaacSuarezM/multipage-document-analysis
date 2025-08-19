// MIT No Attribution
//
// Copyright 2024 Amazon Web Services
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this
// software and associated documentation files (the "Software"), to deal in the Software
// without restriction, including without limitation the rights to use, copy, modify,
// merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { JobStatus } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_REST_API_ENDPOINT;

// Types
export interface Job {
  id: string;
  document_name: string;
  document_key: string;
  report_key?: string;
  status: JobStatus;
  // Legacy fields for backward compatibility
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  documentUrl?: string;
  resultUrl?: string;
  progress?: number;
  error?: string;
}

export interface CreateJobRequest {
  name: string;
  documentFile: File;
}

export interface JobResponse {
  job: Job;
}

export interface JobsResponse {
  jobs: Job[];
  nextToken?: string;
}

export interface JobResults {
  jobId: string;
  status: JobStatus;
  results?: any;
  error?: string;
  downloadUrl?: string;
}

// API Client setup
const createApiClient = async () => {
  try {
    console.log('[API] Attempting to fetch auth session...');
    const session = await fetchAuthSession();
    console.log('[API] Auth session:', { 
      hasTokens: !!session.tokens,
      hasIdToken: !!session.tokens?.idToken 
    });
    
    const token = session.tokens?.idToken?.toString();
    
    const client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[API] Created authenticated client with baseURL:', API_BASE_URL);
    return client;
  } catch (error) {
    console.warn('[API] No auth session available, using unauthenticated client:', error);
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

// Mock data for development
const mockJobs: Job[] = [
  {
    id: '1',
    name: 'Sample Document Analysis',
    document_name: 'sample-doc.pdf',
    document_key: 'documents/sample-doc.pdf',
    report_key: 'reports/sample-report.pdf',
    status: JobStatus.COMPLETED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    progress: 100,
    documentUrl: '/sample-doc.pdf',
    resultUrl: '/sample-result.json'
  },
  {
    id: '2',
    name: 'Contract Review',
    document_name: 'contract.pdf',
    document_key: 'documents/contract.pdf',
    status: JobStatus.IN_PROGRESS,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
    progress: 65,
    documentUrl: '/contract.pdf'
  },
  {
    id: '3',
    name: 'Legal Document Processing',
    document_name: 'legal-doc.pdf',
    document_key: 'documents/legal-doc.pdf',
    status: JobStatus.PENDING,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    progress: 0,
    documentUrl: '/legal-doc.pdf'
  }
];

// API Functions
export const getJobs = async (nextToken?: string): Promise<JobsResponse> => {
  console.log('[API] getJobs called with nextToken:', nextToken);
  try {
    const client = await createApiClient();
    const params = nextToken ? { nextToken } : {};
    
    console.log('[API] Making request to /multipage-doc-analysis/jobs/query');
    const response = await client.get('/multipage-doc-analysis/jobs/query', { params });
    console.log('[API] Successfully fetched jobs from backend:', response.data);
    
    // Ensure we always return the expected format
    const responseData = response.data;
    console.log('[API] Raw response data:', responseData);
    
    // Handle different backend response formats
    if (responseData && Array.isArray(responseData.items)) {
      // Backend returns {items: [...]} format
      return {
        jobs: responseData.items,
        nextToken: responseData.nextToken
      };
    } else if (responseData && Array.isArray(responseData.jobs)) {
      // Backend returns {jobs: [...]} format (expected)
      return responseData;
    } else if (Array.isArray(responseData)) {
      // Backend returns [...] format directly
      return {
        jobs: responseData,
        nextToken: undefined
      };
    } else {
      console.warn('[API] Backend returned unexpected format, using empty array:', responseData);
      return {
        jobs: [],
        nextToken: responseData?.nextToken
      };
    }
  } catch (error) {
    console.warn('[API] Backend not available, using mock data:', error);
    // Return mock data for development
    return {
      jobs: mockJobs,
    };
  }
};

export const getJob = async (jobId: string): Promise<JobResponse> => {
  try {
    const client = await createApiClient();
    const response = await client.get(`/multipage-doc-analysis/jobs/query/${jobId}`);
    return response.data;
  } catch (error) {
    console.warn('API not available, using mock data:', error);
    // Return mock data for development
    const job = mockJobs.find(j => j.id === jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    return { job };
  }
};

export const createJob = async (request: CreateJobRequest): Promise<JobResponse> => {
  try {
    const client = await createApiClient();
    const formData = new FormData();
    formData.append('name', request.name);
    formData.append('document', request.documentFile);
    
    const response = await client.post('/jobs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.warn('API not available, creating mock job:', error);
    // Return mock data for development
    const newJob: Job = {
      id: Math.random().toString(36).substr(2, 9),
      name: request.name,
      document_name: request.documentFile.name,
      document_key: `documents/${request.documentFile.name}`,
      status: JobStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
    };
    mockJobs.unshift(newJob);
    return { job: newJob };
  }
};

export const deleteJob = async (jobId: string): Promise<void> => {
  try {
    const client = await createApiClient();
    await client.delete(`/jobs/${jobId}`);
  } catch (error) {
    console.warn('API not available, removing from mock data:', error);
    // Remove from mock data for development
    const index = mockJobs.findIndex(j => j.id === jobId);
    if (index > -1) {
      mockJobs.splice(index, 1);
    }
  }
};

export const downloadJobResult = async (jobId: string): Promise<Blob> => {
  try {
    const client = await createApiClient();
    const response = await client.get(`/jobs/${jobId}/result`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.warn('API not available, returning mock result:', error);
    // Return mock result for development
    const mockResult = {
      jobId,
      analysis: {
        summary: "This is a mock analysis result",
        extractedData: {
          entities: ["Entity 1", "Entity 2"],
          keyPhrases: ["Key phrase 1", "Key phrase 2"]
        }
      }
    };
    return new Blob([JSON.stringify(mockResult, null, 2)], { type: 'application/json' });
  }
};

export interface UploadData {
  uploadUrl: string;
  key: string;
  fields?: Record<string, string>;
}

// Additional functions for document processing
export const getUploadURL = async (fileName: string, _fileType: string): Promise<UploadData> => {
  try {
    const client = await createApiClient();
    // Use the backend's expected URL pattern with folder and key parameters
    const folder = 'documents';
    const key = `${Date.now()}-${fileName}`;
    const response = await client.get(`/multipage-doc-analysis/upload/${folder}/${key}`);
    console.log('[API] Upload URL response:', response.data);
    
    // Handle presigned_post format from AWS
    const data = response.data;
    if (data.presigned_post) {
      return {
        uploadUrl: data.presigned_post.url,
        fields: data.presigned_post.fields,
        key: `${folder}/${key}` // Include the folder prefix to match S3 structure
      };
    } else if (data.presigned_url) {
      return {
        uploadUrl: data.presigned_url,
        key: `${folder}/${key}` // Include the folder prefix to match S3 structure
      };
    }
    
    return response.data;
  } catch (error) {
    console.warn('API not available, returning mock upload URL:', error);
    // Return mock data for development
    return {
      uploadUrl: `https://mock-bucket.s3.amazonaws.com/${fileName}`,
      key: `documents/${Date.now()}-${fileName}`
    };
  }
};

export const uploadFile = async (file: File, uploadData: any): Promise<{ key: string }> => {
  try {
    console.log('[API] Upload data received:', uploadData);
    
    if (uploadData.fields && uploadData.uploadUrl) {
      // S3 presigned POST upload
      const formData = new FormData();
      
      // Add all the presigned post fields
      Object.keys(uploadData.fields).forEach(key => {
        formData.append(key, uploadData.fields[key]);
      });
      
      // Add the file last
      formData.append('file', file);
      
      await axios.post(uploadData.uploadUrl, formData);
    } else if (uploadData.uploadUrl) {
      // Simple presigned URL upload
      await axios.put(uploadData.uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });
    } else {
      throw new Error('Invalid upload data format');
    }
    
    return { key: uploadData.key };
  } catch (error) {
    console.warn('Upload failed, simulating success for development:', error);
    // Simulate success for development
    return { key: uploadData.key || 'mock-key' };
  }
};

export const startDocumentAnalysis = async (documentKey: string, jobName: string): Promise<JobResponse> => {
  try {
    const client = await createApiClient();
    const response = await client.post('/multipage-doc-analysis/processDocument', {
      key: documentKey,
      metadata: {
        filename: jobName
      }
    });
    
    console.log('[API] Document analysis response:', response.data);
    
    // The backend returns { job_id, status }, so we need to create a Job object
    const job: Job = {
      id: response.data.job_id,
      name: jobName,
      document_name: documentKey,
      document_key: documentKey,
      status: response.data.status || JobStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
      documentUrl: documentKey // Use the key directly since we don't have bucket name here
    };
    
    return { job };
  } catch (error) {
    console.warn('API not available, creating mock analysis job:', error);
    // Return mock data for development
    const newJob: Job = {
      id: Math.random().toString(36).substr(2, 9),
      name: jobName,
      document_name: documentKey,
      document_key: documentKey,
      status: JobStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
      documentUrl: `https://mock-bucket.s3.amazonaws.com/${documentKey}`
    };
    mockJobs.unshift(newJob);
    return { job: newJob };
  }
};

export const getDownloadURL = async (type: 'document' | 'report', folder: string, key: string): Promise<{presigned_url: string}> => {
  try {
    const client = await createApiClient();
    const response = await client.get(`/multipage-doc-analysis/download/${type}/${folder}/${key}`);
    return response.data;
  } catch (error) {
    console.warn('API not available, returning mock download URL:', error);
    // Return mock data for development
    return {
      presigned_url: `https://mock-bucket.s3.amazonaws.com/${folder}/${key}`
    };
  }
};

export const downloadFile = async (url: string): Promise<Blob> => {
  try {
    const response = await axios.get(url, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.warn('Download failed, returning mock file:', error);
    // Return mock file for development
    return new Blob(['Mock file content'], { type: 'application/octet-stream' });
  }
};

export const getJobResults = async (jobId: string): Promise<JobResults> => {
  try {
    const client = await createApiClient();
    const response = await client.get(`/multipage-doc-analysis/jobs/results/${jobId}`);
    return response.data;
  } catch (error) {
    console.warn('API not available, using mock results:', error);
    // Return mock data for development
    const job = mockJobs.find(j => j.id === jobId);
    return {
      jobId,
      status: job?.status || JobStatus.COMPLETED,
      results: {
        summary: "This is a mock analysis result",
        extractedData: {
          entities: ["Entity 1", "Entity 2"],
          keyPhrases: ["Key phrase 1", "Key phrase 2"]
        }
      },
      downloadUrl: job?.resultUrl
    };
  }
};

// Export default client for custom requests
export const getApiClient = createApiClient;