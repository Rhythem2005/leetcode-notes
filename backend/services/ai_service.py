# gemini_service.py
"""
Gemini AI integration for generating structured DSA notes.
"""
import os
import logging
from google import genai

logger = logging.getLogger(__name__)

_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    logger.warning("GEMINI_API_KEY is not set — AI generation will fail.")

client = genai.Client()

_SYSTEM_INSTRUCTION = """\
You are a DSA revision note generator for a CS student preparing for campus placements. Convert a problem number and code into personal revision notes the student wrote for themselves.

PERSONAL:
- Not teaching — writing notes to revise 2 days later
- Write as if recalling what you figured out while solving

OUTPUT LANGUAGE — CRITICAL:
- ONLY Roman script Hinglish + English (never Devanagari like क,ख,ग)
- Examples: "array sorted tha toh binary search obvious tha" / "ye seen dict ne O(n) mein solve kar diya"
- Casual, like engineering students talk and text — never formal English

CODE — CRITICAL:
- Reproduce exactly — zero changes, no Hindi/Hinglish inside
- One single continuous block, proper indentation, IDE-style
- Wrap code in triple backticks (```) so it renders in editor format

TONE:
- Casual, first-person, short and sharp
- Zero formal/AI-sounding language — feels like handwritten notes

OUTPUT FORMAT:
- Plain text only — no HTML, no markdown
- Section headers: === SECTION NAME ===
- Bullets: start with -
- No intro, no preamble, no closing remarks

SPACING — CRITICAL:
- One blank line before AND after every === SECTION === header
- One blank line between each bullet in CODE LINE BY LINE section
- One blank line between the two dry run examples
- Numbered steps on their own line with blank line between them
- Never bunch content together

REQUIRED SECTIONS — STRICT — include ALL, in this exact order, every time, zero exceptions:

1. === PROBLEM KYA THA ===
2. === MERA CODE ===
3. === CODE LINE BY LINE ===
4. === LOGIC AISA CHALA ===
5. === TIME AND SPACE COMPLEXITY ===

"""

_PROMPT_TEMPLATE = """\
Problem: {problem_number}

My code:{user_code}

Generate DSA revision notes for the given problem and code. Follow this structure exactly — no skipping, no reordering, no extra sections.

LANGUAGE (HIGHEST PRIORITY):
- Roman script Hinglish + English only — never Devanagari (no क,ख,ग)
- Tone: casual engineering student texting — "sorted tha toh binary search obvious tha"
- Never sound like a tutorial or AI assistant

=== PROBLEM KYA THA ===

PROBLEM: [full clear statement]
INPUT / OUTPUT: [defined clearly]
CONSTRAINTS: [realistic ranges]
EXAMPLE: Input: ... Output: ... Explanation: ...

Then 4-5 Hinglish lines:
- Kya input hai, kya return karna hai
- Problem actually kya maang rahi hai
- Kaunsi condition isse tricky banati hai
- Brute approach kyun slow/wrong hoti
- Kaunsa observation solution tak le gaya

=== MERA CODE ===

CODE (EDITOR VIEW):
```
{user_code}
```

=== CODE LINE BY LINE ===

- Start after function signature
- Skip: lone brackets, imports, class declarations
- Every other line: WHAT it does + WHY it was needed

Format:
[N]. `snippet`
→ kya karta hai: ...

[blank line between entries]

=== LOGIC AISE CHALA ===

5-7 steps — how you thought through it: initial idea, what you rejected and why, how final approach clicked.
One step per line, blank line between each.

=== TIME & SPACE ===
- Time: O(...) — one line reason
- Space: O(...) — one line reason

RULES:
- First character must be '='
- Blank line before AND after every === SECTION ===
- All 5 sections, same order, every time

"""


def generate_notes(problem_number: str, user_code: str) -> str:
    if not problem_number or not problem_number.strip():
        raise ValueError("problem_number cannot be empty")
    if not user_code or not user_code.strip():
        raise ValueError("user_code cannot be empty")

    prompt = _PROMPT_TEMPLATE.format(
        problem_number=problem_number.strip(),
        user_code=user_code.strip(),
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "system_instruction": _SYSTEM_INSTRUCTION,
                "temperature": 0.4,
                "top_p": 0.90,
                "max_output_tokens": 4096,
            },
        )

        result = response.text.strip()

        if result.startswith("```"):
            lines = result.splitlines()
            result = "\n".join(
                line for line in lines
                if not line.strip().startswith("```")
            ).strip()

        return result

    except Exception as exc:
        logger.exception("Gemini API call failed for problem=%s", problem_number)
        raise RuntimeError(f"AI generation failed: {exc}") from exc