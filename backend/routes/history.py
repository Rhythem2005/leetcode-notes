# routes/history.py
"""
API routes for history management.
"""
import logging
from flask import Blueprint, jsonify, send_file, request
from services.db_service import (
    get_history, delete_history, toggle_star, 
    get_folders, create_folder, delete_folder, assign_note_to_folder,
    update_tags
)
from services.tagging_service import sanitize_tags
from services.document_service import generate_pdf_from_history, generate_docx_from_history
from utils.file_handler import NOTES_PDF, NOTES_DOCX

logger = logging.getLogger(__name__)

history_bp = Blueprint("history", __name__, url_prefix="/api/history")


@history_bp.route("", methods=["GET"])
def list_history():
    """
    List all history items with optional tag filtering.
    
    Query parameters:
        tag (optional): Filter by tag name (case-insensitive, partial match)
        
    Examples:
        GET /api/history → all notes
        GET /api/history?tag=dp → notes tagged with 'dp'
        GET /api/history?tag=gr → notes tagged with tags containing 'gr' (e.g., 'graph')
    """
    tag_filter = request.args.get("tag", None)
    items = get_history(tag_filter=tag_filter)
    return jsonify(items), 200


@history_bp.route("/<item_id>", methods=["DELETE"])
def remove_history(item_id: str):
    deleted = delete_history(item_id)
    if not deleted:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True}), 200


@history_bp.route("/<item_id>/star", methods=["PATCH"])
def star_history(item_id: str):
    updated = toggle_star(item_id)
    if not updated:
        return jsonify({"error": "Not found"}), 404
    return jsonify(updated), 200


@history_bp.route("/download/pdf", methods=["GET"])
def download_history_pdf():
    """Generate PDF from current DB history and download."""
    try:
        items = list(reversed(get_history()))  # oldest first in PDF
        pdf_path = generate_pdf_from_history(items)
        return send_file(
            pdf_path,
            as_attachment=True,
            download_name="dsa_notes.pdf",
            mimetype="application/pdf",
        )
    except Exception as exc:
        logger.exception("PDF generation failed")
        return jsonify({"error": str(exc)}), 500


@history_bp.route("/download/docx", methods=["GET"])
def download_history_docx():
    """Generate DOCX from current DB history and download."""
    try:
        items = list(reversed(get_history()))  # oldest first in DOCX
        docx_path = generate_docx_from_history(items)
        return send_file(
            docx_path,
            as_attachment=True,
            download_name="dsa_notes.docx",
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    except Exception as exc:
        logger.exception("DOCX generation failed")
        return jsonify({"error": str(exc)}), 500


# --------------------------------------------------
# Folder Routes
# --------------------------------------------------

@history_bp.route("/folders", methods=["GET"])
def list_folders():
    return jsonify(get_folders()), 200


@history_bp.route("/folders", methods=["POST"])
def add_folder():
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "name is required"}), 400
    folder = create_folder(data["name"])
    return jsonify(folder), 201


@history_bp.route("/folders/<folder_id>", methods=["DELETE"])
def remove_folder(folder_id: str):
    deleted = delete_folder(folder_id)
    if not deleted:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True}), 200


@history_bp.route("/<item_id>/folder", methods=["PATCH"])
def move_note_to_folder(item_id: str):
    data = request.get_json()
    folder_id = data.get("folder_id")  # Can be None to remove from folder
    updated = assign_note_to_folder(item_id, folder_id)
    if not updated:
        return jsonify({"error": "Note not found"}), 404
    return jsonify(updated), 200


# --------------------------------------------------
# Tag Routes (Smart Tagging)
# --------------------------------------------------

@history_bp.route("/<item_id>/tags", methods=["PATCH"])
def update_note_tags(item_id: str):
    """
    Update tags for a note.
    
    Request JSON:
        {
            "tags": ["dp", "array", "greedy"]
        }
    
    Response (200): Updated note with tags
    Response (400): Missing tags field
    Response (404): Note not found
    """
    data = request.get_json()
    if not data or "tags" not in data:
        return jsonify({"error": "tags field is required"}), 400
    
    tags = data.get("tags", [])
    
    # Sanitize tags
    if isinstance(tags, list):
        tags = sanitize_tags(tags)
    else:
        return jsonify({"error": "tags must be an array"}), 400
    
    updated = update_tags(item_id, tags)
    if not updated:
        return jsonify({"error": "Note not found"}), 404
    
    return jsonify(updated), 200