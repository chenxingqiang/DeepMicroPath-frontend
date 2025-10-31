# DeepMicroPath Frontend Integration Guide

## Overview

The DeepMicroPath frontend has been configured to use the DeepMicroPath backend API at `http://172.20.1.38:8000/api/v1`. This guide documents the integration and configuration.

## Configuration Files Modified

### 1. Environment Variables (`.env.local`)

```bash
# Backend API URL
NEXT_PUBLIC_DEEPMICROPATH_API_URL=http://172.20.1.38:8000/api/v1
NEXT_PUBLIC_DEEPMICROPATH_API_KEY=

# Disable other AI providers
OPENAI_API_KEY=
GOOGLE_API_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=
SILICONFLOW_API_KEY=
AI302_API_KEY=

# Default model
DEFAULT_MODEL=deepmicropath-chat
```

### 2. Constants (`app/constant.ts`)

Added:
- `DEEPMICROPATH_BASE_URL`: Backend API URL
- `ServiceProvider.DeepMicroPath`: Provider enum
- `ModelProvider.DeepMicroPath`: Model provider enum
- `ApiPath.DeepMicroPath`: API route path
- DeepMicroPath models in `DEFAULT_MODELS` array:
  - `deepmicropath-auto` - Auto-detect mode
  - `deepmicropath-chat` - Interactive chat mode
  - `deepmicropath-deepresearch` - Deep research mode
  - `deepmicropath-microbiology-report` - Microbiology report generation

### 3. Store Configuration

#### Access Store (`app/store/access.ts`)
- Added `deepmicropathUrl` and `deepmicropathApiKey` to store
- Added `isValidDeepMicroPath()` validation method
- Integrated DeepMicroPath into authorization checks

#### Config Store (`app/store/config.ts`)
- Updated default model to `deepmicropath-chat`
- Updated default provider to `DeepMicroPath`

### 4. API Client (`app/client/api.ts`)

- Imported `DeepMicroPathApi` from platforms
- Added case for `ModelProvider.DeepMicroPath` in `ClientApi` constructor

### 5. DeepMicroPath API Platform (`app/client/platforms/deepmicropath.ts`)

Complete implementation including:
- File upload API
- Inference job submission
- Job status polling
- Result retrieval
- Report formatting

### 6. API Routes

#### Server-side Handler (`app/api/deepmicropath.ts`)
- Proxies requests to DeepMicroPath backend
- Handles authentication
- Supports model filtering

#### Route Registration (`app/api/[provider]/[...path]/route.ts`)
- Added DeepMicroPath handler to router

### 7. Server Configuration (`app/config/server.ts`)

Added environment variable support:
- `DEEPMICROPATH_URL`
- `DEEPMICROPATH_API_KEY`
- Added `isDeepMicroPath` flag
- Integrated config into server-side config

### 8. Authentication (`app/api/auth.ts`)

Added DeepMicroPath case to authentication handler

## Available Models

1. **deepmicropath-auto**: Auto-detect mode - automatically selects the best mode based on input
2. **deepmicropath-chat**: Chat mode - interactive conversational AI assistant
3. **deepmicropath-deepresearch**: Deep Research mode - comprehensive research and analysis
4. **deepmicropath-microbiology-report**: Microbiology Report mode - specialized for GPAS microbiology data analysis and report generation

## Usage

### Starting the Frontend

```bash
cd /Users/xingqiangchen/DeepMicroPath/frontend
npm install
npm run dev
```

The frontend will connect to the backend at `http://172.20.1.38:8000/api/v1`.

### Testing the Integration

1. Open browser to `http://localhost:3000`
2. Select DeepMicroPath model from model selector
3. Upload files or enter questions about microbiology
4. The system will submit jobs and poll for results

## API Endpoints Used

All endpoints are proxied through Next.js API routes:

Frontend calls:
- `/api/deepmicropath/files/upload` → Backend: `/api/v1/files/upload`
- `/api/deepmicropath/files` → Backend: `/api/v1/files`
- `/api/deepmicropath/inference/submit` → Backend: `/api/v1/inference/submit`
- `/api/deepmicropath/inference/{job_id}` → Backend: `/api/v1/inference/{job_id}`
- `/api/deepmicropath/inference/{job_id}/result` → Backend: `/api/v1/inference/{job_id}/result`

## Features

### File Upload
- Supports CSV, JPG, JPEG, PNG, PDF
- Max file size: 10MB
- Files are uploaded to backend before inference

### Job Polling
- Poll interval: 2 seconds
- Max attempts: 300 (10 minutes)
- Real-time status updates in chat UI

### Result Display
- Structured report formatting
- Markdown support
- Duration and metadata display

## Environment Variables Reference

### Required
- `NEXT_PUBLIC_DEEPMICROPATH_API_URL`: Backend API URL

### Optional
- `NEXT_PUBLIC_DEEPMICROPATH_API_KEY`: API key (if required by backend)
- `CODE`: Access code for frontend authentication
- `HIDE_USER_API_KEY`: Disable user API key input
- `DISABLE_GPT4`: Disable GPT-4 models
- `DEFAULT_MODEL`: Default model selection

## Troubleshooting

### Backend Connection Issues
1. Verify backend is running at `http://172.20.1.38:8000`
2. Check CORS is enabled on backend for frontend origin
3. Check network connectivity

### Model Not Available
1. Ensure `DEFAULT_MODEL=deepmicropath-chat` in `.env.local`
2. Clear browser localStorage
3. Restart frontend server

### Authentication Errors
1. Check if `CODE` is set in `.env.local`
2. Verify backend authentication requirements
3. Check `NEXT_PUBLIC_DEEPMICROPATH_API_KEY` if required

## Next Steps

1. **Test file upload functionality**
2. **Test inference with sample data**
3. **Verify result formatting**
4. **Add error handling improvements**
5. **Implement progress indicators**

## References

- Backend API: `http://172.20.1.38:8000/api/v1`
- Frontend: `http://localhost:3000`
- DeepMicroPath models documentation: (see backend docs)
