# routes/notes.py
"""
API routes for DSA notes generation and download.
"""
import logging
from flask import Blueprint, request, jsonify, send_file

from services.ai_service import generate_notes
from services.tagging_service import generate_tags
from services.document_service import append_notes, generate_docx, generate_pdf_from_history
from services.db_service import save_history, get_history
from utils.file_handler import NOTES_PDF

logger = logging.getLogger(__name__)
notes_bp = Blueprint("notes", __name__)


@notes_bp.route("/generate", methods=["POST"])
def generate():
    """Accept problem number + code, generate notes, save to DB, return notes."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    problem_number = data.get("problemNumber", "").strip()
    code = data.get("code", "").strip()

    if not problem_number:
        return jsonify({"error": "problemNumber is required"}), 400
    if not code:
        return jsonify({"error": "code is required"}), 400

    try:
        # 1. Generate notes via Gemini
        notes_text = generate_notes(problem_number, code)

        # 2. Auto-generate tags (non-blocking, fails gracefully)
        tags = []
        try:
            tags = generate_tags(problem_number, code, notes_text)
            logger.info(f"Generated tags for problem {problem_number}: {tags}")
        except Exception as e:
            logger.warning(f"Tag generation failed for problem {problem_number}: {e}")
            tags = []

        # 3. Save to SQLite DB with tags
        saved = save_history(problem_number, notes_text, tags=tags)

        return jsonify({
            "success": True,
            "problemNumber": problem_number,
            "notes": notes_text,
            "id": saved["id"],
            "tags": saved.get("tags", []),
        }), 200

    except RuntimeError as exc:
        logger.exception("Generation failed")
        return jsonify({"error": str(exc)}), 502
    except Exception as exc:
        logger.exception("Unexpected error in /generate")
        return jsonify({"error": "Internal server error"}), 500


@notes_bp.route("/download", methods=["GET"])
def download():
    """Build PDF from DB history (full, folder, or single) and send it."""
    note_id = request.args.get("note_id")
    folder_id = request.args.get("folder_id")
    
    try:
        items = get_history()
        
        # Filter if requested
        if note_id:
            items = [item for item in items if item["id"] == note_id]
        elif folder_id:
            items = [item for item in items if item.get("folder_id") == folder_id]
            
        if not items:
            return jsonify({"error": "No notes found to download"}), 404
            
        items_ordered = list(reversed(items))  # oldest first in PDF
        pdf_path = generate_pdf_from_history(items_ordered)
        
        return send_file(
            pdf_path,
            as_attachment=True,
            download_name="dsa_notes.pdf",
            mimetype="application/pdf",
        )
    except Exception as exc:
        logger.exception("Download failed")
        return jsonify({"error": f"File generation failed: {exc}"}), 500