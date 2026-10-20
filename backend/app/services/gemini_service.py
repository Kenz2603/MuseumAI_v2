from functools import cached_property

import httpx
from google import genai
from google.genai import errors, types

from app.core.config import settings


class GeminiServiceError(Exception):
    def __init__(self, reason: str, detail: str, status_code: int = 502):
        super().__init__(detail)
        self.reason = reason
        self.detail = detail
        self.status_code = status_code
        self.upstream_status: int | None = None


class GeminiService:
    def __init__(self):
        self.model = settings.GEMINI_MODEL

    @cached_property
    def client(self):
        if not settings.GOOGLE_API_KEY.strip():
            raise GeminiServiceError(
                "configuration",
                "Chưa cấu hình khóa API Gemini cho chức năng thuyết minh.",
                503,
            )
        return genai.Client(
            api_key=settings.GOOGLE_API_KEY,
            http_options=types.HttpOptions(
                timeout=30000,
                retry_options=types.HttpRetryOptions(
                    attempts=2,
                    initial_delay=1,
                    max_delay=1,
                    http_status_codes=[503],
                ),
            ),
        )

    @staticmethod
    def _api_error(exc: errors.APIError) -> GeminiServiceError:
        details = exc.details if isinstance(exc.details, dict) else {}
        error = details.get("error", details)
        error_details = error.get("details") if isinstance(error, dict) else None
        reasons = (
            {
                item.get("reason")
                for item in error_details or []
                if isinstance(item, dict) and isinstance(item.get("reason"), str)
            }
            if isinstance(error_details, list)
            else set()
        )
        if exc.code in (401, 403) or reasons & {
            "API_KEY_INVALID",
            "API_KEY_EXPIRED",
            "API_KEY_NOT_FOUND",
        }:
            return GeminiServiceError(
                "credentials",
                "Gemini từ chối khóa API hoặc quyền truy cập. "
                "Vui lòng liên hệ quản trị viên kiểm tra cấu hình.",
                503,
            )
        if exc.code == 429:
            return GeminiServiceError(
                "quota",
                "Gemini đã đạt giới hạn quota hoặc tần suất yêu cầu. "
                "Vui lòng thử lại sau hoặc kiểm tra hạn mức.",
                503,
            )
        if exc.code in (408, 504):
            return GeminiServiceError(
                "timeout",
                "Gemini phản hồi quá thời gian chờ. Vui lòng thử lại sau.",
                504,
            )
        if exc.code == 404:
            return GeminiServiceError(
                "model",
                "Model Gemini không khả dụng. Vui lòng liên hệ quản trị viên kiểm tra cấu hình.",
                503,
            )
        if exc.code >= 500:
            return GeminiServiceError(
                "unavailable",
                "Dịch vụ Gemini tạm thời không khả dụng. Vui lòng thử lại sau.",
                503,
            )
        return GeminiServiceError(
            "request_rejected",
            "Gemini từ chối yêu cầu tạo thuyết minh. "
            "Vui lòng kiểm tra cấu hình model và dữ liệu hiện vật.",
        )

    def generate_text(
        self,
        prompt: str,
        *,
        system_instruction: str | None = None,
        temperature: float = 0.7,
        max_output_tokens: int = 2048,
    ) -> str:
        if not prompt or not prompt.strip():
            raise ValueError("Prompt không được để trống.")

        if not self.model or not self.model.strip():
            raise GeminiServiceError(
                "configuration",
                "Chưa cấu hình model Gemini cho chức năng thuyết minh.",
                503,
            )

        config = types.GenerateContentConfig(
            temperature=None
            if self.model.removeprefix("models/").startswith("gemini-3")
            else temperature,
            max_output_tokens=max_output_tokens,
        )

        if system_instruction:
            config.system_instruction = system_instruction

        for attempt in range(2):
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=config,
                )
            except errors.APIError as exc:
                error = self._api_error(exc)
                error.upstream_status = exc.code
                raise error from None
            except (httpx.TimeoutException, TimeoutError):
                raise GeminiServiceError(
                    "timeout",
                    "Gemini phản hồi quá thời gian chờ. Vui lòng thử lại sau.",
                    504,
                ) from None
            except httpx.RequestError:
                raise GeminiServiceError(
                    "connection",
                    "Không thể kết nối tới Gemini. Vui lòng thử lại sau.",
                    503,
                ) from None
            except ValueError:
                raise GeminiServiceError(
                    "invalid_response",
                    "Phản hồi từ Gemini không đúng cấu trúc. Vui lòng thử lại.",
                ) from None

            if not isinstance(response, types.GenerateContentResponse):
                raise GeminiServiceError(
                    "invalid_response",
                    "Phản hồi từ Gemini không đúng cấu trúc. Vui lòng thử lại.",
                )
            feedback = response.prompt_feedback
            if feedback and feedback.block_reason not in (
                None,
                types.BlockedReason.BLOCKED_REASON_UNSPECIFIED,
            ):
                raise GeminiServiceError(
                    "blocked",
                    "Gemini đã chặn nội dung yêu cầu. Vui lòng kiểm tra dữ liệu hiện vật.",
                )
            if not response.candidates:
                raise GeminiServiceError(
                    "empty_response",
                    "Gemini không trả về nội dung thuyết minh. Vui lòng thử lại.",
                )
            candidate = response.candidates[0]
            if candidate.finish_reason == types.FinishReason.MAX_TOKENS:
                if attempt == 0 and max_output_tokens < 8192:
                    config.max_output_tokens = 8192
                    continue
                raise GeminiServiceError(
                    "token_limit",
                    "Gemini đã đạt giới hạn sinh nội dung. Vui lòng giảm độ dài yêu cầu và thử lại.",
                )
            if candidate.finish_reason != types.FinishReason.STOP:
                raise GeminiServiceError(
                    "incomplete_response",
                    "Gemini không hoàn tất nội dung thuyết minh. Vui lòng kiểm tra dữ liệu và thử lại.",
                )
            parts = candidate.content.parts if candidate.content else None
            text = "".join(
                part.text
                for part in parts or []
                if not part.thought and isinstance(part.text, str)
            ).strip()
            if not text:
                raise GeminiServiceError(
                    "empty_response",
                    "Gemini không trả về nội dung thuyết minh. Vui lòng thử lại.",
                )
            return text

        raise GeminiServiceError(
            "empty_response", "Gemini không trả về nội dung thuyết minh."
        )


gemini_service = GeminiService()
