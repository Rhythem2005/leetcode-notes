"""
LaTeX compilation service for Resume Builder.
Handles pdflatex compilation, file management, and error parsing.
"""
import os
import subprocess
import uuid
import logging
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)

# Resumes directory
RESUMES_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "resumes")

# Ensure resumes directory exists
os.makedirs(RESUMES_DIR, exist_ok=True)


def _check_pdflatex_available():
    """Check if pdflatex is installed and available."""
    if shutil.which("pdflatex") is None:
        raise RuntimeError(
            "pdflatex is not installed. Please install TeX Live:\n"
            "  macOS: brew install basictex\n"
            "  Linux: sudo apt install texlive-latex-base texlive-latex-extra\n"
            "After installation, restart your terminal."
        )


def compile_latex(modified_latex: str) -> tuple[str, str]:
    """
    Compile modified LaTeX resume to PDF.
    
    Args:
        modified_latex: The LaTeX content (modified by Gemini)
        
    Returns:
        tuple: (uuid, pdf_path)
        
    Raises:
        ValueError: If LaTeX has syntax errors
        RuntimeError: If PDF file is not created or pdflatex is not installed
    """
    # Check if pdflatex is available
    _check_pdflatex_available()
    
    resume_uuid = str(uuid.uuid4())
    tex_path = os.path.join(RESUMES_DIR, f"{resume_uuid}.tex")
    pdf_path = os.path.join(RESUMES_DIR, f"{resume_uuid}.pdf")
    log_path = os.path.join(RESUMES_DIR, f"{resume_uuid}.log")
    aux_path = os.path.join(RESUMES_DIR, f"{resume_uuid}.aux")

    # Write LaTeX to file
    try:
        with open(tex_path, "w") as f:
            f.write(modified_latex)
    except IOError as e:
        logger.error(f"Failed to write LaTeX file: {e}")
        raise RuntimeError(f"Failed to write LaTeX file: {e}")

    # Run pdflatex
    cmd = [
        "pdflatex",
        "-interaction=nonstopmode",
        f"-output-directory={RESUMES_DIR}",
        tex_path,
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
        )
    except subprocess.TimeoutExpired:
        logger.error(f"pdflatex timeout for {resume_uuid}")
        _cleanup_latex_files(tex_path, log_path, aux_path)
        raise RuntimeError("LaTeX compilation timed out")
    except Exception as e:
        logger.error(f"pdflatex execution error: {e}")
        _cleanup_latex_files(tex_path, log_path, aux_path)
        raise RuntimeError(f"LaTeX compilation failed: {e}")

    # Check exit code
    if result.returncode != 0:
        error_msg = _parse_latex_error(log_path)
        logger.warning(f"pdflatex failed for {resume_uuid}: {error_msg}")
        _cleanup_latex_files(tex_path, log_path, aux_path)
        raise ValueError(error_msg)

    # Check if PDF was created
    if not os.path.exists(pdf_path):
        logger.error(f"PDF not created for {resume_uuid}")
        _cleanup_latex_files(tex_path, log_path, aux_path)
        raise RuntimeError("PDF file was not created by pdflatex")

    # Cleanup .tex, .log, .aux (keep .pdf)
    _cleanup_latex_files(tex_path, log_path, aux_path)

    logger.info(f"Successfully compiled resume: {resume_uuid}")
    return resume_uuid, pdf_path


def _parse_latex_error(log_path: str) -> str:
    """
    Parse pdflatex .log file to extract error message.
    
    Args:
        log_path: Path to .log file
        
    Returns:
        str: Error message
    """
    if not os.path.exists(log_path):
        return "LaTeX compilation failed (no log file)"

    try:
        with open(log_path, "r") as f:
            lines = f.readlines()

        # Look for error/warning lines
        for i, line in enumerate(lines):
            if "!" in line and i < len(lines) - 1:
                error_line = line.strip()
                next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""
                return f"{error_line} {next_line}".strip()

        # Fallback: look for any warning or error
        for line in lines:
            if "error" in line.lower() or "warning" in line.lower():
                return line.strip()

        return "LaTeX compilation failed (unknown error)"

    except Exception as e:
        logger.error(f"Failed to parse LaTeX log: {e}")
        return f"LaTeX compilation failed: {e}"


def _cleanup_latex_files(*file_paths: str) -> None:
    """Delete helper LaTeX files (not the PDF)."""
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            logger.warning(f"Failed to cleanup {path}: {e}")


def get_pdf_path(resume_uuid: str) -> str:
    """
    Get path to a compiled PDF by UUID.
    
    Args:
        resume_uuid: The UUID of the resume
        
    Returns:
        str: Absolute path to PDF
        
    Raises:
        FileNotFoundError: If PDF does not exist
    """
    pdf_path = os.path.join(RESUMES_DIR, f"{resume_uuid}.pdf")
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"Resume {resume_uuid} not found")
    return pdf_path
