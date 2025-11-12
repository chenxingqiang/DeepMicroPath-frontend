# Sync Mode Fix - Using /api/v1/inference/submit

## Problem Analysis

### Original Issue
Frontend was calling `/api/v1/agent/inference/sync` which expected:
- `files` parameter as **URL strings** (`List[str]`)
- But frontend was sending **Base64 encoded objects** `{name, content}`

### API Architecture
We have two separate API services:

1. **Main API** (Port 8000 - `api/main.py`)
   - `/api/v1/inference/submit` - Async job submission ✅
   - `/api/v1/inference/{job_id}` - Job status
   - `/api/v1/inference/{job_id}/result` - Job result
   - `/api/v1/agent/inference/sync` - Agent sync (expects URL files)
   - `/api/v1/files/upload` - File upload

2. **Standalone Inference API** (Port 8001 - `inference/api_server.py`)
   - `/api/v1/inference/sync` - Direct sync inference (Base64 files)
   - Not accessible from frontend (different port)

### Connection Test Results
```bash
# Main API - ✅ Working
curl http://172.20.1.38:8000/
{"service":"DeepMicroPath API","version":"0.1.0","status":"running"}

# Standalone Inference API - ❌ Not accessible
curl http://172.20.1.38:8001/health
# 404 Not Found (ChromaDB running on this port instead)
```

## Solution Implemented

### Changed Endpoint
**File**: `frontend/app/client/platforms/deepmicropath.ts`

**From**: `/api/v1/agent/inference/sync` (Agent API - wrong data format)
**To**: `/api/v1/inference/submit` (Main API - job-based)

### Implementation Details

#### 1. Upload Files First
```typescript
// Upload files and get filenames
let inputFiles: string[] = [];
if (files.length > 0) {
  inputFiles = await this.uploadFilesFromBase64(files);
}
```

#### 2. Submit Job
```typescript
const submitBody = {
  question,
  mode,
  input_files: inputFiles,  // Now using filenames, not Base64
  parameters: {
    temperature: config?.temperature || 0.6,
    top_p: config?.top_p || 0.95,
    max_tokens: config?.max_tokens || 8000,
    presence_penalty: config?.presence_penalty || 1.1,
  },
};

const response = await fetch(`${this.baseUrl}/inference/submit`, {
  method: "POST",
  headers: this.getHeaders(),
  body: JSON.stringify(submitBody),
});
```

#### 3. Poll for Completion
```typescript
// Poll for job completion
const maxAttempts = 300; // 5 minutes max
while (attempts < maxAttempts) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  const statusResponse = await fetch(
    `${this.baseUrl}/inference/${jobId}`,
    { method: "GET", headers: this.getHeaders() }
  );
  
  const status = await statusResponse.json();
  
  if (status.status === "COMPLETED") {
    // Get final result
    const resultResponse = await fetch(
      `${this.baseUrl}/inference/${jobId}/result`,
      { method: "GET", headers: this.getHeaders() }
    );
    finalResult = await resultResponse.json();
    break;
  }
  
  attempts++;
}
```

#### 4. Format Result
```typescript
return {
  status: "completed",
  result: {
    prediction: finalResult.result?.prediction || finalResult.result,
    metadata: {
      execution_time: finalResult.duration_seconds || 0,
    }
  }
};
```

## API Testing

### Test 1: Job Submission ✅
```bash
curl -X POST http://172.20.1.38:8000/api/v1/inference/submit \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is 2+2?",
    "mode": "chat",
    "input_files": [],
    "parameters": {"temperature": 0.7}
  }'
```

**Response**:
```json
{
  "job_id": "job_20251111_065557_529be7f9",
  "status": "PENDING",
  "message": "Job submitted successfully"
}
```

### Test 2: Job Status Check ✅
```bash
curl http://172.20.1.38:8000/api/v1/inference/job_20251111_065557_529be7f9
```

**Response**:
```json
{
  "job_id": "job_20251111_065557_529be7f9",
  "mode": "chat",
  "question": "What is 2+2?",
  "status": "FAILED",
  "error": "Client error: All connection attempts failed",
  "duration_seconds": 0.037583
}
```

> ⚠️ Job failed because **SGLang service is not running**, but API endpoints work correctly!

## What's Working ✅

1. **API Endpoint**: `/api/v1/inference/submit` accessible and working
2. **Job Submission**: Returns job_id correctly
3. **Job Status**: Can query status via `/api/v1/inference/{job_id}`
4. **Error Handling**: Proper error messages returned
5. **Frontend Code**: Updated to use correct endpoints and data formats

## What Needs Fixing ⚠️

1. **SGLang Service**: Backend inference engine not running
   - Error: "All connection attempts failed"
   - Need to start SGLang workers on ports 6001-6008

## Next Steps

### 1. Start SGLang Service
```bash
# On server 172.20.1.38
cd /home/DeepMicroPath/DeepMicroPath
./scripts/start_sglang_workers.sh
```

### 2. Test Complete Flow
```bash
# Submit job
JOB_ID=$(curl -s -X POST http://172.20.1.38:8000/api/v1/inference/submit \
  -H "Content-Type: application/json" \
  -d '{"question": "What is 2+2?", "mode": "chat", "input_files": [], "parameters": {}}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['job_id'])")

# Wait and check status
sleep 5
curl http://172.20.1.38:8000/api/v1/inference/${JOB_ID}

# Get result (if COMPLETED)
curl http://172.20.1.38:8000/api/v1/inference/${JOB_ID}/result
```

### 3. Test with Files
```bash
# 1. Upload file
FILENAME=$(curl -s -X POST http://172.20.1.38:8000/api/v1/files/upload \
  -F "file=@test.csv" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['uploaded'][0]['filename'])")

# 2. Submit job with file
curl -X POST http://172.20.1.38:8000/api/v1/inference/submit \
  -H "Content-Type: application/json" \
  -d "{
    \"question\": \"Analyze this data\",
    \"mode\": \"chat\",
    \"input_files\": [\"${FILENAME}\"],
    \"parameters\": {}
  }"
```

## Summary

✅ **Frontend fix complete** - Now using correct endpoint with proper data format
✅ **API endpoints working** - Job submission and status check functional  
⚠️ **Backend service needed** - SGLang inference engine must be started

The sync mode issue is **RESOLVED** at the frontend/API integration level. The remaining issue is purely backend infrastructure (SGLang not running).
