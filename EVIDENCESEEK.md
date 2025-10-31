# EvidenceSeek - DeepMicroPath Frontend

## Overview

**EvidenceSeek** is the web interface for DeepMicroPath, an AI-powered microbiology analysis and research platform. It provides an intuitive chat-based interface for interacting with advanced microbiology AI models.

## Branding

- **Name**: EvidenceSeek
- **Purpose**: AI-powered microbiology analysis and research
- **Backend**: DeepMicroPath
- **Technology**: React + Next.js + TypeScript
- **Base**: Customized from NextChat

## Key Features

🧬 **Microbiology-Specific Analysis**
- Specialized modes for microbiology reports
- Automated report generation
- Clinical significance interpretation

📁 **File Upload & Processing**
- Support for CSV, images, and PDFs
- Direct file reference in queries
- Secure backend storage

⚡ **Real-Time Processing**
- Live job status updates
- Progress tracking
- Streaming responses

🎯 **Multi-Mode Inference**
- Auto mode: Intelligent task detection
- Microbiology mode: Specialized analysis
- General research mode: Scientific Q&A

## Quick Start

```bash
# Install dependencies
yarn install

# Configure backend
cp .env.deepmicropath .env.local
# Edit .env.local with your DeepMicroPath backend URL

# Start development server
yarn dev
```

Open http://localhost:3000 to access EvidenceSeek.

## Configuration

### Environment Variables

```env
# Backend Connection
NEXT_PUBLIC_DEEPMICROPATH_API_URL=http://localhost:8088/api/v1
NEXT_PUBLIC_DEEPMICROPATH_API_KEY=optional-api-key

# Application Settings
NEXT_PUBLIC_APP_NAME=EvidenceSeek
```

### Backend Requirements

Ensure DeepMicroPath backend is running with CORS enabled:

```python
# In api/main.py
allow_origins=["http://localhost:3000"]
```

## Usage Examples

### Basic Analysis
```
Analyze the microbial diversity in this sample
```

### File-Based Analysis
```
result_table.csv Generate a comprehensive microbiology report
```

### Specialized Queries
```
请生成微生物AI分析解读报告 (Generate microbiology AI analysis report)
```

## Interface Modes

1. **DeepMicroPath (Auto Mode)**
   - Automatically detects task type
   - Best for general use

2. **DeepMicroPath (Microbiology)**
   - Optimized for microbiology reports
   - Structured output with clinical insights

3. **DeepMicroPath (General Research)**
   - Scientific research queries
   - Literature analysis

## Report Sections

Generated reports include:
- 样本信息总览 (Sample Information Overview)
- 微生物群落分析 (Microbial Community Analysis)
- 临床意义解读 (Clinical Significance Interpretation)
- 健康建议 (Health Recommendations)
- 参考文献 (References)

## Development

### Project Structure

```
frontend/
├── app/
│   ├── client/
│   │   └── platforms/
│   │       └── deepmicropath.ts    # API client
│   ├── components/                  # UI components
│   ├── locales/                     # i18n translations
│   └── constant.ts                  # Configuration
├── public/                          # Static assets
└── src-tauri/                       # Desktop app config
```

### Key Files

- `app/client/platforms/deepmicropath.ts` - Backend integration
- `app/constant.ts` - Application constants
- `app/layout.tsx` - Page metadata
- `.env.deepmicropath` - Environment template

## Building

### Web Application

```bash
# Production build
yarn build
yarn start

# Build output in .next/
```

### Desktop Application

```bash
# Build Tauri app
yarn app:build

# Output in src-tauri/target/release/
```

## Deployment

### Development
```bash
yarn dev
# http://localhost:3000
```

### Production
```bash
# Build and deploy
yarn build
yarn start

# Or use Docker
docker build -t evidenceseek .
docker run -p 3000:3000 evidenceseek
```

### Vercel
1. Connect GitHub repository
2. Set environment variables:
   - `NEXT_PUBLIC_DEEPMICROPATH_API_URL`
   - `NEXT_PUBLIC_DEEPMICROPATH_API_KEY`
3. Deploy

## Localization

Supported languages:
- English (en)
- 简体中文 (cn)
- 繁體中文 (tw)
- 日本語 (ja)
- 한국어 (ko)
- And more...

Key translation files:
- `app/locales/en.ts` - English
- `app/locales/cn.ts` - Chinese (Simplified)

## Troubleshooting

### Connection Issues
```bash
# Check backend is running
curl http://localhost:8088/api/v1/health

# Verify CORS settings
# Check browser console for CORS errors
```

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules
yarn install
yarn dev
```

### Storage Issues
```bash
# Clear local storage
# In browser console:
localStorage.clear()
```

## API Integration

### Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/files/upload` | POST | Upload files |
| `/api/v1/inference/submit` | POST | Submit job |
| `/api/v1/inference/{job_id}` | GET | Check status |
| `/api/v1/inference/{job_id}/result` | GET | Get results |

### Response Format

```typescript
// Job Status
{
  job_id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  progress?: number;
}

// Job Result
{
  job_id: string;
  result: {
    prediction?: string;
    report?: object;
  };
  duration_seconds: number;
}
```

## Contributing

When contributing to EvidenceSeek:

1. Follow existing code structure
2. Update TypeScript types
3. Test with DeepMicroPath backend
4. Update documentation
5. Follow TDD principles from project rules

## License

Same as DeepMicroPath project (MIT)

## Support

- **Documentation**: `/docs` directory
- **Backend API**: DeepMicroPath API documentation
- **Issues**: GitHub repository
- **Community**: Project discussions

## Version

- **Current Version**: 1.0.0
- **Base**: NextChat (customized)
- **Backend**: DeepMicroPath API v1

## Links

- **Repository**: https://github.com/chenxingqiang/DeepMicroPath
- **Documentation**: See `/docs` directory
- **Backend Setup**: See main project README
- **Frontend Setup**: See `docs/FRONTEND_SETUP_GUIDE.md`

---

**EvidenceSeek** - Empowering microbiology research with AI 🧬
