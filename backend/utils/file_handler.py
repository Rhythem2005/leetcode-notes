"""
Utility helpers for file and directory management.
"""
import os

# Resolve paths relative to the backend root (one level up from utils/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
NOTES_TXT = os.path.join(DATA_DIR, "notes.txt")
NOTES_PDF = os.path.join(DATA_DIR, "notes.pdf")
NOTES_DOCX = os.path.join(DATA_DIR, "notes.docx")


def ensure_data_dir():
    """Create the data/ directory if it doesn't exist."""
    os.makedirs(DATA_DIR, exist_ok=True)


def read_all_notes() -> str:
    """Return the full contents of the accumulated notes file."""
    ensure_data_dir()
    if not os.path.exists(NOTES_TXT):
        return ""
    with open(NOTES_TXT, "r", encoding="utf-8") as f:
        return f.read()


def append_to_notes(content: str):
    """Append content to the persistent notes file."""
    ensure_data_dir()
    with open(NOTES_TXT, "a", encoding="utf-8") as f:
        f.write(content)
