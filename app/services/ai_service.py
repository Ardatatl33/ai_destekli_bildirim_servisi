import re
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
            "kısa, doğal ve profesyonel bir e-posta metni hazırla.\n\n"
            "Çıktı 2 veya 3 kısa cümleden oluşsun.\n"
            "Doğrudan 'Merhaba' ile başlayabilirsin.\n"
            "Konu başlığı, seçenek, soru veya açıklama yazma.\n"
            "Yalnızca tek bir nihai bildirim metni üret.\n"
            "Yalnızca aşağıdaki veri listesinde açıkça bulunan "
            "bilgileri kullan.\n"
            "Verilmeyen tarih, süre, takip numarası, şirket adı veya "
            "teslimat bilgisi ekleme.\n"
            "'Bugün', 'yakında' veya '2-3 iş günü' gibi varsayımlarda "
            "bulunan ifadeler kullanma.\n"
            "{order_id} veya {customer_name} gibi değişkenleri, "
            "[Müşteri Adı] veya [Şirket Adı] gibi placeholder'ları "
            "kesinlikle kullanma.\n\n"
            "Bir bilgi verilmemişse o bilgiyi uydurma; "
            "ilgili cümleyi atla.\n\n"
            "Bildirim verileri:\n"
            f"{formatted_input_data}"
        )

        generated_message = self.provider.generate(
            system_prompt=agent_prompt,
            user_prompt=user_prompt,
        )

        if self._is_safe_output(generated_message, input_data):
            return generated_message.strip()

        return self._build_safe_fallback(input_data)

    def _is_safe_output(
        self,
        message: str,
        input_data: dict[str, Any],
    ) -> bool:
        """AI çıktısında placeholder veya desteklenmeyen iddia arar."""

        lowered_message = message.lower()

        has_placeholder = re.search(
            r"\{[^{}]+\}|\[[^\[\]]+\]",
            message,
        )

        if has_placeholder:
            return False

        forbidden_phrases = (
            "seçenek 1",
            "seçenek 2",
            "hangi seçeneği",
            "size nasıl yardımcı olabilirim",
        )

        if any(
            phrase in lowered_message
            for phrase in forbidden_phrases
        ):
            return False

        if "takip numara" in lowered_message:
            if not input_data.get("tracking_number"):
                return False

        if "iş günü" in lowered_message:
            if not input_data.get("delivery_estimate"):
                return False

        return True

    def _build_safe_fallback(
        self,
        input_data: dict[str, Any],
    ) -> str:
        """Güvenli olmayan AI çıktısı için veriye dayalı metin üretir."""

        customer_name = input_data.get(
            "customer_name",
            "Müşterimiz",
        )
        order_id = input_data.get("order_id")
        status = input_data.get("status")

        if order_id and status:
            message = (
                f"Merhaba {customer_name},\n\n"
                f"{order_id} numaralı siparişiniz "
                f"{str(status).lower()}."
            )
        else:
            message = (
                f"Merhaba {customer_name},\n\n"
                "Siparişinizle ilgili yeni bir durum oluştu."
            )

        tracking_number = input_data.get("tracking_number")
        if tracking_number:
            message += (
                f"\nKargo takip numarası: {tracking_number}."
            )

        delivery_estimate = input_data.get("delivery_estimate")
        if delivery_estimate:
            message += (
                f"\nTahmini teslimat süresi: "
                f"{delivery_estimate}."
            )

        return message
