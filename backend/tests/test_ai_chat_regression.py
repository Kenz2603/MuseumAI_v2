from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from google.genai import types

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services import ai_assistant
from tests.support import OfflineTestCase, app


class AIChatRegressionTests(OfflineTestCase):
    def setUp(self):
        super().setUp()
        self.user = SimpleNamespace(role=SimpleNamespace(name="content_staff"))
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_current_user] = lambda: self.user
        self.client = self.enterContext(TestClient(app))
        self.gemini_client = MagicMock()
        self.enterContext(
            patch.object(
                ai_assistant, "_get_gemini_client", return_value=self.gemini_client
            )
        )
        self.context_builder = self.enterContext(
            patch.object(
                ai_assistant,
                "_build_context",
                return_value={
                    "intent": "general",
                    "period": "all",
                    "role": "content_staff",
                },
            )
        )
        self.enterContext(
            patch.object(ai_assistant, "_build_prompt", return_value="Câu hỏi kiểm thử")
        )
        self.enterContext(
            patch.object(
                ai_assistant, "_fallback_answer", return_value="Dữ liệu đã xác thực"
            )
        )
        self.enterContext(
            patch.object(ai_assistant, "_build_response_data", return_value={})
        )
        self.enterContext(
            patch.object(ai_assistant, "_build_response_chart", return_value=None)
        )

    def test_chat_still_returns_gemini_response_and_same_metadata(self):
        self.gemini_client.models.generate_content.return_value = (
            types.GenerateContentResponse(
                candidates=[
                    {
                        "finish_reason": "STOP",
                        "content": {"parts": [{"text": "Trả lời từ Gemini"}]},
                    }
                ]
            )
        )
        result = self.client.post(
            "/api/ai/chat", json={"message": "Thông tin bảo tàng?"}
        )
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["answer"], "Trả lời từ Gemini")
        self.assertEqual(result.json()["source"], "postgresql+gemini")
        self.assertFalse(result.json()["ai_fallback"])
        self.assertNotIn(
            "config", self.gemini_client.models.generate_content.call_args.kwargs
        )
        self.assert_no_writes()

    def test_chat_200_can_be_fallback_even_when_gemini_fails(self):
        self.gemini_client.models.generate_content.side_effect = RuntimeError(
            "sensitive-upstream-payload"
        )
        result = self.client.post(
            "/api/ai/chat", json={"message": "Thông tin bảo tàng?"}
        )
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["source"], "postgresql")
        self.assertTrue(result.json()["ai_fallback"])
        self.assertEqual(result.json()["answer"], "Dữ liệu đã xác thực")
        self.assertNotIn("sensitive-upstream-payload", result.text)
        self.assert_no_writes()

    def test_chat_rbac_still_denies_visitor(self):
        self.user.role.name = "visitor"
        result = self.client.post(
            "/api/ai/chat", json={"message": "Thông tin bảo tàng?"}
        )
        self.assertEqual(result.status_code, 403)
        self.context_builder.assert_not_called()
        self.gemini_client.models.generate_content.assert_not_called()
        self.assert_no_writes()
