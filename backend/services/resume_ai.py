"""
Gemini AI service for resume optimization (Resume Builder).
Modifies base LaTeX resume to match job description using Gemini API.
"""
import os
import logging
from google import genai

logger = logging.getLogger(__name__)

# Initialize Gemini client
_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    logger.warning("GEMINI_API_KEY is not set — AI generation will fail.")

client = genai.Client()

_SYSTEM_INSTRUCTION = """\
You are an expert ATS resume optimizer.

You are given:
1. A BASE LaTeX resume (STRICT TEMPLATE — DO NOT CHANGE STRUCTURE)
2. A Job Description

---

🚨 STRICT RULES (VERY IMPORTANT):

- DO NOT change LaTeX structure, commands, formatting, spacing
- DO NOT remove sections
- DO NOT add new sections
- DO NOT add fake skills, projects, or experience
- ONLY modify the text content inside existing sections
- Keep all LaTeX commands EXACTLY as they are
- Return ONLY valid LaTeX code

---

🎯 YOUR TASK:

Modify the resume content to better match the Job Description by:

1. Improving bullet points using strong action verbs
2. Aligning skills with job requirements (ONLY if already relevant)
3. Rewriting project descriptions to highlight relevant technologies
4. Adding relevant keywords naturally (ATS optimization)
5. Keeping everything truthful and realistic

---

📌 IMPORTANT:

- If a skill is NOT present in the original resume, DO NOT add it
- Only enhance existing content
- Maintain professional tone
- Keep content concise and impactful
- Return ONLY raw LaTeX code — no markdown, no backticks, no explanation
- First character of output must be \\ or % (valid LaTeX)
"""


def modify_resume_for_jd(base_latex: str, job_description: str) -> str:
    """
    Modify base LaTeX resume to match job description using Claude.
    
    Args:
        base_latex: The base LaTeX resume template
        job_description: The job description text
        
    Returns:
        str: Modified LaTeX resume
        
    Raises:
        ValueError: If LaTeX output is invalid
        RuntimeError: If Claude API fails
    """
    prompt = f"""\
BASE RESUME:
{base_latex}

JOB DESCRIPTION:
{job_description}

Return the modified LaTeX resume now.\
"""

    try:
        message = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            system_instruction=_SYSTEM_INSTRUCTION,
            config=genai.types.GenerateContentConfig(
                max_output_tokens=8192,
                temperature=0.2,
            ),
        )

        modified_latex = message.text.strip()

        # Validate that output starts with \ or %
        if not modified_latex or (modified_latex[0] not in ("\\", "%")):
            raise ValueError(
                "Gemini returned invalid LaTeX (does not start with \\ or %)"
            )

        return modified_latex

    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise RuntimeError(f"Gemini API failed: {e}")


def retry_modify_resume_for_jd(base_latex: str, job_description: str, error_msg: str) -> str:
    """
    Retry resume modification after a compilation error.
    Sends the error message back to Gemini for correction.
    
    Args:
        base_latex: The base LaTeX resume template
        job_description: The job description
        error_msg: The pdflatex error message
        
    Returns:
        str: Corrected LaTeX resume
        
    Raises:
        RuntimeError: If retry fails
    """
    prompt = f"""\
BASE RESUME:
{base_latex}

JOB DESCRIPTION:
{job_description}

PREVIOUS ERROR:
The LaTeX you returned failed to compile with this error: {error_msg}

Fix it and return only valid LaTeX.\
"""

    try:
        message = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            system_instruction=_SYSTEM_INSTRUCTION,
            config=genai.types.GenerateContentConfig(
                max_output_tokens=8192,
                temperature=0.2,
            ),
        )

        modified_latex = message.text.strip()

        # Validate that output starts with \ or %
        if not modified_latex or (modified_latex[0] not in ("\\", "%")):
            raise ValueError(
                "Gemini returned invalid LaTeX (does not start with \\ or %)"
            )

        return modified_latex

    except Exception as e:
        logger.error(f"Gemini retry error: {e}")
        raise RuntimeError(f"Gemini retry failed: {e}")
