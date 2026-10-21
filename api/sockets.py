from flask_socketio import SocketIO

socketio = SocketIO(async_mode="threading", cors_allowed_origins="*")


def init_sockets(app):
    socketio.init_app(app)
    return socketio
