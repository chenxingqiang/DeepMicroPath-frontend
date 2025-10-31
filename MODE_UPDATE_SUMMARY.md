# DeepMicroPath Mode Update Summary

## Update Date
2025-10-28

## Changes Overview

Updated DeepMicroPath frontend and backend to support three primary modes plus auto-detection:
- **Chat Mode** (chat)
- **Deep Research Mode** (deepresearch) 
- **Microbiology Report Mode** (microbiology-report)
- **Auto Mode** (auto) - auto-detection

## Files Modified

### Frontend Changes

#### 1. **Constants** (`app/constant.ts`)
```typescript
const deepmicropathModels = [
  "deepmicropath-auto",
  "deepmicropath-chat",              // NEW
  "deepmicropath-deepresearch",      // NEW
  "deepmicropath-microbiology-report", // NEW (renamed from microbiology)
];
```

#### 2. **DeepMicroPath API Client** (`app/client/platforms/deepmicropath.ts`)

**Updated Interface:**
```typescript
export interface InferenceRequest {
  mode: "auto" | "chat" | "deepresearch" | "microbiology-report";
  // ...
}
```

**Added Mode Detection:**
```typescript
// Extract mode from model name
let mode = "auto";
const modelName = options.config.model;
if (modelName.includes("chat")) {
  mode = "chat";
} else if (modelName.includes("deepresearch")) {
  mode = "deepresearch";
} else if (modelName.includes("microbiology")) {
  mode = "microbiology-report";
}
```

**Updated Model List:**
```typescript
async models(): Promise<LLMModel[]> {
  return [
    { name: "deepmicropath-auto", ... },
    { name: "deepmicropath-chat", ... },         // NEW
    { name: "deepmicropath-deepresearch", ... }, // NEW
    { name: "deepmicropath-microbiology-report", ... }, // NEW
  ];
}
```

#### 3. **Configuration** (`app/store/config.ts`)
```typescript
modelConfig: {
  model: "deepmicropath-chat" as ModelType,  // Changed from auto
  providerName: "DeepMicroPath" as ServiceProvider,
}
```

#### 4. **Environment Variables** (`.env.local`)
```bash
NEXT_PUBLIC_DEFAULT_MODEL=deepmicropath-chat  # Changed from auto
DEFAULT_MODEL=deepmicropath-chat
```

### Backend Changes

#### 5. **API Schema** (`api/routers/inference.py`)
```python
class InferenceSubmitRequest(BaseModel):
    mode: str = Field(
        default="auto",
        description="Inference mode: auto (auto-detect), chat (interactive), "
                   "deepresearch (deep analysis), or microbiology-report "
                   "(microbiology report generation)"
    )
```

#### 6. **Inference Service** (`api/services/inference_service.py`)

**Added Mode-Specific Prompts:**
```python
if job.mode == "chat":
    system_prompt = "You are a helpful AI assistant..."
elif job.mode == "deepresearch":
    system_prompt = "You are an expert research assistant..."
elif job.mode == "microbiology-report":
    system_prompt = "You are a clinical microbiology expert..."
elif job.mode == "auto":
    # Auto-detect based on question content
    question_lower = job.question.lower()
    if any(kw in question_lower for kw in ['微生物', 'gpas', ...]):
        # Use microbiology mode
    elif any(kw in question_lower for kw in ['research', ...]):
        # Use deepresearch mode
    else:
        # Use chat mode
```

### Documentation

#### 7. **Integration Guide** (`DEEPMICROPATH_INTEGRATION.md`)
- Updated available models section
- Updated default model to `deepmicropath-chat`
- Updated mode descriptions

#### 8. **Modes Guide** (`MODES.md`) - NEW
- Comprehensive guide to all four modes
- Use cases and examples
- Mode comparison table
- Switching instructions
- API examples

## Mode Descriptions

### 1. Auto Mode
- **Model**: `deepmicropath-auto`
- **Backend**: `auto`
- **Purpose**: Automatically detect the best mode based on question content
- **Default Behavior**: Falls back to chat mode if uncertain

### 2. Chat Mode ⭐ **NEW DEFAULT**
- **Model**: `deepmicropath-chat`
- **Backend**: `chat`
- **Purpose**: Interactive conversational assistance
- **Use Cases**: General Q&A, quick responses, simple explanations

### 3. Deep Research Mode
- **Model**: `deepmicropath-deepresearch`
- **Backend**: `deepresearch`
- **Purpose**: Comprehensive research with citations
- **Use Cases**: Academic research, in-depth analysis, literature review

### 4. Microbiology Report Mode
- **Model**: `deepmicropath-microbiology-report`
- **Backend**: `microbiology-report`
- **Purpose**: GPAS data analysis and medical report generation
- **Use Cases**: Clinical microbiology, pathogen identification, medical reports

## Default Mode Change

**Previous**: `deepmicropath-auto`  
**Current**: `deepmicropath-chat`

**Reason**: Chat mode provides better user experience for general interactions while still allowing users to explicitly choose other modes when needed.

## API Compatibility

### Request Format
```bash
POST /api/v1/inference/submit
{
  "mode": "chat" | "deepresearch" | "microbiology-report" | "auto",
  "question": "...",
  "input_files": [...],
  "parameters": {...}
}
```

### Backward Compatibility
- Old mode names are NOT supported (breaking change)
- `"default"` → should use `"chat"` or `"auto"`
- `"microbiology"` → should use `"microbiology-report"`

## Testing Checklist

- [ ] Frontend model selection shows all 4 modes
- [ ] Default model is set to `deepmicropath-chat`
- [ ] Mode detection works correctly in auto mode
- [ ] Chat mode returns conversational responses
- [ ] Deep research mode provides detailed analysis
- [ ] Microbiology report mode generates structured reports
- [ ] API accepts all mode values
- [ ] Backend prompts are mode-specific
- [ ] Mode switching works in UI
- [ ] Environment variables are correctly configured

## Migration Guide

### For Frontend Users:
1. Clear browser localStorage: `localStorage.clear()`
2. Refresh the page
3. Default model will now be "DeepMicroPath (Chat Mode)"
4. Select other modes from dropdown as needed

### For API Users:
Update your API calls:
```bash
# Old (will fail)
{"mode": "default"}
{"mode": "microbiology"}

# New
{"mode": "chat"}
{"mode": "microbiology-report"}
```

### For Developers:
1. Pull latest changes
2. Update `.env.local`:
   ```bash
   DEFAULT_MODEL=deepmicropath-chat
   ```
3. Restart frontend: `npm run dev`
4. Restart backend: `uvicorn api.main:app --reload`

## Next Steps

1. **Test all modes** with various inputs
2. **Update user documentation** 
3. **Create mode selection UI improvements**
4. **Add mode icons/indicators** in chat interface
5. **Implement mode-specific styling**
6. **Add mode switching shortcuts**
7. **Create mode usage analytics**

## Known Issues

None reported yet.

## Future Enhancements

1. **Per-chat mode memory**: Remember selected mode for each chat session
2. **Mode recommendation**: Suggest mode based on input
3. **Hybrid modes**: Combine strengths of multiple modes
4. **Custom modes**: Allow users to create custom mode configurations
5. **Mode presets**: Pre-configured modes for specific domains

## References

- [Modes Guide](./MODES.md)
- [Integration Guide](./DEEPMICROPATH_INTEGRATION.md)
- [Backend Code](../api/services/inference_service.py)
- [Frontend Code](./app/client/platforms/deepmicropath.ts)
