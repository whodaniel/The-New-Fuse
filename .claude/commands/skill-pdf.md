---
description:
  "Use Claude's PDF skill for comprehensive PDF manipulation and processing"
category: 'claude-skills'
---

Activate Claude's PDF skill for comprehensive PDF manipulation including text
extraction, table extraction, merging, splitting, and form filling.

**Skill**: pdf (from Anthropic's skills repository)

**Capabilities**:

- Extract text and tables from PDFs
- Create new PDFs programmatically
- Merge and split PDF documents
- Fill PDF forms
- Extract metadata and annotations
- Rotate and manipulate pages

**Example Usage**:

```
/skill-pdf extract text from document.pdf
/skill-pdf fill the form at /path/to/form.pdf with the following data: name="John Doe", email="john@example.com"
/skill-pdf merge doc1.pdf and doc2.pdf into merged.pdf
/skill-pdf extract all tables from report.pdf to CSV
```

**Parameters**: $ARGUMENTS (natural language description of PDF task)

The skill will be loaded and its instructions will guide the execution of your
PDF-related tasks using Python libraries like pypdf, pdfplumber, and reportlab.
