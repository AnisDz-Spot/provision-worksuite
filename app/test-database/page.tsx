"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function TestDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [dbResult, setDbResult] = useState<any>(null);
  const [blobResult, setBlobResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);

  // Test database connection
  const testDatabase = async () => {
    setLoading(true);
    setDbResult(null);
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setDbResult(data);
    } catch (error) {
      setDbResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a test project
  const createTestProject = async () => {
    setLoading(true);
    setDbResult(null);
    try {
      const response = await fetch('/api/test-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Test Project ${Date.now()}`,
          description: 'Created from test page',
          owner: 'Test User'
        })
      });
      const data = await response.json();
      setDbResult(data);
    } catch (error) {
      setDbResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create project' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Test blob storage
  const testBlobStorage = async () => {
    if (!file) {
      setBlobResult({ success: false, error: 'Please select a file first' });
      return;
    }

    setLoading(true);
    setBlobResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/test-blob', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setBlobResult(data);
    } catch (error) {
      setBlobResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Database & Storage Test</h1>
      <p className="text-muted-foreground mb-8">
        Test your Neon Postgres and Vercel Blob connections
      </p>

      <div className="grid gap-6">
        {/* Database Tests */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Database Tests (Neon Postgres)</h2>
          
          <div className="flex gap-4 mb-4">
            <Button 
              onClick={testDatabase} 
              disabled={loading}
              variant="default"
            >
              {loading ? 'Testing...' : 'Test Connection & Get Projects'}
            </Button>
            
            <Button 
              onClick={createTestProject} 
              disabled={loading}
              variant="default"
            >
              {loading ? 'Creating...' : 'Create Test Project'}
            </Button>
          </div>

          {dbResult && (
            <div className={`p-4 rounded-lg ${dbResult.success ? 'bg-green-500/10 border border-green-500' : 'bg-red-500/10 border border-red-500'}`}>
              <div className="flex items-start gap-2">
                <span className="text-xl">{dbResult.success ? '✅' : '❌'}</span>
                <div className="flex-1">
                  <p className="font-semibold mb-2">
                    {dbResult.success ? 'Success!' : 'Error'}
                  </p>
                  <pre className="text-sm bg-background/50 p-3 rounded overflow-auto max-h-64">
                    {JSON.stringify(dbResult, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Blob Storage Tests */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📁 Blob Storage Test (Vercel Blob)</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select a file to upload (max 10MB)
              </label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              {file && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <Button 
              onClick={testBlobStorage} 
              disabled={loading || !file}
              variant="default"
            >
              {loading ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>

          {blobResult && (
            <div className={`mt-4 p-4 rounded-lg ${blobResult.success ? 'bg-green-500/10 border border-green-500' : 'bg-red-500/10 border border-red-500'}`}>
              <div className="flex items-start gap-2">
                <span className="text-xl">{blobResult.success ? '✅' : '❌'}</span>
                <div className="flex-1">
                  <p className="font-semibold mb-2">
                    {blobResult.success ? 'File Uploaded!' : 'Upload Failed'}
                  </p>
                  {blobResult.success && blobResult.url && (
                    <div className="mb-2">
                      <a 
                        href={blobResult.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        View uploaded file →
                      </a>
                    </div>
                  )}
                  <pre className="text-sm bg-background/50 p-3 rounded overflow-auto max-h-64">
                    {JSON.stringify(blobResult, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Instructions */}
        <Card className="p-6 bg-accent/20">
          <h3 className="text-lg font-semibold mb-2">📝 Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>Run Database Schema:</strong> Go to your Neon dashboard → Query tab → 
              Copy content from <code className="bg-background px-1 py-0.5 rounded">lib/db/schema.sql</code> → Execute
            </li>
            <li>
              <strong>Environment Variables:</strong> Vercel automatically sets <code className="bg-background px-1 py-0.5 rounded">POSTGRES_URL</code> and <code className="bg-background px-1 py-0.5 rounded">BLOB_READ_WRITE_TOKEN</code>
            </li>
            <li>
              <strong>Test Connection:</strong> Click the buttons above to test your setup
            </li>
            <li>
              <strong>Check Results:</strong> Green = success, Red = needs attention
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
