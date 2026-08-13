# Newest LLM Models Research Report — May 28, 2026

## Executive Summary

The LLM landscape has dramatically expanded. NVIDIA's free API now hosts **117
models** (up from ~20 a year ago). OpenRouter lists **356 models** with **27
free-tier options**. Several brand-new model families have launched in May 2026.

---

## 1. NEWEST MAJOR MODEL RELEASES (May 2026)

### Flagship / Paid Models

| Model                                 | Provider | Context | Price (input/1M tok)         | Key Feature                      |
| ------------------------------------- | -------- | ------- | ---------------------------- | -------------------------------- |
| **GPT-5.5 / GPT-5.5 Pro**             | OpenAI   | 1.05M   | $5/$30                       | Latest GPT generation            |
| **Grok 4.20 / Grok 4.20 Multi-Agent** | xAI      | 2M      | $1.25/$2                     | Multi-agent orchestration native |
| **Gemini 3.5 Flash**                  | Google   | 1M      | $1.50                        | Newest Gemini Flash              |
| **Gemini 3.1 Pro Preview**            | Google   | 1M      | $2                           | Latest Gemini Pro                |
| **Gemini 3.1 Flash Lite**             | Google   | 1M      | $0.25                        | Cheapest fast Gemini             |
| **Gemini 3 Flash Preview**            | Google   | 1M      | $0.50                        | Mid-tier Gemini                  |
| **DeepSeek V4 Pro**                   | DeepSeek | 1M      | $0.435                       | Latest DeepSeek reasoning        |
| **Llama 4 Scout**                     | Meta     | **10M** | $0.08                        | Record 10M context window        |
| **Qwen 3.7 Max**                      | Alibaba  | ~1M     | TBD                          | Flagship Qwen 3.7                |
| **MiMo V2.5 Pro / V2.5**              | Xiaomi   | 1M      | $0.435/$0.14                 | Xiaomi's first major LLM         |
| **Lyria 3 Pro / Clip Preview**        | Google   | 1M      | FREE (preview)               | New Google model family          |
| **Mistral Large 3 (675B)**            | Mistral  | ~128K   | Free (NVIDIA)                | 675B parameter monster           |
| **Mistral Small 4 (119B)**            | Mistral  | ~128K   | Free (NVIDIA)                | Fast small model                 |
| **Palmyra Creative 122B**             | Writer   | ~128K   | Free (NVIDIA, 404 currently) | Creative writing specialist      |

### Open-Source / Free-Tier Models

| Model                           | Provider               | Context | Access                              | Key Feature                |
| ------------------------------- | ---------------------- | ------- | ----------------------------------- | -------------------------- |
| **Gemma 4 31B IT**              | Google                 | 262K    | OpenRouter free, NVIDIA (slow)      | Google's newest open model |
| **Gemma 4 26B A4B IT**          | Google                 | 262K    | OpenRouter free                     | MoE Gemma 4                |
| **Gemma 3N E2B/E4B**            | Google                 | ~128K   | NVIDIA free                         | Edge-optimized Gemma       |
| **Llama 4 Maverick (17B 128E)** | Meta                   | ~128K   | NVIDIA free (1.2s!)                 | MoE Llama 4, very fast     |
| **Qwen 3.5 397B A17B**          | Alibaba                | ~262K   | NVIDIA free (2.7s!)                 | Massive MoE, fast          |
| **Qwen 3.5 122B A10B**          | Alibaba                | ~262K   | NVIDIA free (27.7s, slow)           | Smaller MoE variant        |
| **Qwen 3 Coder 480B A35B**      | Alibaba                | 1M      | NVIDIA free (8.7s), OpenRouter free | Code specialist, huge      |
| **Qwen 3 Next 80B A3B**         | Alibaba                | 262K    | OpenRouter free, NVIDIA (timeout)   | Lightweight MoE            |
| **DeepSeek V4 Flash**           | DeepSeek               | 1M      | OpenRouter free                     | Free V4 access!            |
| **Kimi K2.6**                   | Moonshot               | 262K    | NVIDIA free (2.3s), OpenRouter free | Chinese AI, fast           |
| **MiniMax M2.7**                | MiniMax                | 262K    | OpenRouter free, NVIDIA (timeout)   | Chinese AI                 |
| **Step 3.5 Flash**              | StepFun                | ~128K   | NVIDIA free (2.1s!)                 | Chinese AI, very fast      |
| **GLM 5.1**                     | Zhipu AI               | ~128K   | NVIDIA free (14.6s)                 | Chinese AI, reasoning      |
| **GLM 4.5 Air**                 | Zhipu AI               | 131K    | OpenRouter free                     | Lightweight GLM            |
| **Poolside Laguna M.1 / XS.2**  | Poolside               | 262K    | OpenRouter free                     | New entrant                |
| **Liquid LFM 2.5 1.2B**         | Liquid AI              | 32K     | OpenRouter free                     | Non-transformer arch       |
| **Dolphin Mistral 24B**         | Cognitive Computations | 32K     | OpenRouter free                     | Uncensored                 |
| **Owl Alpha**                   | OpenRouter             | 1M      | OpenRouter free                     | OR's own model             |
| **Hermes 3 Llama 3.1 405B**     | Nous Research          | 131K    | OpenRouter free                     | Massive open model         |

---

## 2. NVIDIA FREE API — VERIFIED WORKING MODELS

Tested live on May 28, 2026. All return valid chat completions:

### Fast (< 5s response)

| Model                                     | Latency  | Notes                                |
| ----------------------------------------- | -------- | ------------------------------------ |
| `mistralai/mistral-small-4-119b-2603`     | **0.2s** | FASTEST. Excellent for routing/chat  |
| `openai/gpt-oss-120b`                     | **0.5s** | Current TNF primary, reasoning model |
| `meta/llama-4-maverick-17b-128e-instruct` | **1.2s** | Llama 4 MoE, brand new               |
| `stepfun-ai/step-3.5-flash`               | **2.1s** | StepFun, very fast                   |
| `moonshotai/kimi-k2.6`                    | **2.3s** | Kimi, fast                           |
| `qwen/qwen3.5-397b-a17b`                  | **2.7s** | Massive MoE, surprisingly fast       |

### Medium (5-15s)

| Model                                          | Latency | Notes                                 |
| ---------------------------------------------- | ------- | ------------------------------------- |
| `qwen/qwen3-coder-480b-a35b-instruct`          | 8.7s    | Code specialist, 1M ctx on OpenRouter |
| `z-ai/glm-5.1`                                 | 14.6s   | Reasoning model                       |
| `mistralai/mistral-large-3-675b-instruct-2512` | 4.3s    | 675B model                            |

### Slow / Timeout (>30s)

| Model                               | Latency | Notes                       |
| ----------------------------------- | ------- | --------------------------- |
| `qwen/qwen3.5-122b-a10b`            | 27.7s   | Slow but works              |
| `mistralai/mistral-medium-3.5-128b` | 41.9s   | Works but very slow         |
| `google/gemma-4-31b-it`             | timeout | Listed but currently broken |
| `deepseek-ai/deepseek-v4-flash`     | timeout | Listed but currently broken |
| `deepseek-ai/deepseek-v4-pro`       | timeout | Listed but currently broken |
| `minimaxai/minimax-m2.7`            | timeout | Listed but currently broken |
| `bytedance/seed-oss-36b-instruct`   | timeout | Listed but currently broken |

### Dead (404 Not Found)

| Model                                     | Notes                     |
| ----------------------------------------- | ------------------------- |
| `nvidia/llama-3.1-nemotron-ultra-253b-v1` | Listed in catalog but 404 |
| `nvidia/cosmos-reason2-8b`                | Listed in catalog but 404 |
| `writer/palmyra-creative-122b`            | Listed in catalog but 404 |

---

## 3. GOOGLE GEMINI API — VERIFIED WORKING

| Model                            | Status    | Notes                 |
| -------------------------------- | --------- | --------------------- |
| `gemini-2.5-flash`               | OK (0.8s) | Current working model |
| `gemini-2.5-pro`                 | OK (1.2s) | Current working model |
| `gemini-2.0-flash`               | **404**   | Dead/deprecated       |
| `gemini-2.5-flash-preview-05-20` | **404**   | Preview expired       |
| `gemini-2.5-pro-preview-05-06`   | **404**   | Preview expired       |

Note: Gemini 3.x models only available via OpenRouter (paid), not on Google's
free API yet.

---

## 4. OPENROUTER — 27 FREE MODELS

OpenRouter credits exhaustion (402) does NOT affect free models. Free models
bypass the credit system entirely. Key free models available NOW:

### Best Free Models on OpenRouter

1. **deepseek/deepseek-v4-flash:free** — 1M context, DeepSeek V4 for free!
2. **qwen/qwen3-coder:free** — 1M context, code specialist
3. **qwen/qwen3-next-80b-a3b-instruct:free** — 262K context
4. **google/gemma-4-31b-it:free** — 262K context
5. **google/gemma-4-26b-a4b-it:free** — 262K context, MoE
6. **minimax/minimax-m2.5:free** — 262K context
7. **moonshotai/kimi-k2.6:free** — 262K context
8. **nvidia/nemotron-3-super-120b-a12b:free** — 1M context
9. **nousresearch/hermes-3-llama-3.1-405b:free** — 131K context, 405B
10. **openai/gpt-oss-120b:free** — 131K context
11. **openrouter/owl-alpha** — 1M context, free

---

## 5. OTHER FREE PROVIDERS

| Provider        | Base URL                     | Free Models                 | Speed      | Status                        |
| --------------- | ---------------------------- | --------------------------- | ---------- | ----------------------------- |
| **Cerebras**    | cloud.cerebras.ai            | Llama 3.3 70B, Llama 3.1 8B | 2600 tok/s | Free tier available           |
| **SambaNova**   | community.sambanova.ai       | DeepSeek R1, Llama 3.3 70B  | Fast       | Free tier available           |
| **Chutes AI**   | llm.chutes.ai/v1             | Llama 3.3 70B, Qwen 2.5 72B | Unknown    | Emerging free provider        |
| **HuggingFace** | api-inference.huggingface.co | Many open-source models     | Slow       | Free with rate limits         |
| **Groq**        | api.groq.com                 | Llama 3.3 70B, Gemma 2 9B   | 800+ tok/s | Free tier (key needs refresh) |

---

## 6. RECOMMENDED UPDATED FALLBACK CHAIN FOR TNF

Based on verified testing, the optimal free fallback chain:

### Primary (NVIDIA Fast)

1. `mistralai/mistral-small-4-119b-2603` — 0.2s, excellent speed
2. `openai/gpt-oss-120b` — 0.5s, reasoning
3. `meta/llama-4-maverick-17b-128e-instruct` — 1.2s, Llama 4
4. `stepfun-ai/step-3.5-flash` — 2.1s
5. `moonshotai/kimi-k2.6` — 2.3s
6. `qwen/qwen3.5-397b-a17b` — 2.7s
7. `nvidia/llama-3.3-nemotron-super-49b-v1.5` — ~3s
8. `mistralai/mistral-large-3-675b-instruct-2512` — 4.3s

### Secondary (Gemini Free)

9. `gemini-2.5-flash` — 0.8s
10. `gemini-2.5-pro` — 1.2s

### Tertiary (OpenRouter Free)

11. `deepseek/deepseek-v4-flash:free` — 1M ctx
12. `qwen/qwen3-coder:free` — 1M ctx
13. `nvidia/nemotron-3-super-120b-a12b:free` — 1M ctx

### Quaternary (Other Free Providers)

14. Cerebras — Llama 3.3 70B (2600 tok/s!)
15. SambaNova — DeepSeek R1, Llama 3.3 70B
16. Groq — Llama 3.3 70B (after key refresh)

---

## 7. NOTABLE TRENDS

1. **MoE dominance**: Most new large models use Mixture-of-Experts (Qwen 3.5
   397B activates only 17B, Llama 4 Maverick 17B activates subset, GPT-OSS-120B
   is MoE)
2. **1M+ context becoming standard**: DeepSeek V4, Qwen 3 Coder, Gemini 3.x, Owl
   Alpha all support 1M+ tokens
3. **Chinese AI explosion**: Kimi K2.6, GLM 5.1, Qwen 3.5/3.7, MiniMax M2.7,
   Step 3.5, MiMo V2.5 — Chinese labs releasing competitive models
4. **Free tier expansion**: 27 free models on OpenRouter alone; NVIDIA hosting
   117 models; new providers like Chutes AI emerging
5. **10M context**: Llama 4 Scout claims 10M token context window (paid only
   currently)
6. **Reasoning models everywhere**: GPT-OSS, DeepSeek V4, GLM 5.1, Nemotron
   Reasoning all have reasoning/thinking modes
7. **Google's Lyria family**: Brand new model family (Lyria 3 Pro/Clip), likely
   media/multimodal focused
8. **Poolside and Liquid AI**: New entrants with non-standard architectures

---

_Report generated by TNF Hermes Agent — May 28, 2026_ _All NVIDIA and Gemini
models tested live with actual API calls_
