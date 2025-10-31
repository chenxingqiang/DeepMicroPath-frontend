# DeepMicroPath Frontend

Web interface for DeepMicroPath AI-powered microbiology analysis system.

## Overview

This frontend is based on [NextChat](https://github.com/ChatGPTNextWeb/NextChat) and customized for DeepMicroPath to provide:

- 🧬 **Microbiology-Specific UI**: Specialized interface for microbiology report generation
- 📁 **File Upload**: Support for CSV, images, and PDF files
- ⚡ **Real-time Updates**: Live job status tracking with progress indicators
- 🎯 **Multi-Mode Inference**: Auto, Microbiology, and General Research modes
- 📊 **Report Visualization**: Formatted display of structured microbiology reports
- 🔄 **Job Management**: Submit, track, and cancel inference jobs

## Quick Start

```bash
# Install dependencies
yarn install

# Configure environment
cp .env.deepmicropath .env.local
# Edit .env.local with your backend URL

# Start development server
yarn dev
```

Open http://localhost:3000

## Configuration

### Backend Connection

Edit `.env.local`:

```env
NEXT_PUBLIC_DEEPMICROPATH_API_URL=http://localhost:8088/api/v1
```

### CORS Setup

Ensure your backend (`api/main.py`) allows the frontend origin:

```python
allow_origins=["http://localhost:3000"]
```

## Features

### 1. Inference Modes

- **Auto Mode**: Automatically detects task type from question content
- **Microbiology Mode**: Specialized for generating microbiology analysis reports
- **General Research Mode**: For general scientific research questions

### 2. File Upload

Upload files and reference them in your questions:

```
result_table.csv Generate a comprehensive microbiology report
```

Supported formats: CSV, JPG, PNG, PDF (max 10MB)

### 3. Real-Time Status

Watch your inference job progress:
- ⏳ PENDING - Job queued
- 🔄 RUNNING - Processing
- ✅ COMPLETED - Results ready
- ❌ FAILED - Error occurred

### 4. Structured Reports

Microbiology reports are automatically formatted with sections:
- Sample Information (样本信息)
- Community Analysis (微生物群落分析)
- Clinical Significance (临床意义)
- Health Recommendations (健康建议)
- References (参考文献)

## Architecture

```
NextChat UI
    ↓
DeepMicroPathApi Client (app/client/platforms/deepmicropath.ts)
    ↓
DeepMicroPath Backend API (http://localhost:8088/api/v1)
    ↓
Inference Service → Model
```

## Key Files

- `app/client/platforms/deepmicropath.ts` - API client for backend communication
- `app/constant.ts` - Configuration constants
- `app/client/api.ts` - API provider registration
- `.env.deepmicropath` - Environment configuration template

## Development

### Running Tests

```bash
yarn test
```

### Building for Production

```bash
yarn build
yarn start
```

### Docker Build

```bash
docker build -t deepmicropath-frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_DEEPMICROPATH_API_URL=http://backend:8088/api/v1 \
  deepmicropath-frontend
```

## API Integration

### Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/files/upload` | Upload data files |
| `GET /api/v1/files` | List uploaded files |
| `POST /api/v1/inference/submit` | Submit inference job |
| `GET /api/v1/inference/{job_id}` | Get job status |
| `GET /api/v1/inference/{job_id}/result` | Retrieve results |
| `DELETE /api/v1/inference/{job_id}` | Cancel job |

### Request Example

```typescript
const response = await fetch(`${baseUrl}/inference/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'microbiology',
    question: 'result.csv Generate report',
    input_files: ['result.csv'],
    parameters: {}
  })
});
```

## Troubleshooting

### Connection Failed

```bash
# Check backend is running
curl http://localhost:8088/api/v1/health

# Check CORS configuration
# Make sure frontend URL is in backend's allow_origins
```

### Build Errors

```bash
# Clean rebuild
rm -rf .next node_modules
yarn install
yarn build
```

### TypeScript Errors

The DeepMicroPath client may have some type mismatches with NextChat's base types. These are generally safe to ignore in development or can be fixed by adding proper type assertions.

## Documentation

- [Frontend Setup Guide](../docs/FRONTEND_SETUP_GUIDE.md) - Comprehensive setup and deployment
- [Integration Design](../docs/FRONTEND_INTEGRATION_DESIGN.md) - Architecture and design decisions
- [API Documentation](../api/README.md) - Backend API reference

## Contributing

When making changes:

1. Follow existing code structure
2. Update TypeScript types
3. Test with backend API
4. Update documentation

## License

Same as DeepMicroPath project (see root LICENSE file)

## Support

For issues:
- Check browser console for frontend errors
- Check backend logs: `tail -f logs/api.log`
- Review documentation in `/docs` directory
