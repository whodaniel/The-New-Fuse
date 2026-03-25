# Rule DSL v0

The rule DSL defines trigger logic over KWS term/group hit events.

## Design Goals

1. Expressive enough for boolean and sequence patterns.
2. Deterministic runtime evaluation.
3. Compact syntax for operators and thresholds.

## Grammar (EBNF)

```ebnf
RULE        := "RULE" ID ":" EXPR CLAUSES "THEN" ACTION ;
CLAUSES     := [ "WITHIN" DURATION ] [ "COOLDOWN" DURATION ] [ "PRIORITY" INT ] ;
EXPR        := OR_EXPR ;
OR_EXPR     := AND_EXPR ( "OR" AND_EXPR )* ;
AND_EXPR    := NOT_EXPR ( "AND" NOT_EXPR )* ;
NOT_EXPR    := [ "NOT" ] PRIMARY ;
PRIMARY     := HIT | SEQ | "(" EXPR ")" ;

HIT         := "HIT(" TARGET ["," "min_conf=" NUMBER] ["," "count>=" INT] ["," "window=" DURATION] ")" ;
SEQ         := "SEQ(" TARGET_LIST ["," "max_gap=" DURATION] ["," "ordered=" BOOL] ")" ;

TARGET      := "term:" ID | "group:" ID | "taxonomy:" ID ;
TARGET_LIST := TARGET ( "->" TARGET )+ ;

ACTION      := "enqueue_llm(" TEMPLATE_ID ")" | "emit(" TOPIC_ID ")" | "webhook(" HOOK_ID ")" ;
DURATION    := INT "ms" | INT "s" ;
```

## Semantics

1. `WITHIN` sets max evaluation window for full expression.
2. `COOLDOWN` suppresses repeated firings for same rule and stream.
3. `min_conf` is per-hit confidence threshold.
4. `count>=N` requires at least N matching hits in the local window.
5. `SEQ` enforces order if `ordered=true`.

## Example Rules

```txt
RULE med_intent:
  HIT(group:drug, min_conf=0.78, count>=1, window=5s)
  AND HIT(group:dose, min_conf=0.72, count>=1, window=5s)
WITHIN 5s COOLDOWN 8s PRIORITY 10
THEN enqueue_llm(med_safety_v1)

RULE escalation:
  SEQ(group:distress -> group:self_harm, max_gap=7s, ordered=true)
  AND NOT HIT(group:joke_context, min_conf=0.80, window=7s)
WITHIN 7s COOLDOWN 20s PRIORITY 1
THEN enqueue_llm(crisis_triage_v1)
```

## Runtime Notes

1. Parse once to AST, then compile to evaluator graph.
2. Evaluate against event-time, not processing-time.
3. Track watermark to handle late events.
4. Deduplicate rule fires by `(rule_id, stream_id, time_bucket)`.
