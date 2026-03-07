# AI Video Intelligence Suite - CLI Tools

Command-line interface tools for batch video processing and knowledge base
generation. These tools complement the Chrome Extension for users who prefer
command-line workflows or need to process large video libraries.

## 🎯 Use Cases

- **Batch Processing**: Process hundreds of videos unattended
- **Server Deployment**: Run on cloud instances or home servers
- **CI/CD Integration**: Automated video processing pipelines
- **Power Users**: Advanced users who prefer CLI over GUI

## 📁 Tools

### Core Processing

| Tool                    | Purpose                                          | Command                                |
| ----------------------- | ------------------------------------------------ | -------------------------------------- |
| `batch-processor.js`    | Process videos in batches with resume capability | `node cli/batch-processor.js --resume` |
| `DirectAPIProcessor.js` | Direct Gemini API processor                      | `node cli/DirectAPIProcessor.js`       |
| `status.js`             | Check processing status and statistics           | `node cli/status.js`                   |

### Knowledge Base

| Tool                   | Purpose                              | Command                         |
| ---------------------- | ------------------------------------ | ------------------------------- |
| `generate-kb.js`       | Generate consolidated knowledge base | `node cli/generate-kb.js`       |
| `export-notebooklm.js` | Export videos for NotebookLM         | `node cli/export-notebooklm.js` |

## 🚀 Quick Start

### 1. Configure

Copy the example config and customize:

```bash
cp config.example.json config.json
```

Edit `config.json`:

```json
{
  "personalDataDir": "./data",
  "reportsDir": "./data/video-reports",
  "transcriptsDir": "./data/transcripts",
  "libraryFile": "./data/video-library/library.html",
  "consolidatedKB": "./data/consolidated_knowledge.md"
}
```

### 2. Set API Key

```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Run

```bash
# Check status
node cli/status.js

# Start processing
node cli/batch-processor.js --resume
```

## 💰 Costs

- Gemini 1.5 Flash: ~$0.0008 per video
- 1000 videos: ~$0.80
- 10000 videos: ~$8.00

---

_Part of AI Video Intelligence Suite_
