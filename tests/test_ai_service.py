import pytest

from app.services.ai_service import NotificationAIService


class FakeProvider:
    """Test sırasında gerçek Ollama yerine kullanılan sahte provider."""

    def __init__(self, response: str):
        self.response = response
        self.system_prompt = None
        self.user_prompt = None

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        self.system_prompt = system_prompt
        self.user_prompt = user_prompt
        return self.response


def sample_input_data() -> dict[str, str]:
    return {
        "customer_name": "Ahmet",
        "order_id": "12345",
        "status": "Kargoya verildi",
    }


def test_safe_ai_output_is_returned():
    provider = FakeProvider(
        "Merhaba Ahmet,\n\nSiparişiniz kargoya verildi."
    )
    service = NotificationAIService(provider)

    result = service.generate_message(
        agent_prompt="Kısa bir kargo bildirimi hazırla.",
        input_data=sample_input_data(),
    )

    assert result == provider.response
    assert provider.system_prompt == "Kısa bir kargo bildirimi hazırla."
    assert "12345" in provider.user_prompt


@pytest.mark.parametrize(
    "unsafe_response",
    [
        "Merhaba {customer_name}, siparişiniz gönderildi.",
        "Siparişiniz bugün kargoya verildi.",
        "Seçenek 1: Siparişiniz kargoya verildi.",
    ],
)
def test_unsafe_ai_output_uses_data_based_fallback(unsafe_response: str):
    provider = FakeProvider(unsafe_response)
    service = NotificationAIService(provider)

    result = service.generate_message(
        agent_prompt="Kargo bildirimi hazırla.",
        input_data=sample_input_data(),
    )

    assert result == (
        "Merhaba Ahmet,\n\n"
        "12345 numaralı siparişiniz kargoya verildi."
    )


def test_missing_tracking_number_rejects_tracking_claim():
    provider = FakeProvider(
        "Siparişiniz kargoya verildi. Takip numaranızı kontrol edin."
    )
    service = NotificationAIService(provider)

    result = service.generate_message(
        agent_prompt="Kargo bildirimi hazırla.",
        input_data=sample_input_data(),
    )

    assert "takip" not in result.lower()

