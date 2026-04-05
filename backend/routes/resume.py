"""
Resume Builder API routes.
Endpoints: POST /api/resume/generate, GET /api/resume/download/<uuid>
"""
import os
import logging
from flask import Blueprint, request, jsonify, send_file
from services.resume_ai import modify_resume_for_jd, retry_modify_resume_for_jd
from services.latex_service import compile_latex, get_pdf_path

logger = logging.getLogger(__name__)

resume_bp = Blueprint("resume", __name__, url_prefix="/api/resume")

# Path to base resume template
BASE_RESUME_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "base_resume.tex"
)


# ─────────────────────────────────────────────────────────────────
# API 1: Generate
# ─────────────────────────────────────────────────────────────────


@resume_bp.route("/generate", methods=["POST"])
def generate():
    """
    Generate a resume tailored to a job description.
    
    Request JSON:
        {
            "jobDescription": "..."
        }
    
    Response (200):
        {
            "latex": "...",
            "pdfUrl": "/api/resume/download/<uuid>"
        }
    
    Response (4xx/5xx):
        {
            "error": "...",
            "latex": "..."  (only on 422)
        }
    """
    try:
        # Validate request
        data = request.get_json() or {}
        job_description = data.get("jobDescription", "").strip()

        if not job_description:
            logger.warning("POST /api/resume/generate: Missing jobDescription")
            return jsonify({"error": "jobDescription is required"}), 400

        # Load base resume
        if not os.path.exists(BASE_RESUME_PATH):
            logger.error(f"Base resume template not found: {BASE_RESUME_PATH}")
            return (
                jsonify({"error": "Base resume template not found on server"}),
                500,
            )

        try:
            with open(BASE_RESUME_PATH, "r") as f:
                base_latex = f.read()
        except IOError as e:
            logger.error(f"Failed to read base resume: {e}")
            return jsonify({"error": "Failed to read base resume"}), 500

        if not base_latex or not base_latex.strip():
            logger.error("Base resume is empty")
            return jsonify({"error": "Base resume template is empty"}), 500

        # Call Claude to modify resume
        try:
            logger.info("Calling Claude to modify resume (first attempt)...")
            modified_latex = modify_resume_for_jd(base_latex, job_description)
            logger.info(f"Generated LaTeX length: {len(modified_latex)} chars")
        except RuntimeError as e:
            logger.error(f"Claude API error: {e}")
            return jsonify({"error": str(e)}), 502
        except ValueError as e:
            logger.error(f"Invalid Claude output: {e}")
            return jsonify({"error": "Invalid LaTeX output from Claude"}), 502

        # Validate modified LaTeX is not empty
        if not modified_latex or not modified_latex.strip():
            logger.error("Claude returned empty LaTeX")
            return jsonify({"error": "Claude returned empty LaTeX"}), 502

        # Compile LaTeX
        try:
            logger.info("Compiling LaTeX to PDF (first attempt)...")
            resume_uuid, pdf_path = compile_latex(modified_latex)
            logger.info(f"Successfully compiled resume: {resume_uuid}")
        except ValueError as latex_error:
            # LaTeX syntax error - retry once
            logger.warning(
                f"LaTeX compilation failed: {latex_error}. Retrying with Claude..."
            )

            try:
                logger.info("Calling Claude to fix LaTeX error (retry)...")
                modified_latex = retry_modify_resume_for_jd(
                    base_latex, job_description, str(latex_error)
                )
                logger.info(f"Generated corrected LaTeX length: {len(modified_latex)} chars")
            except RuntimeError as e:
                logger.error(f"Claude retry failed: {e}")
                return (
                    jsonify(
                        {
                            "error": "Failed to fix LaTeX errors after retry",
                            "latex": modified_latex if modified_latex else "",
                        }
                    ),
                    422,
                )

            # Validate retry response
            if not modified_latex or not modified_latex.strip():
                logger.error("Claude retry returned empty LaTeX")
                return jsonify({"error": "Claude retry returned empty LaTeX"}), 422

            # Try compilation again
            try:
                logger.info("Compiling LaTeX to PDF (second attempt after fix)...")
                resume_uuid, pdf_path = compile_latex(modified_latex)
                logger.info(f"Successfully compiled resume on retry: {resume_uuid}")
            except (ValueError, RuntimeError) as e:
                logger.error(f"LaTeX compilation failed after retry: {e}")
                return (
                    jsonify(
                        {
                            "error": f"LaTeX compilation failed: {e}",
                            "latex": modified_latex if modified_latex else "",
                        }
                    ),
                    422,
                )

        except RuntimeError as e:
            logger.error(f"LaTeX compilation failed: {e}")
            return jsonify({"error": str(e)}), 500

        # Return success response
        pdf_url = f"/api/resume/download/{resume_uuid}"
        logger.info(f"Returning success response with PDF URL: {pdf_url}")
        response = jsonify(
            {
                "latex": modified_latex,
                "pdfUrl": pdf_url,
            }
        )
        response.status_code = 200
        return response

    except Exception as e:
        # Catch all unexpected errors
        logger.error(f"Unexpected error in generate: {e}", exc_info=True)
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


# ─────────────────────────────────────────────────────────────────
# API 2: Download
# ─────────────────────────────────────────────────────────────────


@resume_bp.route("/download/<uuid>", methods=["GET"])
def download(uuid):
    """
    Download a compiled resume PDF.
    
    Response (200):
        Binary PDF file
    
    Response (404):
        {
            "error": "Resume not found"
        }
    """
    try:
        if not uuid or not isinstance(uuid, str) or len(uuid) < 10:
            logger.warning(f"Invalid UUID format: {uuid}")
            return jsonify({"error": "Invalid resume ID"}), 400

        pdf_path = get_pdf_path(uuid)
    except FileNotFoundError as e:
        logger.warning(f"PDF not found for UUID {uuid}: {e}")
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        logger.error(f"Error getting PDF path for {uuid}: {e}")
        return jsonify({"error": f"Failed to retrieve resume: {str(e)}"}), 500

    try:
        logger.info(f"Sending file: {pdf_path}")
        return send_file(
            pdf_path,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"resume_{uuid[:8]}.pdf",
        )
    except FileNotFoundError:
        logger.error(f"PDF file disappeared: {pdf_path}")
        return jsonify({"error": "Resume file not found"}), 404
    except Exception as e:
        logger.error(f"Failed to send PDF {uuid}: {e}")
        return jsonify({"error": "Failed to download resume"}), 500
