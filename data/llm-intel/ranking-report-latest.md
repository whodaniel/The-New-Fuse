# LLM Ranking Report

Generated: 2026-05-12T00:30:01.963Z Intel Snapshot: intel_1778544001835

## Summary

| Metric          | Value |
| --------------- | ----- |
| Models Scored   | 37    |
| Live on NVIDIA  | 22    |
| Recommendations | 47    |
| Add New         | 0     |
| Reorder         | 25    |
| Remove EOL      | 8     |
| Demote Unranked | 14    |

## Composite Rankings

| Rank | Model                                          | Arena Score | Health  | Latency |
| ---- | ---------------------------------------------- | ----------- | ------- | ------- |
| 1    | `z-ai/glm-5.1`                                 | -           | live    | 3912ms  |
| 2    | `deepseek-ai/deepseek-v4-flash`                | -           | live    | 1657ms  |
| 3    | `deepseek-ai/deepseek-v4-pro`                  | -           | live    | 4216ms  |
| 4    | `qwen/qwen3.5-397b-a17b`                       | -           | live    | 1479ms  |
| 5    | `mistralai/mistral-medium-3.5-128b`            | -           | live    | 664ms   |
| 6    | `mistralai/mistral-small-4-119b-2603`          | -           | live    | 442ms   |
| 7    | `mistralai/ministral-14b-instruct-2512`        | -           | live    | 291ms   |
| 8    | `google/gemma-3n-e4b-it`                       | -           | live    | 728ms   |
| 9    | `meta/llama-4-maverick-17b-128e-instruct`      | -           | live    | 481ms   |
| 10   | `meta/llama-3.3-70b-instruct`                  | -           | live    | 307ms   |
| 11   | `meta/llama-3.2-90b-vision-instruct`           | -           | live    | 3661ms  |
| 12   | `meta/llama-guard-4-12b`                       | -           | live    | 495ms   |
| 13   | `openai/gpt-oss-120b`                          | -           | live    | 104ms   |
| 14   | `openai/gpt-oss-20b`                           | -           | live    | 258ms   |
| 15   | `bytedance/seed-oss-36b-instruct`              | -           | live    | 6700ms  |
| 16   | `stockmark/stockmark-2-100b-instruct`          | -           | live    | 385ms   |
| 17   | `google/gemma-4-31b-it`                        | -           | live    | 1779ms  |
| 18   | `z-ai/glm5`                                    | -           | live    | 3766ms  |
| 19   | `z-ai/glm4.7`                                  | -           | live    | 15052ms |
| 20   | `qwen/qwen3-coder-480b-a35b-instruct`          | -           | live    | 3323ms  |
| 21   | `qwen/qwen3-next-80b-a3b-instruct`             | -           | live    | 288ms   |
| 22   | `qwen/qwen3-next-80b-a3b-thinking`             | -           | live    | 345ms   |
| 23   | `moonshotai/kimi-k2.6`                         | -           | timeout | -       |
| 24   | `minimaxai/minimax-m2.7`                       | -           | timeout | -       |
| 25   | `qwen/qwen3.5-122b-a10b`                       | -           | timeout | -       |
| 26   | `mistralai/mistral-large-3-675b-instruct-2512` | -           | timeout | -       |
| 27   | `microsoft/phi-4-multimodal-instruct`          | -           | timeout | -       |
| 28   | `microsoft/phi-4-mini-instruct`                | -           | timeout | -       |
| 29   | `minimaxai/minimax-m2.5`                       | -           | eol     | -       |
| 30   | `mistralai/devstral-2-123b-instruct-2512`      | -           | eol     | -       |

## Recommendations

| Action     | Model                                          | Current | Proposed | Reason                                                     |
| ---------- | ---------------------------------------------- | ------- | -------- | ---------------------------------------------------------- |
| remove-eol | `moonshotai/kimi-k2-instruct-0905`             | 3       | -        | Model has reached end-of-life on NVIDIA NGC (HTTP 410)     |
| remove-eol | `moonshotai/kimi-k2-thinking`                  | 4       | -        | Model has reached end-of-life on NVIDIA NGC (HTTP 410)     |
| remove-eol | `moonshotai/kimi-k2-instruct`                  | 5       | -        | Model has reached end-of-life on NVIDIA NGC (HTTP 410)     |
| remove-eol | `mistralai/devstral-2-123b-instruct-2512`      | 13      | -        | Model has reached end-of-life on NVIDIA NGC (HTTP 410)     |
| remove-eol | `minimaxai/minimax-m2.5`                       | 23      | -        | Model has reached end-of-life on NVIDIA NGC (HTTP 410)     |
| remove-eol | `mistralai/magistral-small-2506`               | 32      | -        | Model has reached end-of-life on NVIDIA NGC (HTTP 410)     |
| remove-eol | `google/gemma-3-27b-it`                        | 36      | -        | Model has reached end-of-life on NVIDIA NGC (HTTP 410)     |
| remove-eol | `meta/llama-3.1-405b-instruct`                 | 37      | -        | Model has reached end-of-life on NVIDIA NGC (HTTP 410)     |
| reorder    | `deepseek-ai/deepseek-v4-flash`                | 6       | 1        | Arena score change suggests priority shift of 5 positions  |
| reorder    | `deepseek-ai/deepseek-v4-pro`                  | 7       | 2        | Arena score change suggests priority shift of 5 positions  |
| reorder    | `qwen/qwen3.5-397b-a17b`                       | 14      | 3        | Arena score change suggests priority shift of 11 positions |
| reorder    | `mistralai/mistral-medium-3.5-128b`            | 12      | 4        | Arena score change suggests priority shift of 8 positions  |
| reorder    | `mistralai/mistral-small-4-119b-2603`          | 22      | 5        | Arena score change suggests priority shift of 17 positions |
| reorder    | `mistralai/ministral-14b-instruct-2512`        | 33      | 6        | Arena score change suggests priority shift of 27 positions |
| reorder    | `google/gemma-3n-e4b-it`                       | 35      | 7        | Arena score change suggests priority shift of 28 positions |
| reorder    | `meta/llama-4-maverick-17b-128e-instruct`      | 18      | 8        | Arena score change suggests priority shift of 10 positions |
| reorder    | `meta/llama-3.3-70b-instruct`                  | 19      | 9        | Arena score change suggests priority shift of 10 positions |
| reorder    | `meta/llama-3.2-90b-vision-instruct`           | 38      | 10       | Arena score change suggests priority shift of 28 positions |
| reorder    | `meta/llama-guard-4-12b`                       | 39      | 11       | Arena score change suggests priority shift of 28 positions |
| reorder    | `openai/gpt-oss-120b`                          | 20      | 12       | Arena score change suggests priority shift of 8 positions  |
| reorder    | `openai/gpt-oss-20b`                           | 21      | 13       | Arena score change suggests priority shift of 8 positions  |
| reorder    | `bytedance/seed-oss-36b-instruct`              | 26      | 14       | Arena score change suggests priority shift of 12 positions |
| reorder    | `stockmark/stockmark-2-100b-instruct`          | 43      | 15       | Arena score change suggests priority shift of 28 positions |
| reorder    | `z-ai/glm5`                                    | 9       | 17       | Arena score change suggests priority shift of 8 positions  |
| reorder    | `z-ai/glm4.7`                                  | 10      | 18       | Arena score change suggests priority shift of 8 positions  |
| reorder    | `qwen/qwen3-coder-480b-a35b-instruct`          | 15      | 19       | Arena score change suggests priority shift of 4 positions  |
| reorder    | `qwen/qwen3-next-80b-a3b-instruct`             | 29      | 20       | Arena score change suggests priority shift of 9 positions  |
| reorder    | `qwen/qwen3-next-80b-a3b-thinking`             | 30      | 21       | Arena score change suggests priority shift of 9 positions  |
| reorder    | `moonshotai/kimi-k2.6`                         | 1       | 22       | Arena score change suggests priority shift of 21 positions |
| reorder    | `minimaxai/minimax-m2.7`                       | 2       | 23       | Arena score change suggests priority shift of 21 positions |
| reorder    | `qwen/qwen3.5-122b-a10b`                       | 16      | 24       | Arena score change suggests priority shift of 8 positions  |
| reorder    | `mistralai/mistral-large-3-675b-instruct-2512` | 11      | 25       | Arena score change suggests priority shift of 14 positions |
| reorder    | `microsoft/phi-4-mini-instruct`                | 40      | 27       | Arena score change suggests priority shift of 13 positions |
| demote     | `deepseek-ai/deepseek-v3.2`                    | 8       | -        | Model not found in arena rankings; consider demoting       |
| demote     | `01-ai/yi-large`                               | 25      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `minimaxai/minimax-m2.1`                       | 27      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `deepseek-ai/deepseek-v3.1-terminus`           | 28      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `qwen/qwen3-coder-next`                        | 31      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `mistralai/mistral-medium-3-instruct`          | 34      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `microsoft/phi-3.5-moe-instruct`               | 41      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `writer/palmyra-creative-122b`                 | 42      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `abacusai/dracarys-llama-3.1-70b-instruct`     | 44      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `stepfun-ai/step-3.5-flash`                    | 45      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `qwen/qwen2.5-coder-32b-instruct`              | 46      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `nvidia/llama-3.3-nemotron-super-49b-v1`       | 47      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `nvidia/llama-3.3-nemotron-super-49b-v1.5`     | 48      | -        | Model not found in arena rankings; consider demoting       |
| demote     | `ai21labs/jamba-1.5-large-instruct`            | 49      | -        | Model not found in arena rankings; consider demoting       |

---

> This report is advisory only. No configs were modified. Apply:
> `pnpm run tnf:llm:apply-rankings`
