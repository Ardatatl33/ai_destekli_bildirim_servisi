import os
from typing import Protocol

from dotenv import load_dotenv
from ollama import Client


load_dotenv()


class AIProvider(Protocol):
    """Tüm AI sağlayıcılarının uygulaması gereken davranış."""

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """Verilen prompt'larla AI metni üretir."""
        ...


class OllamaProvider:
    """Ollama local modeliyle metin üreten provider."""

    def __init__(
        self,
        model: str | None = None,
        host: str | None = None,
    ):
        self.model = model or os.getenv(
            "OLLAMA_MODEL",
            "gemma3:4b",
        )

        self.host = host or os.getenv(
            "OLLAMA_HOST",
            "http://localhost:11434",
        )

        self.temperature = float(
            os.getenv("OLLAMA_TEMPERATURE", "0.2")
        )

        self.client = Client(
            host=self.host,
        )

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """Ollama'dan yeni bir metin üretir."""

        response = self.client.chat(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            options={
                "temperature": self.temperature,
            },
        )

        return response["message"]["content"]
