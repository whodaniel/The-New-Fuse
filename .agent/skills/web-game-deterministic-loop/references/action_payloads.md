# Action Payloads

Use with `--actions-json` or save as a `.json` file for `--actions-file`.

## Basic movement + shoot
```json
{
  "steps": [
    { "buttons": ["right"], "frames": 8 },
    { "buttons": [], "frames": 4 },
    { "buttons": ["space"], "frames": 3 }
  ]
}
```

## Stress burst (movement transitions)
```json
{
  "steps": [
    { "buttons": ["left"], "frames": 10 },
    { "buttons": ["up"], "frames": 10 },
    { "buttons": ["right"], "frames": 10 },
    { "buttons": ["down"], "frames": 10 },
    { "buttons": ["space"], "frames": 5 }
  ]
}
```

## Fullscreen toggle validation
This is keyboard-driven outside payload JSON:
1. Send `f` key
2. Run one action burst
3. Send `Escape`
4. Run one action burst and verify canvas resize/state consistency
