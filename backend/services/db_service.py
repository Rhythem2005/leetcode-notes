import sqlite3
import os
import uuid
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "history.sqlite")


def get_connection() -> sqlite3.Connection:
    """Get a connection to the SQLite database."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enforce foreign keys and WAL mode for better concurrent read performance
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Initialize the history table and indexes."""
    try:
        with get_connection() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS folders (
                    id        TEXT PRIMARY KEY,
                    name      TEXT NOT NULL,
                    timestamp REAL NOT NULL
                )
            ''')
            
            # Create history table with all columns
            conn.execute('''
                CREATE TABLE IF NOT EXISTS history (
                    id               TEXT PRIMARY KEY,
                    problem_number   TEXT NOT NULL,
                    generated_notes  TEXT NOT NULL,
                    timestamp        REAL NOT NULL,
                    is_starred       INTEGER DEFAULT 0,
                    folder_id        TEXT REFERENCES folders(id) ON DELETE SET NULL,
                    tags             TEXT
                )
            ''')
            
            # Ensure folder_id column exists (for backward compatibility)
            try:
                conn.execute('ALTER TABLE history ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL')
            except sqlite3.OperationalError:
                # Column already exists
                pass

            # Add tags column for smart tagging (backward compatible, optional)
            try:
                conn.execute('ALTER TABLE history ADD COLUMN tags TEXT')
            except sqlite3.OperationalError:
                # Column already exists
                pass

            # Index for the common query: ORDER BY timestamp DESC
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_history_timestamp
                ON history (timestamp DESC)
            ''')
            conn.commit()
            logger.info("Database initialized at %s", DB_PATH)
    except Exception as exc:
        logger.exception("Failed to initialize database: %s", exc)
        raise  # Let the app crash loudly on startup if DB fails


def _row_to_dict(row: sqlite3.Row) -> dict:
    """Convert a sqlite3.Row to a plain dict with correct types."""
    import json
    
    # Handle tags column safely
    tags = []
    try:
        if "tags" in row.keys():
            tags_json = row["tags"]
            if tags_json:
                tags = json.loads(tags_json)
                if not isinstance(tags, list):
                    tags = []
    except (json.JSONDecodeError, TypeError, KeyError):
        tags = []
    
    # Handle folder_id safely
    folder_id = None
    try:
        if "folder_id" in row.keys():
            folder_id = row["folder_id"]
    except KeyError:
        folder_id = None
    
    return {
        "id":              row["id"],
        "problem_number":  row["problem_number"],
        "generated_notes": row["generated_notes"],
        "timestamp":       row["timestamp"],
        "is_starred":      bool(row["is_starred"]),
        "folder_id":       folder_id,
        "tags":            tags,
    }


def save_history(problem_number: str, generated_notes: str, tags: list = None) -> dict:
    """Save a new note into the history table. Returns the saved record."""
    import json
    
    row_id    = str(uuid.uuid4())
    timestamp = datetime.now().timestamp()
    
    # Convert tags to JSON (safe, backward compatible)
    tags_json = None
    if tags and isinstance(tags, list):
        tags_json = json.dumps(tags)

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO history (id, problem_number, generated_notes, timestamp, is_starred, tags)
            VALUES (?, ?, ?, ?, 0, ?)
            """,
            (row_id, problem_number, generated_notes, timestamp, tags_json),
        )
        conn.commit()

    logger.info("Saved history for problem %s (id=%s) with tags: %s", problem_number, row_id, tags or [])
    return {
        "id":              row_id,
        "problem_number":  problem_number,
        "generated_notes": generated_notes,
        "timestamp":       timestamp,
        "is_starred":      False,
        "tags":            tags or [],
    }


def get_history(tag_filter: str = None) -> list[dict]:
    """
    Retrieve all history items, sorted newest first.
    
    Args:
        tag_filter: Optional tag name to filter by (case-insensitive)
        
    Returns:
        List of history items (filtered if tag_filter provided)
    """
    with get_connection() as conn:
        cursor = conn.execute(
            "SELECT * FROM history ORDER BY timestamp DESC"
        )
        all_items = [_row_to_dict(row) for row in cursor.fetchall()]
    
    # Frontend-side filtering for tags (more flexible than SQL)
    if tag_filter:
        tag_filter = tag_filter.lower().strip()
        filtered_items = []
        for item in all_items:
            # Check if tag matches any item's tags (partial match, case-insensitive)
            if any(tag_filter in tag.lower() for tag in item.get("tags", [])):
                filtered_items.append(item)
        return filtered_items
    
    return all_items


def get_history_item(item_id: str) -> Optional[dict]:
    """Fetch a single history item by ID. Returns None if not found."""
    with get_connection() as conn:
        cursor = conn.execute(
            "SELECT * FROM history WHERE id = ?", (item_id,)
        )
        row = cursor.fetchone()
        return _row_to_dict(row) if row else None


def delete_history(item_id: str) -> bool:
    """Delete a note from history. Returns True if deleted, False if not found."""
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM history WHERE id = ?", (item_id,)
        )
        conn.commit()
        deleted = cursor.rowcount > 0

    if deleted:
        logger.info("Deleted history item %s", item_id)
    else:
        logger.warning("Delete called on non-existent item %s", item_id)
    return deleted


def toggle_star(item_id: str) -> Optional[dict]:
    """
    Toggle the is_starred status of a note.
    Returns the updated record, or None if item not found.
    """
    with get_connection() as conn:
        cursor = conn.execute(
            "SELECT is_starred FROM history WHERE id = ?", (item_id,)
        )
        row = cursor.fetchone()
        if not row:
            logger.warning("toggle_star called on non-existent item %s", item_id)
            return None

        new_state = 0 if row["is_starred"] else 1

        conn.execute(
            "UPDATE history SET is_starred = ? WHERE id = ?",
            (new_state, item_id),
        )
        conn.commit()

        # Fetch and return the updated record
        cursor = conn.execute(
            "SELECT * FROM history WHERE id = ?", (item_id,)
        )
        return _row_to_dict(cursor.fetchone())


# --------------------------------------------------
# Folder Operations
# --------------------------------------------------

def create_folder(name: str) -> dict:
    """Create a new folder and return the record."""
    folder_id = str(uuid.uuid4())
    timestamp = datetime.now().timestamp()
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO folders (id, name, timestamp) VALUES (?, ?, ?)",
            (folder_id, name, timestamp),
        )
        conn.commit()
    return {"id": folder_id, "name": name, "timestamp": timestamp}


def get_folders() -> list[dict]:
    """Retrieve all folders sorted by name."""
    with get_connection() as conn:
        cursor = conn.execute("SELECT * FROM folders ORDER BY name ASC")
        return [dict(row) for row in cursor.fetchall()]


def delete_folder(folder_id: str) -> bool:
    """Delete a folder. Notes inside will have folder_id set to NULL by SQL constraint."""
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM folders WHERE id = ?", (folder_id,))
        conn.commit()
        return cursor.rowcount > 0


def assign_note_to_folder(item_id: str, folder_id: Optional[str]) -> Optional[dict]:
    """Assign a note to a folder (or set to NULL). Returns updated note."""
    with get_connection() as conn:
        conn.execute(
            "UPDATE history SET folder_id = ? WHERE id = ?",
            (folder_id, item_id),
        )
        conn.commit()
        return get_history_item(item_id)


def update_tags(item_id: str, tags: list) -> Optional[dict]:
    """
    Update tags for a note.
    
    Args:
        item_id: The note ID
        tags: List of tags to set (empty list to clear)
        
    Returns:
        Updated note dict, or None if not found
    """
    import json
    
    tags_json = json.dumps(tags) if tags else None
    
    with get_connection() as conn:
        conn.execute(
            "UPDATE history SET tags = ? WHERE id = ?",
            (tags_json, item_id),
        )
        conn.commit()
        return get_history_item(item_id)