# Video Analysis Report

## Metadata
- **Video**: NEW NVIDIA Open Multimodal Intelligence
- **Index**: #656
- **URL**: https://www.youtube.com/watch?v=XNaI4Xd4qXc
- **Duration**: 13:58
- **Processed**: 2026-05-10T01:48:04.785Z

---

## Summary
NVIDIA released the Nemotron 3 Nano Omni, an open multimodal model combining text, image, video, and audio understanding in a single architecture. It merges the Nemotron 3 Nano backbone (30B-A3B MoE), C-RADIOv4-H vision encoder, and Parakeet audio encoder. The model supports long-context multimodal intelligence, agentic tool use, and computer use, with detailed training recipes published including multi-stage SFT and RL pipelines.

## 🦾 Visual Intelligence
- **0:00**: Product lineup showing model variants and Parakeet V2 branding - Grid showing Nano (30B-A3B), Super (120B-A12B), Nano Omni (30B-A3B), and Parakeet V2 ASR card with green parrot mascot
- **0:01**: Architecture diagram of multimodal model - Detailed flow: Audio→Parakeet Audio Encoder→Audio Adaptor; Vision→3D Convolution→C-RADIOv4-H Vision Encoder→Vision Adaptor→Efficient Video Sampling; Text→Text Tokenizer; all feeding into Nemotron 3 Nano 30B-A3B LLM
- **0:03**: Training pipeline diagram with exact stage specifications - Vision SFT (Stages 0-1), Omni SFT (Stages 2-6 with context lengths and token counts), Omni RL Training (5 RL stages with MPO, Text, Vision, Omni, Text Stage 2)
- **0:05**: Code snippet showing Python API usage - create_stream() with messages, enable_thinking=True; stream_reasoning_content(response); default params temperature=0.6, top_p=0.95, max_tokens=16384
- **0:06**: Reasoning output and tool calling example - Chain-of-thought reasoning visible with <final_answer> structured output; comparison of reasoning ON vs OFF for image tool calling; tool call with modality and summary parameters
- **0:07**: Live demo UI showing audio Q&A with local vLLM - Chat interface connected to http://localhost:8000/v1 with model 'nemotron-nano-omni'; audio waveform input with reasoning output displayed
