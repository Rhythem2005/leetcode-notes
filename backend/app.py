"""
Flask application entry point.

Run locally:
    python app.py

Production:
    gunicorn app:app
"""
import os
import logging
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

# Load environment variables BEFORE importing modules that read them
load_dotenv()




def create_app() -> Flask:
    """Application factory."""
    application = Flask(__name__)

    # --------------- CORS ---------------
    CORS(application, resources={r"/*": {"origins": "*"}})

    # --------------- Logging ---------------
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    )

    # --------------- Blueprints ---------------
    from routes.notes import notes_bp
    from routes.history import history_bp
    from routes.resume import resume_bp
    application.register_blueprint(notes_bp)
    application.register_blueprint(history_bp)
    application.register_blueprint(resume_bp)

    # --------------- Database Init ---------------
    from services.db_service import init_db
    init_db()

    # --------------- Health check ---------------
    @application.route("/health")
    def health():
        return {"status": "ok"}, 200

    return application


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 10000))
    is_production = os.getenv("FLASK_ENV", "development") == "production"
    app.run(host="0.0.0.0", port=port, debug=not is_production)
