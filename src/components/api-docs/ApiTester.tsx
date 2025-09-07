'use client';

import { useState } from 'react';
import { PlayIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ApiTesterProps {
  endpoint: {
    method: string;
    path: string;
    title: string;
    requestBody?: any;
    parameters?: any[];
  };
}

export default function ApiTester({ endpoint }: ApiTesterProps) {
  const [authToken, setAuthToken] = useState('your_auth_token_here');
  const [requestBody, setRequestBody] = useState(
    endpoint.requestBody ? JSON.stringify(endpoint.requestBody, null, 2) : ''
  );
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const sendRequest = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://api.ops-tower.ph' 
        : 'http://localhost:3000';

      let body = undefined;
      if (endpoint.method !== 'GET' && requestBody.trim()) {
        try {
          body = JSON.stringify(JSON.parse(requestBody));
        } catch (e) {
          throw new Error('Invalid JSON in request body');
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken.trim()) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const fetchOptions: RequestInit = {
        method: endpoint.method,
        headers,
      };

      if (body) {
        fetchOptions.body = body;
      }

      const startTime = Date.now();
      const response = await fetch(`${baseUrl}${endpoint.path}`, fetchOptions);
      const endTime = Date.now();
      
      const responseData = await response.json().catch(() => ({}));
      
      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        responseTime: endTime - startTime,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setResponse({
        status: 0,
        error: true,
        message: error instanceof Error ? error.message : 'Request failed',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCurl = () => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.ops-tower.ph' 
      : 'http://localhost:3000';
    
    let curl = `curl -X ${endpoint.method} \\\n  "${baseUrl}${endpoint.path}" \\\n`;
    
    if (authToken.trim()) {
      curl += `  -H "Authorization: Bearer ${authToken}" \\\n`;
    }
    
    curl += `  -H "Content-Type: application/json"`;
    
    if (endpoint.method !== 'GET' && requestBody.trim()) {
      try {
        const parsedBody = JSON.parse(requestBody);
        curl += ` \\\n  -d '${JSON.stringify(parsedBody)}'`;
      } catch (e) {
        curl += ` \\\n  -d '${requestBody}'`;
      }
    }
    
    return curl;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard');
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-50';
    if (status >= 400 && status < 500) return 'text-yellow-600 bg-yellow-50';
    if (status >= 500) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Authentication */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Authentication</h3>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Bearer Token
          </label>
          <input
            type="text"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="your_auth_token_here"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500">
            Get your token from the <span className="font-mono bg-gray-100 px-1 rounded">/auth/login</span> endpoint
          </p>
        </div>
      </div>

      {/* Request Body Editor */}
      {endpoint.method !== 'GET' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Request Body</h3>
          <div className="space-y-2">
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder="Enter JSON request body..."
              rows={12}
              className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500">
              Enter valid JSON for the request body
            </p>
          </div>
        </div>
      )}

      {/* Send Request */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Send Request</h3>
          <button
            onClick={sendRequest}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                <span>Send {endpoint.method} Request</span>
              </>
            )}
          </button>
        </div>

        {/* Response */}
        {response && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-lg ${getStatusColor(response.status)}`}>
                {response.status} {response.statusText}
              </span>
              {response.responseTime && (
                <span className="text-sm text-gray-500">
                  {response.responseTime}ms
                </span>
              )}
              <span className="text-sm text-gray-500">
                {new Date(response.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Response Headers */}
            {response.headers && Object.keys(response.headers).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Response Headers</h4>
                <div className="bg-gray-900 rounded p-3">
                  <pre className="text-green-400 text-xs overflow-x-auto">
                    <code>{JSON.stringify(response.headers, null, 2)}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Response Body */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Response Body</h4>
              <div className="relative">
                <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto">
                  <pre className="text-green-400 text-sm">
                    <code>{JSON.stringify(response.data || response, null, 2)}</code>
                  </pre>
                </div>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(response.data || response, null, 2))}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded"
                  title="Copy response"
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* cURL Command */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">cURL Command</h3>
          <button
            onClick={() => copyToClipboard(generateCurl())}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" />
            )}
            <span>Copy</span>
          </button>
        </div>
        <div className="relative">
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-yellow-400 text-sm overflow-x-auto">
              <code>{generateCurl()}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}