import json
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import httpx
from fastapi.testclient import TestClient
from google import genai
from google.genai import errors, types

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.gemini_service import (
    GeminiService,
    GeminiServiceError,
    gemini_service,
)
from tests.support import OfflineTestCase, app


def response(text="Bản nháp thuyết minh.", finish="STOP", thought=False):
    return types.GenerateContentResponse(
        candidates=[
            types.Candidate(
                finish_reason=finish,
                content=types.Content(parts=[types.Part(text=text, thought=thought)]),
            )
        ],
    )


def api_error(code, reason=None):
    details = [{"reason": reason}] if reason else []
    return errors.APIError(
        code,
        {
            "error": {
                "code": code,
                "message": "sensitive-upstream-payload",
                "details": details,
            }
        },
    )


class GeminiServiceTests(OfflineTestCase):
    def setUp(self):
        super().setUp()
        self.service = GeminiService()
        self.models = MagicMock()
        self.service.__dict__["client"] = SimpleNamespace(models=self.models)

    def test_success_strips_text_and_preserves_system_instruction(self):
        self.models.generate_content.return_value = response("  Bản nháp  ")
        result = self.service.generate_text(
            "Hiện vật", system_instruction="Chỉ dùng dữ liệu thật"
        )
        self.assertEqual(result, "Bản nháp")
        call = self.models.generate_content.call_args.kwargs
        self.assertEqual(call["model"], settings.GEMINI_MODEL)
        self.assertEqual(call["contents"], "Hiện vật")
        self.assertIsNone(call["config"].temperature)
        self.assertEqual(call["config"].system_instruction, "Chỉ dùng dữ liệu thật")

    def test_older_model_keeps_requested_temperature(self):
        self.service.model = "gemini-2.5-flash"
        self.models.generate_content.return_value = response()
        self.service.generate_text("Hiện vật", temperature=0.4)
        self.assertEqual(
            self.models.generate_content.call_args.kwargs["config"].temperature, 0.4
        )

    def test_prefixed_gemini3_model_uses_default_temperature(self):
        self.service.model = "models/gemini-3.1-flash-lite"
        self.models.generate_content.return_value = response()
        self.service.generate_text("Hiện vật", temperature=0.4)
        self.assertIsNone(
            self.models.generate_content.call_args.kwargs["config"].temperature
        )

    def test_token_exhaustion_retries_once_with_bounded_budget(self):
        budgets = []

        def generate(**kwargs):
            budgets.append(kwargs["config"].max_output_tokens)
            return (
                response("suy nghĩ", "MAX_TOKENS", True)
                if len(budgets) == 1
                else response()
            )

        self.models.generate_content.side_effect = generate
        self.assertEqual(
            self.service.generate_text("Hiện vật"), "Bản nháp thuyết minh."
        )
        self.assertEqual(budgets, [2048, 8192])

    def test_persistent_token_exhaustion_is_not_returned_as_a_draft(self):
        self.models.generate_content.return_value = response(
            "Nội dung bị cắt", "MAX_TOKENS"
        )
        with self.assertRaises(GeminiServiceError) as caught:
            self.service.generate_text("Hiện vật")
        self.assertEqual(caught.exception.reason, "token_limit")
        self.assertEqual(self.models.generate_content.call_count, 2)

    def test_already_large_budget_is_not_increased(self):
        self.models.generate_content.return_value = response("", "MAX_TOKENS")
        with self.assertRaises(GeminiServiceError):
            self.service.generate_text("Hiện vật", max_output_tokens=8192)
        self.models.generate_content.assert_called_once()

    def test_invalid_key_permission_quota_model_and_upstream_errors(self):
        cases = [
            (400, "API_KEY_INVALID", "credentials", 503),
            (400, "API_KEY_EXPIRED", "credentials", 503),
            (401, None, "credentials", 503),
            (403, None, "credentials", 503),
            (429, None, "quota", 503),
            (404, None, "model", 503),
            (400, None, "request_rejected", 502),
            (500, None, "unavailable", 503),
            (503, None, "unavailable", 503),
            (504, None, "timeout", 504),
        ]
        for code, reason, expected_reason, expected_status in cases:
            with self.subTest(code=code, reason=reason):
                self.models.generate_content.side_effect = api_error(code, reason)
                with self.assertRaises(GeminiServiceError) as caught:
                    self.service.generate_text("Hiện vật")
                self.assertEqual(caught.exception.reason, expected_reason)
                self.assertEqual(caught.exception.status_code, expected_status)
                self.assertNotIn("sensitive-upstream-payload", str(caught.exception))

    def test_timeout_connection_and_malformed_json(self):
        for exc, reason in [
            (httpx.ReadTimeout("sensitive-upstream-payload"), "timeout"),
            (TimeoutError("sensitive-upstream-payload"), "timeout"),
            (httpx.ConnectError("sensitive-upstream-payload"), "connection"),
            (ValueError("sensitive-upstream-payload"), "invalid_response"),
        ]:
            with self.subTest(reason=reason):
                self.models.generate_content.side_effect = exc
                with self.assertRaises(GeminiServiceError) as caught:
                    self.service.generate_text("Hiện vật")
                self.assertEqual(caught.exception.reason, reason)
                self.assertNotIn("sensitive-upstream-payload", str(caught.exception))

    def test_malformed_error_details_are_safely_classified(self):
        for details in (None, "unexpected", [{"reason": ["unexpected"]}], {}):
            with self.subTest(kind=type(details).__name__):
                self.models.generate_content.side_effect = errors.APIError(
                    400,
                    {
                        "error": {
                            "details": details,
                            "message": "sensitive-upstream-payload",
                        }
                    },
                )
                with self.assertRaises(GeminiServiceError) as caught:
                    self.service.generate_text("Hiện vật")
                self.assertEqual(caught.exception.reason, "request_rejected")

    def test_invalid_empty_blocked_and_nontext_responses(self):
        cases = [
            (None, "invalid_response"),
            (types.GenerateContentResponse(), "empty_response"),
            (response("   "), "empty_response"),
            (response("private-thought", thought=True), "empty_response"),
            (response("", "SAFETY"), "incomplete_response"),
            (
                types.GenerateContentResponse(
                    prompt_feedback={"block_reason": "SAFETY"}
                ),
                "blocked",
            ),
            (
                types.GenerateContentResponse(candidates=[{"finish_reason": "STOP"}]),
                "empty_response",
            ),
            (
                types.GenerateContentResponse(
                    candidates=[
                        {
                            "finish_reason": "STOP",
                            "content": {"parts": [{"function_call": {"name": "tool"}}]},
                        }
                    ]
                ),
                "empty_response",
            ),
        ]
        for value, reason in cases:
            with self.subTest(reason=reason, kind=type(value).__name__):
                self.models.generate_content.return_value = value
                with self.assertRaises(GeminiServiceError) as caught:
                    self.service.generate_text("Hiện vật")
                self.assertEqual(caught.exception.reason, reason)

    def test_thoughts_are_excluded_from_final_draft(self):
        self.models.generate_content.return_value = types.GenerateContentResponse(
            candidates=[
                {
                    "finish_reason": "STOP",
                    "content": {
                        "parts": [
                            {"text": "private-thought", "thought": True},
                            {"text": "Bản nháp"},
                        ]
                    },
                }
            ]
        )
        self.assertEqual(self.service.generate_text("Hiện vật"), "Bản nháp")

    def test_missing_model_and_key_fail_before_network(self):
        service = GeminiService()
        service.model = ""
        with self.assertRaises(GeminiServiceError) as caught:
            service.generate_text("Hiện vật")
        self.assertEqual(caught.exception.reason, "configuration")
        service.model = settings.GEMINI_MODEL
        with (
            patch.object(settings, "GOOGLE_API_KEY", ""),
            self.assertRaises(GeminiServiceError) as caught,
        ):
            service.generate_text("Hiện vật")
        self.assertEqual(caught.exception.reason, "configuration")

    def test_blank_prompt_is_rejected_without_calling_gemini(self):
        with self.assertRaises(ValueError):
            self.service.generate_text("  ")
        self.models.generate_content.assert_not_called()

    def test_client_has_explicit_timeout_and_limited_retries(self):
        with patch("app.services.gemini_service.genai.Client") as factory:
            service = GeminiService()
            self.assertIs(service.client, factory.return_value)
        options = factory.call_args.kwargs["http_options"]
        self.assertEqual(options.timeout, 30000)
        self.assertEqual(options.retry_options.attempts, 2)
        self.assertEqual(options.retry_options.http_status_codes, [503])

    def test_real_sdk_serializes_request_and_parses_mock_http_response(self):
        requests = []

        def handle(request):
            requests.append(json.loads(request.content))
            return httpx.Response(
                200,
                json={
                    "candidates": [
                        {
                            "finishReason": "STOP",
                            "content": {"parts": [{"text": "Bản nháp SDK"}]},
                        }
                    ]
                },
            )

        with (
            httpx.Client(transport=httpx.MockTransport(handle)) as http_client,
            genai.Client(
                api_key="offline-test-key",
                http_options=types.HttpOptions(
                    httpx_client=http_client,
                    retry_options=types.HttpRetryOptions(attempts=1),
                ),
            ) as client,
        ):
            self.service.__dict__["client"] = client
            self.assertEqual(
                self.service.generate_text("Hiện vật", system_instruction="Bản nháp"),
                "Bản nháp SDK",
            )
        self.assertEqual(len(requests), 1)
        self.assertEqual(requests[0]["generationConfig"]["maxOutputTokens"], 2048)
        self.assertNotIn("temperature", requests[0]["generationConfig"])
        self.assertEqual(
            requests[0]["systemInstruction"]["parts"][0]["text"], "Bản nháp"
        )

    def test_sdk_retries_only_transient_503_and_does_not_retry_quota(self):
        for statuses, expected_reason in [
            ([503, 200], None),
            ([503, 503], "unavailable"),
            ([429], "quota"),
        ]:
            with self.subTest(statuses=statuses):
                calls = []

                def handle(request, statuses=statuses, calls=calls):
                    status = statuses[len(calls)]
                    calls.append(status)
                    if status == 200:
                        return httpx.Response(
                            200,
                            json={
                                "candidates": [
                                    {
                                        "finishReason": "STOP",
                                        "content": {"parts": [{"text": "Bản nháp"}]},
                                    }
                                ]
                            },
                        )
                    return httpx.Response(
                        status,
                        json={
                            "error": {
                                "code": status,
                                "message": "sensitive-upstream-payload",
                            }
                        },
                    )

                with (
                    httpx.Client(transport=httpx.MockTransport(handle)) as http_client,
                    genai.Client(
                        api_key="offline-test-key",
                        http_options=types.HttpOptions(
                            httpx_client=http_client,
                            retry_options=types.HttpRetryOptions(
                                attempts=2,
                                initial_delay=0.001,
                                max_delay=0.001,
                                http_status_codes=[503],
                            ),
                        ),
                    ) as client,
                ):
                    self.service.__dict__["client"] = client
                    if expected_reason:
                        with self.assertRaises(GeminiServiceError) as caught:
                            self.service.generate_text("Hiện vật")
                        self.assertEqual(caught.exception.reason, expected_reason)
                    else:
                        self.assertEqual(
                            self.service.generate_text("Hiện vật"), "Bản nháp"
                        )
                self.assertEqual(calls, statuses)


class NarrationEndpointTests(OfflineTestCase):
    def setUp(self):
        super().setUp()
        self.artifact = SimpleNamespace(
            id=2,
            artifact_code="HV002",
            name="Bình gốm",
            origin=None,
            period=None,
            material="Gốm",
            description="Hiện vật kiểm thử",
            narration="Nội dung cũ",
        )
        self.db.query.return_value.filter.return_value.first.return_value = (
            self.artifact
        )
        self.user = SimpleNamespace(role=SimpleNamespace(name="content_staff"))
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_current_user] = lambda: self.user
        self.client = self.enterContext(TestClient(app))
        self.models = MagicMock()
        self.models.generate_content.return_value = response()
        self.enterContext(
            patch.dict(
                gemini_service.__dict__,
                {
                    "client": SimpleNamespace(models=self.models),
                },
            )
        )

    def test_success_contract_prompt_and_no_database_write(self):
        result = self.client.post("/api/artifacts/2/generate-narration", json={})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(
            result.json(),
            {
                "artifact_id": 2,
                "artifact_code": "HV002",
                "artifact_name": "Bình gốm",
                "draft_narration": "Bản nháp thuyết minh.",
                "is_saved": False,
            },
        )
        prompt = self.models.generate_content.call_args.kwargs["contents"]
        self.assertIn("Bình gốm", prompt)
        self.assertIn("Chưa có thông tin", prompt)
        self.assertIn("500 từ", prompt)
        self.assertIn("BẢN NHÁP", prompt)
        self.assertEqual(self.artifact.narration, "Nội dung cũ")
        self.assert_no_writes()

    def test_request_options_are_preserved_in_prompt(self):
        result = self.client.post(
            "/api/artifacts/2/generate-narration",
            json={
                "language": "en",
                "style": "story",
                "target_audience": "children",
                "max_length": 1000,
                "additional_instruction": "  Dễ hiểu  ",
            },
        )
        self.assertEqual(result.status_code, 200)
        prompt = self.models.generate_content.call_args.kwargs["contents"]
        for text in ("en", "story", "children", "1000 từ", "Dễ hiểu"):
            self.assertIn(text, prompt)
        self.assert_no_writes()

    def test_generation_is_not_specific_to_one_artifact_id(self):
        for artifact_id in (1, 2, 7):
            with self.subTest(artifact_id=artifact_id):
                self.artifact.id = artifact_id
                result = self.client.post(
                    f"/api/artifacts/{artifact_id}/generate-narration", json={}
                )
                self.assertEqual(result.status_code, 200)
                self.assertEqual(result.json()["artifact_id"], artifact_id)
        self.assert_no_writes()

    def test_upstream_errors_have_safe_specific_details_and_logs(self):
        for exc, status, reason in [
            (api_error(400, "API_KEY_INVALID"), 503, "credentials"),
            (api_error(429), 503, "quota"),
            (httpx.ReadTimeout("sensitive-upstream-payload"), 504, "timeout"),
            (ValueError("sensitive-upstream-payload"), 502, "invalid_response"),
            (RuntimeError("sensitive-upstream-payload"), 502, "unexpected"),
        ]:
            with self.subTest(reason=reason):
                self.models.generate_content.side_effect = exc
                with self.assertLogs("app.routers.artifacts") as logs:
                    result = self.client.post(
                        "/api/artifacts/2/generate-narration", json={}
                    )
                self.assertEqual(result.status_code, status)
                self.assertIsInstance(result.json()["detail"], str)
                self.assertIn("reason=" + reason, " ".join(logs.output))
                self.assertNotIn(
                    "sensitive-upstream-payload", result.text + " ".join(logs.output)
                )
                self.assert_no_writes()

    def test_endpoint_recovers_token_exhaustion(self):
        self.models.generate_content.side_effect = [
            response("", "MAX_TOKENS"),
            response(),
        ]
        result = self.client.post("/api/artifacts/2/generate-narration", json={})
        self.assertEqual(result.status_code, 200)
        self.assertFalse(result.json()["is_saved"])
        self.assertEqual(self.models.generate_content.call_count, 2)
        self.assert_no_writes()

    def test_missing_artifact_returns_404_without_gemini(self):
        self.db.query.return_value.filter.return_value.first.return_value = None
        result = self.client.post("/api/artifacts/2/generate-narration", json={})
        self.assertEqual(result.status_code, 404)
        self.models.generate_content.assert_not_called()
        self.assert_no_writes()

    def test_invalid_request_returns_422_without_gemini(self):
        result = self.client.post(
            "/api/artifacts/2/generate-narration", json={"max_length": 1}
        )
        self.assertEqual(result.status_code, 422)
        self.models.generate_content.assert_not_called()
        self.assert_no_writes()

    def test_rbac_denies_ticket_staff_and_visitor(self):
        for role in ("ticket_staff", "visitor"):
            with self.subTest(role=role):
                self.user.role.name = role
                result = self.client.post(
                    "/api/artifacts/2/generate-narration", json={}
                )
                self.assertEqual(result.status_code, 403)
        self.models.generate_content.assert_not_called()
        self.db.query.assert_not_called()
        self.assert_no_writes()

    def test_admin_can_generate(self):
        self.user.role.name = "admin"
        self.assertEqual(
            self.client.post(
                "/api/artifacts/2/generate-narration", json={}
            ).status_code,
            200,
        )
        self.assert_no_writes()

    def test_health_does_not_start_seed_or_connect_database(self):
        self.assertEqual(self.client.get("/health").status_code, 200)
        self.assert_no_writes()
