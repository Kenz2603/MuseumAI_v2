from google import genai
from google.genai import types

from app.core.config import settings


class GeminiService:
    def __init__(self):
        self.client = genai.Client(
            api_key=settings.GOOGLE_API_KEY,
        )
        self.model = settings.GEMINI_MODEL

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

        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )

        if system_instruction:
            config.system_instruction = system_instruction

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=config,
        )

        text = response.text

        if not text or not text.strip():
            raise RuntimeError(
                "Gemini không trả về nội dung."
            )

        return text.strip()


gemini_service = GeminiService()