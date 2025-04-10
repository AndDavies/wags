'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, MapPin, Info, ExternalLink, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function MapApiDebugPage() {
  const [apiKey, setApiKey] = useState<string>('');
  const [keyStatus, setKeyStatus] = useState<'valid' | 'invalid' | 'loading' | null>(null);
  const [urlRestricted, setUrlRestricted] = useState<boolean>(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [testResults, setTestResults] = useState<{
    keyPresent: boolean;
    keyValid: boolean;
    apiWorking: boolean;
    suggestionsWorking: boolean;
    error?: string;
    status?: number;
  } | null>(null);

  useEffect(() => {
    // Show masked API key on client
    const key = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
    if (key) {
      // Mask the API key for display
      const maskedKey = key.length > 8 
        ? `${key.slice(0, 4)}...${key.slice(-4)}` 
        : '(not set or too short)';
      setApiKey(maskedKey);
      
      // Basic check if it's the placeholder value
      if (key === 'pk.ey...' || key === 'your_mapbox_access_token') {
        setKeyStatus('invalid');
      } else if (key.startsWith('pk.ey')) {
        setKeyStatus('valid');
      } else {
        setKeyStatus('invalid');
      }
    } else {
      setApiKey('(not set)');
      setKeyStatus('invalid');
    }

    // Get current URL for restriction instructions
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const protocol = window.location.protocol;
      setCurrentUrl(`${protocol}//${host}`);
    }
  }, []);

  const testMapboxApi = async () => {
    setTestResults(null);
    setKeyStatus('loading');
    setUrlRestricted(false);
    
    try {
      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const results = {
        keyPresent: !!accessToken,
        keyValid: false,
        apiWorking: false,
        suggestionsWorking: false,
      };
      
      if (!accessToken || accessToken === 'pk.ey...' || accessToken === 'your_mapbox_access_token') {
        setTestResults({
          ...results,
          error: 'Mapbox access token is not properly configured in .env.local',
        });
        setKeyStatus('invalid');
        return;
      }
      
      // Get current URL for origin header
      const host = window.location.hostname;
      const protocol = window.location.protocol;
      const origin = `${protocol}//${host}`;
      
      // Test 1: Basic API connectivity
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/London.json?access_token=${accessToken}`,
        {
          headers: {
            'Referer': origin,
            'Origin': origin
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 403) {
          setUrlRestricted(true);
          throw new Error(`API responded with 403 Forbidden: This suggests URL restriction issues with your token.`);
        }
        throw new Error(`API responded with ${response.status}: ${response.statusText}`);
      }
      
      results.keyValid = true;
      results.apiWorking = true;
      
      // Test 2: Check if we get actual results
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        results.suggestionsWorking = true;
        setKeyStatus('valid');
      } else {
        throw new Error('API responded but returned no features');
      }
      
      setTestResults(results);
    } catch (error: any) {
      console.error('Mapbox API test failed:', error);
      setKeyStatus('invalid');
      
      const errorMessage = error.message || 'Unknown error testing Mapbox API';
      const is403Error = errorMessage.includes('403');
      
      if (is403Error) {
        setUrlRestricted(true);
      }
      
      setTestResults({
        keyPresent: !!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
        keyValid: false,
        apiWorking: false,
        suggestionsWorking: false,
        error: errorMessage,
        status: is403Error ? 403 : undefined
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Mapbox API Debug</h1>
      <p className="text-gray-600 mb-6">
        This page helps you troubleshoot Mapbox API integration issues for the city autocomplete feature.
      </p>
      
      {urlRestricted && (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200 mb-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>URL Restriction Error Detected (403 Forbidden)</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Your Mapbox API token appears to have URL restrictions that do not include your current domain.</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="font-medium">Your current URL:</span>
              <code className="bg-amber-100 px-2 py-1 rounded text-amber-900">{currentUrl}</code>
            </div>
            <p className="mt-2">
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noreferrer"
                className="text-primary underline flex items-center hover:text-primary/90 inline-flex"
              >
                Go to Mapbox Access Tokens <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </p>
            <p>Add your current URL to the list of allowed URLs for your token.</p>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Check your Mapbox API configuration status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">API Key Status:</span>
              <div className="flex items-center gap-2">
                {keyStatus === 'loading' && (
                  <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
                )}
                {keyStatus === 'valid' && (
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Valid Format
                  </Badge>
                )}
                {keyStatus === 'invalid' && (
                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Invalid
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Current API Key:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{apiKey}</code>
            </div>
            
            <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-700">
              <Info className="h-4 w-4" />
              <AlertTitle>Configuration Location</AlertTitle>
              <AlertDescription>
                The Mapbox API key should be set as <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in your <code className="bg-blue-100 px-1 rounded">.env.local</code> file.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={testMapboxApi} disabled={keyStatus === 'loading'}>
              {keyStatus === 'loading' ? 'Testing...' : 'Test API Connection'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Results from Mapbox API connectivity tests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  {testResults.keyPresent ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-medium">API Key Present</h3>
                    <p className="text-sm text-gray-600">
                      {testResults.keyPresent 
                        ? 'Mapbox API key is set in environment variables' 
                        : 'No API key found in environment variables'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  {testResults.keyValid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-medium">API Key Valid</h3>
                    <p className="text-sm text-gray-600">
                      {testResults.keyValid 
                        ? 'API key appears to be valid' 
                        : testResults.status === 403 
                          ? 'API key may be valid but has URL restrictions' 
                          : 'API key is invalid or incorrectly formatted'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  {testResults.apiWorking ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-medium">API Connection</h3>
                    <p className="text-sm text-gray-600">
                      {testResults.apiWorking 
                        ? 'Successfully connected to Mapbox API' 
                        : testResults.status === 403
                          ? 'Failed to connect due to URL restrictions'
                          : 'Failed to connect to Mapbox API'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  {testResults.suggestionsWorking ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-medium">City Suggestions</h3>
                    <p className="text-sm text-gray-600">
                      {testResults.suggestionsWorking 
                        ? 'Successfully retrieved city suggestions' 
                        : 'Failed to retrieve city suggestions'}
                    </p>
                  </div>
                </div>
                
                {testResults.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{testResults.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                <MapPin className="h-10 w-10 mb-3 text-gray-300" />
                <p>Click "Test API Connection" to run diagnostics</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {testResults && (
              <div className="w-full">
                {testResults.keyPresent && testResults.keyValid && testResults.apiWorking && testResults.suggestionsWorking ? (
                  <Alert className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>All Tests Passed</AlertTitle>
                    <AlertDescription>
                      Your Mapbox API integration is working correctly. City autocomplete should be functioning properly.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    <Alert className="bg-amber-50 text-amber-700 border-amber-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Troubleshooting Steps</AlertTitle>
                      <AlertDescription className="space-y-2">
                        {urlRestricted ? (
                          <>
                            <p className="font-medium">URL Restriction Error (403)</p>
                            <ol className="list-decimal ml-5 space-y-1">
                              <li>Log into your <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer" className="text-primary underline">Mapbox account</a></li>
                              <li>Find your access token in the list</li>
                              <li>Under "URL restrictions" click "Edit"</li>
                              <li>Add your application URL: <code className="bg-amber-100 px-1 rounded">{currentUrl}</code></li>
                              <li>For development, you may need to add <code className="bg-amber-100 px-1 rounded">http://localhost:3000</code></li>
                              <li>Save changes and restart your development server</li>
                            </ol>
                          </>
                        ) : (
                          <>
                            <p>1. Ensure you've set the correct API key in <code className="bg-amber-100 px-1 rounded">.env.local</code></p>
                            <p>2. Make sure your Mapbox account is active and the token has geocoding permissions</p>
                            <p>3. Check browser console for CORS or other errors</p>
                            <p>4. Try restarting the development server after updating the key</p>
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                    
                    <div className="text-sm text-gray-500">
                      <p className="font-semibold">Get a Mapbox API key:</p>
                      <ol className="list-decimal ml-5 space-y-1">
                        <li>Sign up/login at <a href="https://account.mapbox.com/auth/signup" target="_blank" rel="noopener noreferrer" className="text-primary underline">Mapbox.com</a></li>
                        <li>Go to your account dashboard</li>
                        <li>Create a new access token with geocoding permissions</li>
                        <li>Add the token to your <code className="bg-gray-100 px-1 rounded">.env.local</code> file</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-6 text-center">
        <Link href="/create-trip" className="text-primary hover:underline inline-flex items-center">
          <Button variant="outline">Return to Trip Creation</Button>
        </Link>
      </div>
    </div>
  );
} 