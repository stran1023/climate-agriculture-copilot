"""Parses FARM_OPS_AGENT's structured markdown response into recommendation
dicts.

The agent is instructed (snowflake/coco-prompts.md Part 2 prompt 4) to
always emit exactly 6 bolded field labels per recommendation:
Recommendation / Reason / Evidence / Priority / Expected Impact /
Confidence -- see the live sample captured in feature_list.json's feat-009
evidence. Free-text LLM output isn't perfectly uniform run to run, so this
matches on the bold label tokens themselves line by line rather than
assuming a rigid block/bullet structure.
"""

import re

_LINE_RE = re.compile(r"\*\*(Recommendation|Reason|Evidence|Priority|Expected Impact|Confidence)\*\*:?\s*(.+)")

_LABEL_TO_KEY = {
    "Recommendation": "recommendation",
    "Reason": "reason",
    "Evidence": "evidence",
    "Priority": "priority",
    "Expected Impact": "expected_impact",
    "Confidence": "confidence_pct",
}

_REQUIRED_KEYS = set(_LABEL_TO_KEY.values())


def parse_recommendations(text: str) -> list[dict]:
    """Return a list of {recommendation, reason, evidence, priority,
    expected_impact, confidence_pct} dicts, one per recommendation block
    found in the agent's response. Skips any incomplete trailing block."""
    records: list[dict] = []
    current: dict = {}

    def flush() -> None:
        if _REQUIRED_KEYS.issubset(current.keys()):
            records.append(dict(current))

    for line in text.splitlines():
        match = _LINE_RE.search(line)
        if not match:
            continue
        key = _LABEL_TO_KEY[match.group(1)]
        value = match.group(2).strip().strip("*").strip()
        if key == "recommendation" and "recommendation" in current:
            flush()
            current = {}
        current[key] = value
    flush()

    for rec in records:
        digits = re.search(r"\d+(\.\d+)?", rec["confidence_pct"])
        rec["confidence_pct"] = float(digits.group()) if digits else 0.0
        priority = rec["priority"].lower()
        rec["priority"] = priority if priority in ("low", "medium", "high") else "medium"

    return records
