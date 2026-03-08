# Live Bot Match Trace

- captured_at: 2026-03-08T22:07:35.615Z
- runtime: https://poker.ai-arcade.xyz
- table_id: live-proof-1773007655617
- hand_id: hand-1773007655617
- bot_ids: agent-1, agent-2, agent-3, agent-4, agent-5

## Tick Stream

| tick | seq | street  |  pot | acting_seat | current_bet | terminal |
| ---: | --: | ------- | ---: | ----------: | ----------: | -------- |
|    1 |   6 | PREFLOP |   90 |           4 |          20 | false    |
|    2 |  12 | PREFLOP |  175 |           0 |          20 | false    |
|    3 |  18 | PREFLOP |  221 |           1 |          20 | false    |
|    4 |  24 | PREFLOP |  260 |           2 |          20 | false    |
|    5 |  30 | PREFLOP |  328 |           3 |          20 | false    |
|    6 |  36 | PREFLOP |  402 |           4 |          20 | false    |
|    7 |  42 | PREFLOP |  501 |           0 |          20 | false    |
|    8 |  48 | PREFLOP |  515 |           1 |          20 | false    |
|    9 |  54 | PREFLOP |  608 |           2 |          20 | false    |
|   10 |  60 | PREFLOP |  702 |           3 |          20 | false    |
|   11 |  66 | PREFLOP |  754 |           4 |          20 | false    |
|   12 |  72 | PREFLOP |  819 |           0 |          20 | false    |
|   13 |  78 | PREFLOP |  878 |           1 |          20 | false    |
|   14 |  84 | PREFLOP |  949 |           2 |          20 | false    |
|   15 |  90 | PREFLOP | 1013 |           3 |          20 | false    |
|   16 |  96 | PREFLOP | 1056 |           4 |          20 | false    |
|   17 | 102 | PREFLOP | 1111 |           0 |          20 | false    |
|   18 | 108 | PREFLOP | 1151 |           1 |          20 | false    |
|   19 | 114 | PREFLOP | 1220 |           2 |          20 | false    |
|   20 | 120 | PREFLOP | 1267 |           3 |          20 | false    |

## Final Snapshot (trimmed)

```json
{
  "tableId": "live-proof-1773007655617",
  "handId": "hand-1773007655617",
  "street": "preflop",
  "pot": 1329,
  "actingSeat": 4,
  "terminal": false,
  "seats": [
    {
      "seat": 0,
      "folded": false,
      "stack": 100000,
      "invested": 0
    },
    {
      "seat": 1,
      "folded": true,
      "stack": 99990,
      "invested": 10
    },
    {
      "seat": 2,
      "folded": true,
      "stack": 99980,
      "invested": 20
    },
    {
      "seat": 3,
      "folded": false,
      "stack": 100000,
      "invested": 0
    },
    {
      "seat": 4,
      "folded": true,
      "stack": 100000,
      "invested": 0
    }
  ],
  "communityCards": [],
  "currentBet": 20,
  "seq": 126
}
```
