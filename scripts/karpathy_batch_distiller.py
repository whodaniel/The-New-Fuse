import os
import json
import hmac
import hashlib
import time
import secrets
import sys

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
WIKI_INBOX = os.path.join(PROJECT_ROOT, "data/wiki-inbox")
TRANSCRIPT_DIR = os.path.join(PROJECT_ROOT, "data/video-transcripts")

if SCRIPT_DIR not in sys.path:
    sys.path.append(SCRIPT_DIR)
from signature_wrapper import A2ASignatureWrapper

def sign_video(index, video_id, title, category, content, backlinks):
    signer = A2ASignatureWrapper('AGENT-VIDEO-DISTILLER', 'sovereign-secret')
    entry_id = f'video-analysis-{video_id}'
    
    transcript_path = os.path.join(TRANSCRIPT_DIR, f"{index}_{video_id}.txt")
    
    resource_pointers = {
        'raw-transcript': {
            'uri': f'file://{transcript_path}',
            'mimeType': 'text/plain'
        }
    }

    handoff = signer.wrap('COMPOUNDING_LOG_ENTRY', 
        data={
            'id': entry_id,
            'title': title,
            'category': category,
            'content': content,
            'backlinks': backlinks
        },
        resource_pointers=resource_pointers
    )

    alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    num = index
    id_code = ''
    while num > 0:
        id_code = alphabet[num % 58] + id_code
        num = num // 58
    handoff['header']['id_number'] = f'ID#:{id_code or alphabet[0]}'

    os.makedirs(WIKI_INBOX, exist_ok=True)
    with open(os.path.join(WIKI_INBOX, f"{entry_id}.json"), 'w') as f:
        json.dump(handoff, f, indent=2)
    print(f'✅ Signed #{index}: {entry_id}')

def process_karpathy_batch():
    # Video #1
    sign_video(1, 'VMj-3S1tku0', 'Micrograd: Backprop from Scratch', 'deep-learning-fundamentals', 
    '''# Micrograd: Backpropagation from Scratch
This entry covers the fundamental implementation of a scalar-valued autograd engine.

## Key Technical Insights
- **The Value Object**: Every scalar tracks data, gradients, and local operations.
- **Topological Sort**: Ensuring gradients propagate in correct reverse-order.
- **Gradient Accumulation**: Why gradients must be added (+=) not overwritten.
- **Backprop Intuition**: Recursive application of the Chain Rule.''', 
    ['backpropagation', 'autograd', 'sovereign-state'])

    # Video #2
    sign_video(2, 'PaCmpygFfXo', 'Makemore: The Bigram Model', 'language-modeling', 
    '''# Makemore: Building Bigram Character-Level Models
Introduction to language modeling using character-level prediction.

## Key Technical Insights
- **Character Tokenization**: Mapping strings to discrete integers.
- **Probability Matrix**: Look-up table for next-token prediction.
- **Loss Function (NLL)**: Measuring prediction quality.
- **Sampling Logic**: Using multinomial distributions for generation.''', 
    ['tokenization', 'softmax', 'sovereign-state'])

    # Video #3
    sign_video(3, 'TCH_1BHY58I', 'Makemore Part 2: MLP', 'language-modeling', 
    '''# Makemore Part 2: MLP and Word Embeddings
Evolving characters prediction into a Multi-Layer Perceptron architecture.

## Key Technical Insights
- **Word Embeddings**: Continuous vector spaces (Lookup Tables).
- **The Hidden Layer**: Implementing tanh non-linearity.
- **Batching**: Parallel processing of multiple examples.''', 
    ['word-embeddings', 'tanh', 'hyperparameters'])

    # Video #6
    sign_video(6, 't3YJ5hKiMQ0', 'Makemore Part 5: WaveNet', 'language-modeling',
    '''# Makemore Part 5: WaveNet & Dilated Convolutions
Implementing more efficient hierarchical processing for character sequences.

## Key Technical Insights
- **Dilated Convolutions**: Increasing receptive field without increasing parameters.
- **Hierarchical Merging**: Using nested linear layers to process chunks of text.
- **Performance**: Why WaveNet architecture scales better than deep MLPs.''',
    ['wavenet', 'convolutions', 'efficiency'])

    # Video #7
    sign_video(7, 'kCc8FmEb1nY', 'Build GPT from Scratch', 'gpt-architecture',
    '''# Let's Build GPT: Spelled Out
Implementing the complete Transformer architecture (GPT-2 style) from scratch.

## Key Technical Insights
- **Self-Attention**: Allowing tokens to "communicate" based on relevance.
- **Multi-Head Attention**: Running multiple attention heads in parallel.
- **Feed-Forward Networks**: Processing tokens individually after communication.
- **Residual Connections**: Enabling deep networks without gradient vanishing.
- **Layer Normalization**: Stabilizing training for faster convergence.''',
    ['transformer', 'attention', 'gpt-2', 'sovereign-state'])

    # Video #9
    sign_video(9, 'zduSFxRajkE', 'The GPT Tokenizer', 'gpt-architecture',
    '''# The GPT Tokenizer: Byte Pair Encoding (BPE)
Deep dive into the critical preprocessing step for all modern LLMs.

## Key Technical Insights
- **Byte Pair Encoding**: Iteratively merging frequent byte pairs into tokens.
- **Vocabulary Size**: The trade-off between dictionary size and sequence length.
- **BOS/EOS Tokens**: Special markers for sequence control.
- **Regex Splitting**: How GPT-4 uses regex to prevent cross-category merging.''',
    ['bpe', 'tokenization', 'gpt-4'])

    # Video #10
    sign_video(10, 'l8pRSuU81PU', 'Reproducing GPT-2 (124M)', 'gpt-architecture',
    '''# Reproducing GPT-2 (124M)
The complete engineering process of training a high-quality LLM on modern hardware.

## Key Technical Insights
- **Weight Initialization**: Why proper scaling (1/sqrt(N)) is required for deep transformers.
- **Optimizer Tuning**: AdamW hyperparameters and learning rate schedules.
- **Mixed Precision**: Using BF16/FP16 for 2x speedups.
- **Distributed Training**: Strategies for parallelizing across multiple GPUs.''',
    ['gpt-2', 'optimization', 'distributed-training'])

if __name__ == "__main__":
    process_karpathy_batch()
