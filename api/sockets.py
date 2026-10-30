import hmac
from flask import request
from flask_socketio import SocketIO, ConnectionRefusedError
from core.config import SESSION_AUTH_TOKEN

# Strict loopback CORS origin whitelist (P0 Security: eliminates wildcard CORS)
ALLOWED_ORIGINS = [
    "http://127.0.0.1:5050", "http://localhost:5050",
    "http://127.0.0.1:5051", "http://localhost:5051",
    "http://127.0.0.1:5052", "http://localhost:5052",
    "http://127.0.0.1:5055", "http://localhost:5055",
    "http://127.0.0.1:5500", "http://localhost:5500",
    "http://127.0.0.1:8080", "http://localhost:8080",
]

socketio = SocketIO(
    async_mode="threading",
    cors_allowed_origins=ALLOWED_ORIGINS,
)


def init_sockets(app):
    socketio.init_app(app)

    @socketio.on("connect")
    def handle_connect(auth=None):
        token = (auth or {}).get("token") if isinstance(auth, dict) else None
        if not token:
            token = request.args.get("token")
        if not token or not hmac.compare_digest(str(token), str(SESSION_AUTH_TOKEN)):
            raise ConnectionRefusedError("Unauthorized session token")

    return socketio
