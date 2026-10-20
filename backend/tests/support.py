import os
import socket
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from pydantic_settings import BaseSettings


def deny_network(*args, **kwargs):
    raise AssertionError("Network access is forbidden in offline tests")


original_settings_init = BaseSettings.__init__
original_socket_connect = socket.socket.connect


def offline_connect(sock, address):
    if sock.family == getattr(socket, "AF_UNIX", None) or (
        isinstance(address, tuple) and address[0] in ("127.0.0.1", "::1")
    ):
        return original_socket_connect(sock, address)
    return deny_network()


def init_without_dotenv(self, **kwargs):
    kwargs["_env_file"] = None
    original_settings_init(self, **kwargs)


with (
    patch.dict(
        os.environ,
        {
            "DATABASE_URL": "sqlite://",
            "SECRET_KEY": "offline-test-secret",
            "GOOGLE_API_KEY": "offline-test-key",
            "GEMINI_MODEL": "gemini-3.1-flash-lite",
            "DEBUG": "False",
            "ENABLE_STARTUP_SEED": "False",
            "UPLOAD_DIR": str(Path(__file__).resolve().parents[1] / "uploads"),
        },
        clear=True,
    ),
    patch.object(BaseSettings, "__init__", init_without_dotenv),
    patch.object(socket.socket, "connect", offline_connect),
):
    from app.main import app


class OfflineTestCase(unittest.TestCase):
    def setUp(self):
        self.enterContext(patch.object(socket.socket, "connect", offline_connect))
        self.enterContext(
            patch("sqlalchemy.engine.Engine.connect", side_effect=deny_network)
        )
        self.enterContext(patch("app.main.SessionLocal", side_effect=deny_network))
        self.enterContext(patch("app.main.seed_roles", side_effect=deny_network))
        self.enterContext(patch("app.main.seed_admin", side_effect=deny_network))
        self.db = MagicMock()
        self.addCleanup(app.dependency_overrides.clear)

    def assert_no_writes(self):
        for method in ("add", "add_all", "commit", "flush", "delete", "execute"):
            getattr(self.db, method).assert_not_called()
