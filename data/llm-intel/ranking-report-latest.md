# LLM Ranking Report

Generated: 2026-05-11T04:30:09.882Z Intel Snapshot: intel_1778472008219

## Summary

| Metric          | Value |
| --------------- | ----- |
| Models Scored   | 37    |
| Live on NVIDIA  | 20    |
| Recommendations | 49    |
| Add New         | 0     |
| Reorder         | 30    |
| Remove EOL      | 4     |
| Demote Unranked | 15    |

## Composite Rankings

| Rank | Model                                          | Arena Score | Health  | Latency |
| ---- | ---------------------------------------------- | ----------- | ------- | ------- |
| 1    | `minimaxai/minimax-m2.5`                       | -           | live    | 322ms   |
| 2    | `qwen/qwen3.5-397b-a17b`                       | -           | live    | 4167ms  |
| 3    | `qwen/qwen3.5-122b-a10b`                       | -           | live    | 4663ms  |
| 4    | `mistralai/mistral-large-3-675b-instruct-2512` | -           | live    | 8622ms  |
| 5    | `mistralai/mistral-small-4-119b-2603`          | -           | live    | 396ms   |
| 6    | `mistralai/ministral-14b-instruct-2512`        | -           | live    | 301ms   |
| 7    | `google/gemma-3n-e4b-it`                       | -           | live    | 432ms   |
| 8    | `meta/llama-3.3-70b-instruct`                  | -           | live    | 289ms   |
| 9    | `meta/llama-3.2-90b-vision-instruct`           | -           | live    | 211ms   |
| 10   | `meta/llama-guard-4-12b`                       | -           | live    | 342ms   |
| 11   | `openai/gpt-oss-120b`                          | -           | live    | 216ms   |
| 12   | `openai/gpt-oss-20b`                           | -           | live    | 361ms   |
| 13   | `microsoft/phi-4-mini-instruct`                | -           | live    | 383ms   |
| 14   | `stockmark/stockmark-2-100b-instruct`          | -           | live    | 333ms   |
| 15   | `moonshotai/kimi-k2-thinking`                  | -           | live    | 8874ms  |
| 16   | `moonshotai/kimi-k2-instruct`                  | -           | live    | 847ms   |
| 17   | `z-ai/glm5`                                    | -           | live    | 6899ms  |
| 18   | `qwen/qwen3-coder-480b-a35b-instruct`          | -           | live    | 1661ms  |
| 19   | `qwen/qwen3-next-80b-a3b-instruct`             | -           | live    | 570ms   |
| 20   | `qwen/qwen3-next-80b-a3b-thinking`             | -           | live    | 568ms   |
| 21   | `z-ai/glm-5.1`                                 | -           | timeout | -       |
| 22   | `moonshotai/kimi-k2.6`                         | -           | timeout | -       |
| 23   | `minimaxai/minimax-m2.7`                       | -           | timeout | -       |
| 24   | `deepseek-ai/deepseek-v4-flash`                | -           | timeout | -       |
| 25   | `deepseek-ai/deepseek-v4-pro`                  | -           | timeout | -       |
| 26   | `mistralai/mistral-medium-3.5-128b`            | -           | timeout | -       |
| 27   | `google/gemma-3-27b-it`                        | -           | timeout | -       |
| 28   | `meta/llama-4-maverick-17b-128e-instruct`      | -           | timeout | -       |
| 29   | `abacusai/dracarys-llama-3.1-70b-instruct`     | -           | timeout | -       |
| 30   | `google/gemma-4-31b-it`                        | -           | timeout | -       |

## Recommendations

| Action     | Model                                          | Current | Proposed | Reason                                                     |
| ---------- | ---------------------------------------------- | ------- | -------- | ---------------------------------------------------------- |
| remove-eol | `moonshotai/kimi-k2-instruct-0905`             | 3       | -        | Model has reached end-of-life on NVIDIA NGC (HTTP 410)     |
| remove-eol | `mistralai/devstral-2-123b-instruct-2512`      | 13      | -        | Model has reached end-of-life on NVIDIA NGC (HTTP 410)     |
| remove-eol | `mistralai/magistral-small-2506`               | 32      | -        | Model has reached end-of-life on NVIDIA NGC (HTTP 410)     |
| remove-eol | `meta/llama-3.1-405b-instruct`                 | 37      | -        | Model has reached end-of-life on NVIDIA NGC (HTTP 410)     |
| reorder    | `minimaxai/minimax-m2.5`                       | 23      | 0        | Arena score change suggests priority shift of 23 positions |
| reorder    | `qwen/qwen3.5-397b-a17b`                       | 14      | 1        | Arena score change suggests priority shift of 13 positions |
| reorder    | `qwen/qwen3.5-122b-a10b`                       | 16      | 2        | Arena score change suggests priority shift of 14 positions |
| reorder    | `mistralai/mistral-large-3-675b-instruct-2512` | 11      | 3        | Arena score change suggests priority shift of 8 positions  |
| reorder    | `mistralai/mistral-small-4-119b-2603`          | 22      | 4        | Arena score change suggests priority shift of 18 positions |
| reorder    | `mistralai/ministral-14b-instruct-2512`        | 33      | 5        | Arena score change suggests priority shift of 28 positions |
| reorder    | `google/gemma-3n-e4b-it`                       | 35      | 6        | Arena score change suggests priority shift of 29 positions |
| reorder    | `meta/llama-3.3-70b-instruct`                  | 19      | 7        | Arena score change suggests priority shift of 12 positions |
| reorder    | `meta/llama-3.2-90b-vision-instruct`           | 38      | 8        | Arena score change suggests priority shift of 30 positions |
| reorder    | `meta/llama-guard-4-12b`                       | 39      | 9        | Arena score change suggests priority shift of 30 positions |
| reorder    | `openai/gpt-oss-120b`                          | 20      | 10       | Arena score change suggests priority shift of 10 positions |
| reorder    | `openai/gpt-oss-20b`                           | 21      | 11       | Arena score change suggests priority shift of 10 positions |
| reorder    | `microsoft/phi-4-mini-instruct`                | 40      | 12       | Arena score change suggests priority shift of 28 positions |
| reorder    | `stockmark/stockmark-2-100b-instruct`          | 43      | 13       | Arena score change suggests priority shift of 30 positions |
| reorder    | `moonshotai/kimi-k2-thinking`                  | 4       | 14       | Arena score change suggests priority shift of 10 positions |
| reorder    | `moonshotai/kimi-k2-instruct`                  | 5       | 15       | Arena score change suggests priority shift of 10 positions |
| reorder    | `z-ai/glm5`                                    | 9       | 16       | Arena score change suggests priority shift of 7 positions  |
| reorder    | `qwen/qwen3-next-80b-a3b-instruct`             | 29      | 18       | Arena score change suggests priority shift of 11 positions |
| reorder    | `qwen/qwen3-next-80b-a3b-thinking`             | 30      | 19       | Arena score change suggests priority shift of 11 positions |
| reorder    | `z-ai/glm-5.1`                                 | 0       | 20       | Arena score change suggests priority shift of 20 positions |
| reorder    | `moonshotai/kimi-k2.6`                         | 1       | 21       | Arena score change suggests priority shift of 20 positions |
| reorder    | `minimaxai/minimax-m2.7`                       | 2       | 22       | Arena score change suggests priority shift of 20 positions |
| reorder    | `deepseek-ai/deepseek-v4-flash`                | 6       | 23       | Arena score change suggests priority shift of 17 positions |
| reorder    | `deepseek-ai/deepseek-v4-pro`                  | 7       | 24       | Arena score change suggests priority shift of 17 positions |
| reorder    | `mistralai/mistral-medium-3.5-128b`            | 12      | 25       | Arena score change suggests priority shift of 13 positions |
| reorder    | `google/gemma-3-27b-it`                        | 36      | 26       | Arena score change suggests priority shift of 10 positions |
| reorder    | `meta/llama-4-maverick-17b-128e-instruct`      | 18      | 27       | Arena score change suggests priority shift of 9 positions  |
| reorder    | `abacusai/dracarys-llama-3.1-70b-instruct`     | 44      | 28       | Arena score change suggests priority shift of 16 positions |
| reorder    | `google/gemma-4-31b-it`                        | 17      | 29       | Arena score change suggests priority shift of 12 positions |
| reorder    | `z-ai/glm4.7`                                  | 10      | 30       | Arena score change suggests priority shift of 20 positions |
| demote     | `deepseek-ai/deepseek-v3.2`                    | 8       | -        | Model not found in arena rankings; consider demoting       |
| demote     | `microsoft/phi-4-multimodal-instruct`          | 24      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `01-ai/yi-large`                               | 25      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `bytedance/seed-oss-36b-instruct`              | 26      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `minimaxai/minimax-m2.1`                       | 27      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `deepseek-ai/deepseek-v3.1-terminus`           | 28      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `qwen/qwen3-coder-next`                        | 31      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `mistralai/mistral-medium-3-instruct`          | 34      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `microsoft/phi-3.5-moe-instruct`               | 41      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `writer/palmyra-creative-122b`                 | 42      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `stepfun-ai/step-3.5-flash`                    | 45      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `qwen/qwen2.5-coder-32b-instruct`              | 46      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `nvidia/llama-3.3-nemotron-super-49b-v1`       | 47      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `nvidia/llama-3.3-nemotron-super-49b-v1.5`     | 48      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `ai21labs/jamba-1.5-large-instruct`            | 49      | -        | Model not found in arena rankings; consider demoting       |

---

> This report is advisory only. No configs were modified. Apply:
> `pnpm run tnf:llm:apply-rankings`
