from typing import Any

from app.services.ai_provider import AIProvider


class NotificationAIService:
    """Notification job verilerinden AI mesajı üretir."""

    def __init__(self, provider: AIProvider):
        self.provider = provider

    def generate_message(
        self,
        agent_prompt: str,
        input_data: dict[str, Any],
    ) -> str:
        """Agent prompt'u ve job verilerinden bildirim metni üretir."""

        formatted_input_data = "\n".join(
            f"- {key}: {value}"
            for key, value in input_data.items()
        )

        user_prompt = (
            "Aşağıdaki bildirim verilerini kullanarak "
            "kısa ve profesyonel bir bildirim hazırla.\n\n"
            "Yalnızca tek bir nihai bildirim metni üret.\n"
            "Seçenek sunma, soru sorma ve açıklama ekleme.\n"
            "Verilen gerçek değerleri doğrudan kullan.\n"
            "{order_id} veya {customer_name} gibi değişkenleri, "
            "[Müşteri Adı] veya [Şirket Adı] gibi placeholder'ları "
            "kesinlikle kullanma.\n\n"
            "Bir bilgi verilmemişse o bilgiyi uydurma; "
            "ilgili cümleyi atla.\n\n"
            "Bildirim verileri:\n"
            f"{formatted_input_data}"
        )

        return self.provider.generate(
            system_prompt=agent_prompt,
            user_prompt=user_prompt,
        )
