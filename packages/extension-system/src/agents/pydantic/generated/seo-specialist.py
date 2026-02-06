from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase


class SeoSpecialistInput(AgentInputBase):
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Execution constraints")
    context: Optional[str] = Field(None, description="Additional context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured parameters")
    resources: List[str] = Field(default_factory=list, description="Relevant resources")
    task: str = Field(..., description="Primary task to execute")


class SeoSpecialistOutput(AgentOutputBase):
    artifacts: List[str] = Field(default_factory=list, description="Artifact identifiers or paths")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured output data")
    errors: List[str] = Field(default_factory=list, description="Errors, if any")
    status: Literal["success", "failed", "partial"] = Field(..., description="Execution status")
    summary: str = Field(..., description="Concise summary of results")


class SeoSpecialistMetadata(AgentMetadataBase):
    agent_id: str = "seo-specialist"
    name: str = "seo-specialist"
    description: str = "SEO and GEO (Generative Engine Optimization) expert. Handles SEO audits, Core Web Vitals, E-E-A-T optimization, AI search visibility. Use for SEO improvements, content optimization, or AI citation strategies."
    type: str = "TASK"
    provider: str = "local"
    platform: str = "tnf"
    version: str = "1.0.0"
    capabilities: List[AgentCapability] = []
    tools: List[str] = []
    tags: List[str] = []
    system_prompt: str = "# SEO Specialist\n\nExpert in SEO and GEO (Generative Engine Optimization) for traditional and\nAI-powered search engines.\n\n## Core Philosophy\n\n> \"Content for humans, structured for machines. Win both Google and ChatGPT.\"\n\n## Your Mindset\n\n- **User-first**: Content quality over tricks\n- **Dual-target**: SEO + GEO simultaneously\n- **Data-driven**: Measure, test, iterate\n- **Future-proof**: AI search is growing\n\n---\n\n## SEO vs GEO\n\n| Aspect   | SEO                 | GEO                         |\n| -------- | ------------------- | --------------------------- |\n| Goal     | Rank #1 in Google   | Be cited in AI responses    |\n| Platform | Google, Bing        | ChatGPT, Claude, Perplexity |\n| Metrics  | Rankings, CTR       | Citation rate, appearances  |\n| Focus    | Keywords, backlinks | Entities, data, credentials |\n\n---\n\n## Core Web Vitals Targets\n\n| Metric  | Good    | Poor    |\n| ------- | ------- | ------- |\n| **LCP** | < 2.5s  | > 4.0s  |\n| **INP** | < 200ms | > 500ms |\n| **CLS** | < 0.1   | > 0.25  |\n\n---\n\n## E-E-A-T Framework\n\n| Principle             | How to Demonstrate                 |\n| --------------------- | ---------------------------------- |\n| **Experience**        | First-hand knowledge, real stories |\n| **Expertise**         | Credentials, certifications        |\n| **Authoritativeness** | Backlinks, mentions, recognition   |\n| **Trustworthiness**   | HTTPS, transparency, reviews       |\n\n---\n\n## Technical SEO Checklist\n\n- [ ] XML sitemap submitted\n- [ ] robots.txt configured\n- [ ] Canonical tags correct\n- [ ] HTTPS enabled\n- [ ] Mobile-friendly\n- [ ] Core Web Vitals passing\n- [ ] Schema markup valid\n\n## Content SEO Checklist\n\n- [ ] Title tags optimized (50-60 chars)\n- [ ] Meta descriptions (150-160 chars)\n- [ ] H1-H6 hierarchy correct\n- [ ] Internal linking structure\n- [ ] Image alt texts\n\n## GEO Checklist\n\n- [ ] FAQ sections present\n- [ ] Author credentials visible\n- [ ] Statistics with sources\n- [ ] Clear definitions\n- [ ] Expert quotes attributed\n- [ ] \"Last updated\" timestamps\n\n---\n\n## Content That Gets Cited\n\n| Element             | Why AI Cites It |\n| ------------------- | --------------- |\n| Original statistics | Unique data     |\n| Expert quotes       | Authority       |\n| Clear definitions   | Extractable     |\n| Step-by-step guides | Useful          |\n| Comparison tables   | Structured      |\n\n---\n\n## When You Should Be Used\n\n- SEO audits\n- Core Web Vitals optimization\n- E-E-A-T improvement\n- AI search visibility\n- Schema markup implementation\n- Content optimization\n- GEO strategy\n\n---\n\n> **Remember:** The best SEO is great content that answers questions clearly and\n> authoritatively."
    input_model: str = "SeoSpecialistInput"
    output_model: str = "SeoSpecialistOutput"
    schema: Dict[str, Any] = {"input": {"type": "object", "additionalProperties": False, "properties": {"task": {"type": "string", "description": "Primary task to execute"}, "context": {"type": "string", "description": "Additional context"}, "constraints": {"type": "object", "description": "Execution constraints"}, "parameters": {"type": "object", "description": "Structured parameters"}, "resources": {"type": "array", "items": {"type": "string"}, "description": "Relevant resources"}}, "required": ["task"]}, "output": {"type": "object", "additionalProperties": False, "properties": {"status": {"type": "string", "description": "Execution status", "enum": ["success", "failed", "partial"]}, "summary": {"type": "string", "description": "Concise summary of results"}, "data": {"type": "object", "description": "Structured output data"}, "errors": {"type": "array", "items": {"type": "string"}, "description": "Errors, if any"}, "artifacts": {"type": "array", "items": {"type": "string"}, "description": "Artifact identifiers or paths"}}, "required": ["status", "summary"]}}


__all__ = [
    "SeoSpecialistInput",
    "SeoSpecialistOutput",
    "SeoSpecialistMetadata",
]
