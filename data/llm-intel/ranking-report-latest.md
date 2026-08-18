# LLM Ranking Report
Generated: 2026-08-13T16:30:02.853Z
Intel Snapshot: intel_1786636805079

## Summary

| Metric | Value |
|--------|-------|
| Models Scored | 37 |
| Live on NVIDIA | 1 |
| Recommendations | 125 |
| Add New | 0 |
| Reorder | 5 |
| Remove EOL | 19 |
| Demote Unranked | 101 |

## Composite Rankings

| Rank | Model | Arena Score | Health | Latency |
|------|-------|-------------|--------|---------|
| 1 | `openai/gpt-oss-20b` | - | live | 325ms |
| 2 | `meta/llama-3.3-70b-instruct` | - | timeout | - |
| 3 | `meta/llama-3.2-90b-vision-instruct` | - | timeout | - |
| 4 | `meta/llama-guard-4-12b` | - | timeout | - |
| 5 | `openai/gpt-oss-120b` | - | timeout | - |
| 6 | `z-ai/glm-5.1` | - | eol | - |
| 7 | `moonshotai/kimi-k2.6` | - | error | - |
| 8 | `minimaxai/minimax-m2.7` | - | eol | - |
| 9 | `minimaxai/minimax-m2.5` | - | eol | - |
| 10 | `deepseek-ai/deepseek-v4-flash` | - | eol | - |
| 11 | `deepseek-ai/deepseek-v4-pro` | - | eol | - |
| 12 | `qwen/qwen3.5-397b-a17b` | - | eol | - |
| 13 | `qwen/qwen3.5-122b-a10b` | - | eol | - |
| 14 | `mistralai/mistral-large-3-675b-instruct-2512` | - | eol | - |
| 15 | `mistralai/mistral-medium-3.5-128b` | - | eol | - |
| 16 | `mistralai/devstral-2-123b-instruct-2512` | - | error | - |
| 17 | `mistralai/mistral-small-4-119b-2603` | - | eol | - |
| 18 | `mistralai/magistral-small-2506` | - | error | - |
| 19 | `mistralai/ministral-14b-instruct-2512` | - | eol | - |
| 20 | `google/gemma-3n-e4b-it` | - | eol | - |
| 21 | `google/gemma-3-27b-it` | - | eol | - |
| 22 | `meta/llama-4-maverick-17b-128e-instruct` | - | eol | - |
| 23 | `meta/llama-3.1-405b-instruct` | - | error | - |
| 24 | `microsoft/phi-4-multimodal-instruct` | - | eol | - |
| 25 | `microsoft/phi-4-mini-instruct` | - | eol | - |
| 26 | `bytedance/seed-oss-36b-instruct` | - | eol | - |
| 27 | `stockmark/stockmark-2-100b-instruct` | - | eol | - |
| 28 | `abacusai/dracarys-llama-3.1-70b-instruct` | - | eol | - |
| 29 | `google/gemma-4-31b-it` | - | error | - |
| 30 | `moonshotai/kimi-k2-instruct-0905` | - | error | - |

## Recommendations

| Action | Model | Current | Proposed | Reason |
|--------|-------|---------|----------|--------|
| remove-eol | `qwen/qwen3-next-80b-a3b-instruct` | 19 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `qwen/qwen3-coder-480b-a35b-instruct` | 25 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `abacusai/dracarys-llama-3.1-70b-instruct` | 55 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `google/gemma-3n-e4b-it` | 89 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `mistralai/ministral-14b-instruct-2512` | 129 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `stockmark/stockmark-2-100b-instruct` | 229 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `bytedance/seed-oss-36b-instruct` | 241 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `deepseek-ai/deepseek-v4-flash` | 9000 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `mistralai/mistral-medium-3.5-128b` | 9001 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `deepseek-ai/deepseek-v4-pro` | 9002 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `qwen/qwen3.5-122b-a10b` | 27037 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `microsoft/phi-4-mini-instruct` | 27123 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `microsoft/phi-4-multimodal-instruct` | 27125 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `mistralai/mistral-small-4-119b-2603` | 45021 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `minimaxai/minimax-m2.7` | 45247 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `qwen/qwen3.5-397b-a17b` | 54006 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `z-ai/glm-5.1` | 54010 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `meta/llama-4-maverick-17b-128e-instruct` | 54011 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| remove-eol | `mistralai/mistral-large-3-675b-instruct-2512` | 63007 | - | Model has reached end-of-life on NVIDIA NGC (HTTP 410) |
| reorder | `openai/gpt-oss-20b` | 253 | 0 | Arena score change suggests priority shift of 253 positions |
| reorder | `meta/llama-3.3-70b-instruct` | 245 | 1 | Arena score change suggests priority shift of 244 positions |
| reorder | `meta/llama-3.2-90b-vision-instruct` | 111 | 2 | Arena score change suggests priority shift of 109 positions |
| reorder | `meta/llama-guard-4-12b` | 113 | 3 | Arena score change suggests priority shift of 110 positions |
| reorder | `openai/gpt-oss-120b` | 17 | 4 | Arena score change suggests priority shift of 13 positions |
| demote | `nvidia/nemotron-3-ultra-550b-a55b` | 0 | - | Model not found in arena rankings; consider demoting |
| demote | `google/gemma-4-31b-it` | 1 | - | Model not found in arena rankings; consider demoting |
| demote | `z-ai/glm-5.2` | 2 | - | Model not found in arena rankings; consider demoting |
| demote | `minimaxai/minimax-m3` | 3 | - | Model not found in arena rankings; consider demoting |
| demote | `moonshotai/kimi-k2.6` | 4 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nemotron-3-super-120b-a12b` | 8 | - | Model not found in arena rankings; consider demoting |
| demote | `thinkingmachines/inkling` | 9 | - | Model not found in arena rankings; consider demoting |
| demote | `stepfun-ai/step-3.7-flash` | 13 | - | Model not found in arena rankings; consider demoting |
| demote | `meta/llama-3.2-11b-vision-instruct` | 15 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-3.3-nemotron-super-49b-v1.5` | 29 | - | Model not found in arena rankings; consider demoting |
| demote | `01-ai/yi-large` | 53 | - | Model not found in arena rankings; consider demoting |
| demote | `adept/fuyu-8b` | 57 | - | Model not found in arena rankings; consider demoting |
| demote | `ai21labs/jamba-1.5-large-instruct` | 59 | - | Model not found in arena rankings; consider demoting |
| demote | `aisingapore/sea-lion-7b-instruct` | 61 | - | Model not found in arena rankings; consider demoting |
| demote | `baai/bge-m3` | 63 | - | Model not found in arena rankings; consider demoting |
| demote | `bigcode/starcoder2-15b` | 65 | - | Model not found in arena rankings; consider demoting |
| demote | `databricks/dbrx-instruct` | 67 | - | Model not found in arena rankings; consider demoting |
| demote | `deepseek-ai/deepseek-coder-6.7b-instruct` | 69 | - | Model not found in arena rankings; consider demoting |
| demote | `google/codegemma-1.1-7b` | 71 | - | Model not found in arena rankings; consider demoting |
| demote | `google/codegemma-7b` | 73 | - | Model not found in arena rankings; consider demoting |
| demote | `google/deplot` | 75 | - | Model not found in arena rankings; consider demoting |
| demote | `google/diffusiongemma-26b-a4b-it` | 77 | - | Model not found in arena rankings; consider demoting |
| demote | `google/gemma-2-2b-it` | 79 | - | Model not found in arena rankings; consider demoting |
| demote | `google/gemma-2b` | 81 | - | Model not found in arena rankings; consider demoting |
| demote | `google/gemma-3-12b-it` | 83 | - | Model not found in arena rankings; consider demoting |
| demote | `google/gemma-3-4b-it` | 85 | - | Model not found in arena rankings; consider demoting |
| demote | `google/gemma-3n-e2b-it` | 87 | - | Model not found in arena rankings; consider demoting |
| demote | `google/recurrentgemma-2b` | 91 | - | Model not found in arena rankings; consider demoting |
| demote | `ibm/granite-3.0-3b-a800m-instruct` | 93 | - | Model not found in arena rankings; consider demoting |
| demote | `ibm/granite-3.0-8b-instruct` | 95 | - | Model not found in arena rankings; consider demoting |
| demote | `ibm/granite-34b-code-instruct` | 97 | - | Model not found in arena rankings; consider demoting |
| demote | `ibm/granite-8b-code-instruct` | 99 | - | Model not found in arena rankings; consider demoting |
| demote | `meta/codellama-70b` | 101 | - | Model not found in arena rankings; consider demoting |
| demote | `meta/llama-3.1-70b-instruct` | 103 | - | Model not found in arena rankings; consider demoting |
| demote | `meta/llama-3.1-8b-instruct` | 105 | - | Model not found in arena rankings; consider demoting |
| demote | `meta/llama-3.2-1b-instruct` | 107 | - | Model not found in arena rankings; consider demoting |
| demote | `meta/llama-3.2-3b-instruct` | 109 | - | Model not found in arena rankings; consider demoting |
| demote | `meta/llama2-70b` | 115 | - | Model not found in arena rankings; consider demoting |
| demote | `microsoft/kosmos-2` | 117 | - | Model not found in arena rankings; consider demoting |
| demote | `microsoft/phi-3-vision-128k-instruct` | 119 | - | Model not found in arena rankings; consider demoting |
| demote | `microsoft/phi-3.5-moe-instruct` | 121 | - | Model not found in arena rankings; consider demoting |
| demote | `mistralai/codestral-22b-instruct-v0.1` | 127 | - | Model not found in arena rankings; consider demoting |
| demote | `mistralai/mistral-7b-instruct-v0.3` | 131 | - | Model not found in arena rankings; consider demoting |
| demote | `mistralai/mistral-large` | 133 | - | Model not found in arena rankings; consider demoting |
| demote | `mistralai/mistral-large-2-instruct` | 135 | - | Model not found in arena rankings; consider demoting |
| demote | `mistralai/mistral-nemotron` | 137 | - | Model not found in arena rankings; consider demoting |
| demote | `mistralai/mixtral-8x22b-v0.1` | 139 | - | Model not found in arena rankings; consider demoting |
| demote | `mistralai/mixtral-8x7b-instruct-v0.1` | 141 | - | Model not found in arena rankings; consider demoting |
| demote | `nv-mistralai/mistral-nemo-12b-instruct` | 143 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/ai-synthetic-video-detector` | 145 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/embed-qa-4` | 147 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/gliner-pii` | 149 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/ising-calibration-1-35b-a3b` | 151 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-3.1-nemoguard-8b-content-safety` | 153 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-3.1-nemoguard-8b-topic-control` | 155 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-3.1-nemotron-51b-instruct` | 157 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-3.1-nemotron-70b-instruct` | 159 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-3.1-nemotron-nano-8b-v1` | 161 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-3.1-nemotron-nano-vl-8b-v1` | 163 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-3.1-nemotron-safety-guard-8b-v3` | 165 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-3.2-nemoretriever-1b-vlm-embed-v1` | 167 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-3.2-nv-embedqa-1b-v1` | 169 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-3.3-nemotron-super-49b-v1` | 171 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-nemotron-embed-1b-v2` | 173 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-nemotron-embed-vl-1b-v2` | 175 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama3-chatqa-1.5-70b` | 177 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/mistral-nemo-minitron-8b-8k-instruct` | 179 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nemoretriever-parse` | 181 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nemotron-3-content-safety` | 183 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nemotron-3-nano-30b-a3b` | 185 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | 187 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nemotron-3.5-content-safety` | 189 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nemotron-4-340b-instruct` | 191 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nemotron-4-340b-reward` | 193 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nemotron-content-safety-reasoning-4b` | 195 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nemotron-mini-4b-instruct` | 197 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nemotron-nano-12b-v2-vl` | 199 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nemotron-nano-3-30b-a3b` | 201 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nemotron-parse` | 203 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/neva-22b` | 205 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nv-embed-v1` | 207 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nv-embedcode-7b-v1` | 209 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nv-embedqa-e5-v5` | 211 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nv-embedqa-mistral-7b-v2` | 213 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nvclip` | 215 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/nvidia-nemotron-nano-9b-v2` | 217 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/riva-translate-4b-instruct` | 219 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/riva-translate-4b-instruct-v1.1` | 221 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/vila` | 223 | - | Model not found in arena rankings; consider demoting |
| demote | `sarvamai/sarvam-m` | 225 | - | Model not found in arena rankings; consider demoting |
| demote | `snowflake/arctic-embed-l` | 227 | - | Model not found in arena rankings; consider demoting |
| demote | `upstage/solar-10.7b-instruct` | 231 | - | Model not found in arena rankings; consider demoting |
| demote | `writer/palmyra-fin-70b-32k` | 233 | - | Model not found in arena rankings; consider demoting |
| demote | `writer/palmyra-med-70b` | 235 | - | Model not found in arena rankings; consider demoting |
| demote | `writer/palmyra-med-70b-32k` | 237 | - | Model not found in arena rankings; consider demoting |
| demote | `zyphra/zamba2-7b-instruct` | 239 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/cosmos-reason2-8b` | 249 | - | Model not found in arena rankings; consider demoting |
| demote | `nvidia/llama-3.1-nemotron-ultra-253b-v1` | 251 | - | Model not found in arena rankings; consider demoting |
| demote | `writer/palmyra-creative-122b` | 255 | - | Model not found in arena rankings; consider demoting |
| demote | `poolside/laguna-xs-2.1` | 5000 | - | Model not found in arena rankings; consider demoting |
| demote | `stepfun-ai/step-3.5-flash` | 45027 | - | Model not found in arena rankings; consider demoting |

---

> This report is advisory only. No configs were modified.
> Apply: `pnpm run tnf:llm:apply-rankings`