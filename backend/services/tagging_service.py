"""
Smart tagging service for DSA notes.
Automatically generates relevant tags based on problem, code, and notes.
Uses Gemini AI for tag extraction.
"""
import json
import logging
from typing import List
from services.ai_service import client

logger = logging.getLogger(__name__)

_SYSTEM_INSTRUCTION = """\
You are an expert in data structures and algorithms.

Your task is to extract 3-5 relevant tags from a coding problem and solution.

Tags should represent:
- Data Structures (array, linked-list, tree, graph, hash-table, queue, stack, heap)
- Algorithms (dp, greedy, bfs, dfs, binary-search, sliding-window, sort)
- Patterns (two-pointer, prefix-sum, backtracking, recursion, divide-and-conquer)

Return ONLY a JSON array of lowercase tags. Example:
["dp", "array", "greedy"]

DO NOT return markdown, explanations, or anything else.
ONLY return the JSON array.
"""


def generate_tags(problem_number: str, code: str, notes: str) -> List[str]:
    """
    Generate tags for a note using AI.
    
    Args:
        problem_number: The LeetCode problem number
        code: The solution code
        notes: The generated AI notes
        
    Returns:
        List of tags (lowercase strings)
        Returns empty list if generation fails
    """
    prompt = f"""\
Problem: {problem_number}

Code:
{code}

AI Notes:
{notes}

Extract relevant tags.\
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            system_instruction=_SYSTEM_INSTRUCTION,
            config={
                "temperature": 0.3,
                "max_output_tokens": 100,
            },
        )

        response_text = response.text.strip()
        logger.debug(f"Gemini tag response: {response_text}")

        # Parse JSON response
        try:
            tags = json.loads(response_text)
            if isinstance(tags, list) and all(isinstance(t, str) for t in tags):
                # Validate tags are lowercase and non-empty
                tags = [t.lower().strip() for t in tags if t.strip()]
                logger.info(f"Generated tags for problem {problem_number}: {tags}")
                return tags[:5]  # Limit to 5 tags
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse tags JSON: {e}")
            return []

    except Exception as e:
        logger.error(f"Failed to generate tags for problem {problem_number}: {e}")
        return []


def sanitize_tags(tags: List[str]) -> List[str]:
    """
    Sanitize user-provided tags.
    
    Args:
        tags: Raw list of tags from user input
        
    Returns:
        List of sanitized tags
    """
    if not tags:
        return []
    
    sanitized = []
    valid_tags = set()
    
    for tag in tags:
        if isinstance(tag, str):
            cleaned = tag.lower().strip()
            # Only allow alphanumeric and hyphens
            if cleaned and all(c.isalnum() or c == '-' for c in cleaned):
                if len(cleaned) <= 20:  # Max tag length
                    if cleaned not in valid_tags:  # No duplicates
                        sanitized.append(cleaned)
                        valid_tags.add(cleaned)
    
    return sanitized[:10]  # Max 10 tags per note
