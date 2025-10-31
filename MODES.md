# DeepMicroPath Modes Guide

## Overview

DeepMicroPath supports four inference modes, each optimized for different types of tasks:

1. **Auto Mode** - Automatic mode detection
2. **Chat Mode** - Interactive conversational assistance
3. **Deep Research Mode** - Comprehensive research and analysis
4. **Microbiology Report Mode** - Specialized microbiology data analysis

## Mode Details

### 1. Auto Mode (`deepmicropath-auto`)

**Model ID**: `deepmicropath-auto`  
**Backend Mode**: `auto`

**Description**: Automatically detects the appropriate mode based on your question content.

**When to Use**:
- You're not sure which mode to use
- You want the system to automatically choose the best approach
- Your task is straightforward and doesn't require specific expertise

**Detection Logic**:
- Microbiology keywords (微生物, gpas, bacteria, etc.) → Microbiology Report Mode
- Research keywords (research, analysis, study, etc.) → Deep Research Mode
- Default → Chat Mode

**Example Questions**:
```
"Analyze this result_table.csv file"  → Microbiology Report
"What is the capital of France?"      → Chat
"Research the effects of climate change" → Deep Research
```

---

### 2. Chat Mode (`deepmicropath-chat`)

**Model ID**: `deepmicropath-chat`  
**Backend Mode**: `chat`

**Description**: Interactive conversational AI assistant for general questions and quick responses.

**Best For**:
- General Q&A
- Quick information lookup
- Conversational interactions
- Simple explanations
- Code snippets
- Brief answers

**Characteristics**:
- ⚡ Fast responses
- 💬 Conversational tone
- 📝 Concise answers
- 🎯 Direct and clear

**Example Use Cases**:
```
✓ "How do I install Python packages?"
✓ "Explain what is DNA in simple terms"
✓ "Write a function to calculate fibonacci numbers"
✓ "What's the difference between bacteria and virus?"
✓ "Translate this text to English"
```

**Not Suitable For**:
```
✗ In-depth research papers
✗ Complex microbiology data analysis
✗ Multi-step analysis with citations
✗ Professional medical reports
```

---

### 3. Deep Research Mode (`deepmicropath-deepresearch`)

**Model ID**: `deepmicropath-deepresearch`  
**Backend Mode**: `deepresearch`

**Description**: Comprehensive research assistant with deep analysis, citations, and evidence-based reasoning.

**Best For**:
- Academic research
- In-depth analysis
- Literature review
- Complex problem-solving
- Evidence-based arguments
- Multi-perspective analysis

**Characteristics**:
- 🔬 Comprehensive analysis
- 📚 Evidence and citations
- 🎓 Academic rigor
- 🔍 Deep investigation
- 📊 Data-driven insights

**Example Use Cases**:
```
✓ "Research the latest advances in CRISPR gene editing"
✓ "Analyze the economic impact of renewable energy adoption"
✓ "Investigate the relationship between gut microbiome and mental health"
✓ "Compare different machine learning algorithms for image classification"
✓ "Study the historical development of antibiotics"
```

**Output Style**:
- Detailed explanations
- Supporting evidence
- Multiple viewpoints
- Structured analysis
- References and citations

**Time**: ⏱️ Longer response time (more thorough)

---

### 4. Microbiology Report Mode (`deepmicropath-microbiology-report`)

**Model ID**: `deepmicropath-microbiology-report`  
**Backend Mode**: `microbiology-report`

**Description**: Specialized for GPAS microbiology data analysis and professional medical report generation.

**Best For**:
- GPAS result interpretation
- Microbiology data analysis
- Clinical report generation
- Pathogen identification
- Microbiome composition analysis
- Medical recommendations

**Characteristics**:
- 🔬 Clinical expertise
- 🏥 Medical terminology
- 📋 Structured reports
- ⚕️ Professional insights
- 🧬 Microbiology focus

**Input Data Formats**:
- `result_table.csv` - GPAS output files
- Microbiology images (microscopy, culture plates)
- Clinical sample data
- Sequencing results

**Example Use Cases**:
```
✓ "Analyze this GPAS result_table.csv and generate a clinical report"
✓ "Interpret the microbial composition of this gut microbiome sample"
✓ "Identify potential pathogens in this result"
✓ "What are the clinical implications of these bacteria findings?"
✓ "Generate a patient report from this microbiological data"
```

**Report Structure**:
1. **Sample Information** (样本信息)
2. **Microbial Community Analysis** (微生物群落分析)
3. **Clinical Significance** (临床意义解读)
4. **Health Recommendations** (健康建议)
5. **References** (参考文献)

**Time**: ⏱️ Medium to long (comprehensive analysis)

---

## Mode Comparison Table

| Feature | Auto | Chat | Deep Research | Microbiology Report |
|---------|------|------|---------------|---------------------|
| **Response Speed** | Fast-Medium | Fast | Slow | Medium-Slow |
| **Depth** | Variable | Shallow | Deep | Specialized |
| **Citations** | Auto | No | Yes | Yes |
| **Medical Focus** | Auto | No | No | Yes |
| **File Analysis** | Auto | Limited | Yes | Specialized |
| **Best Use** | Unsure | Quick Q&A | Research | Medical Data |

---

## Switching Between Modes

### In the Frontend UI:

1. Open model selector dropdown
2. Choose your desired mode:
   - DeepMicroPath (Auto Mode)
   - DeepMicroPath (Chat Mode) ⭐ **Default**
   - DeepMicroPath (Deep Research)
   - DeepMicroPath (Microbiology Report)

### Via API:

```bash
# Chat mode
curl -X POST http://172.20.1.38:8000/api/v1/inference/submit \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "chat",
    "question": "What is DNA?"
  }'

# Deep research mode
curl -X POST http://172.20.1.38:8000/api/v1/inference/submit \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "deepresearch",
    "question": "Research the latest CRISPR developments"
  }'

# Microbiology report mode
curl -X POST http://172.20.1.38:8000/api/v1/inference/submit \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "microbiology-report",
    "question": "Analyze result_table.csv",
    "input_files": ["result_table.csv"]
  }'
```

---

## Configuration

### Environment Variables

```bash
# Default mode for new chats
DEFAULT_MODEL=deepmicropath-chat

# Or use auto mode to let system decide
DEFAULT_MODEL=deepmicropath-auto
```

### Frontend Code

```typescript
// In chat options
const chatOptions = {
  config: {
    model: "deepmicropath-chat",  // or other modes
    providerName: "DeepMicroPath",
    temperature: 0.5,
  }
};
```

---

## Mode Selection Tips

### Choose **Chat Mode** when:
- ✓ You need a quick answer
- ✓ Question is straightforward
- ✓ No deep analysis needed
- ✓ Conversational context

### Choose **Deep Research Mode** when:
- ✓ Need comprehensive analysis
- ✓ Want evidence and citations
- ✓ Academic or professional work
- ✓ Complex problem requiring research

### Choose **Microbiology Report Mode** when:
- ✓ Analyzing GPAS data
- ✓ Need clinical interpretation
- ✓ Generating medical reports
- ✓ Microbiology-specific questions

### Choose **Auto Mode** when:
- ✓ Unsure which mode to use
- ✓ Want system to decide
- ✓ Testing different approaches

---

## Backend Implementation

The modes are implemented in:

1. **Frontend**: `/app/client/platforms/deepmicropath.ts`
   - Model definitions
   - Mode extraction from model name
   - Request formatting

2. **Backend API**: `/api/services/inference_service.py`
   - Mode-specific system prompts
   - Auto-detection logic
   - Specialized processing

3. **Inference Engine**: `/inference/react_agent_wrapper.py`
   - Prompt selection
   - Mode-based reasoning
   - Tool selection

---

## Future Modes (Planned)

- **Image Analysis Mode**: Specialized for microscopy image analysis
- **Drug Discovery Mode**: Pharmaceutical research and drug interaction
- **Genomics Mode**: Genome sequencing and annotation
- **Clinical Decision Support**: AI-assisted medical decision making

---

## Troubleshooting

### Wrong Mode Selected Automatically?
- Use explicit mode instead of `auto`
- Check for typos in question keywords
- Switch to desired mode manually

### Results Not as Expected?
- Try a different mode
- Rephrase your question
- Provide more context in prompt

### Mode Not Available?
- Check frontend configuration
- Verify backend support
- Restart services

---

## References

- [Integration Guide](./DEEPMICROPATH_INTEGRATION.md)
- [API Documentation](http://172.20.1.38:8000/docs)
- [Backend Source](../inference/react_agent_wrapper.py)
