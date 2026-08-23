# AI Destekli Bildirim Servisi - Kurulum Rehberi

Bu servis, sipariş verilerinden Ollama ile bildirim metni üretir. Üretilen
metin güvenlik kontrollerinden geçirilir, PostgreSQL'e kaydedilir ve agent'ın
kanalına göre sistem bildirimi olarak tamamlanır veya SMTP üzerinden e-posta
gönderilir.

## Akış

```text
Agent oluştur
    ↓
Bildirim işi oluştur
    ↓
Bekleyen işi çalıştır
    ↓
Ollama ile mesaj üret
    ↓
Güvenli çıktı kontrolü
    ↓
Sistem bildirimi veya e-posta gönderimi
```

## Kullanılan teknolojiler

- Python 3.13
- FastAPI ve Uvicorn
- PostgreSQL 16 ve Docker Compose
- SQLAlchemy ve Psycopg
- Pydantic
- Ollama (`gemma3:4b`)
- SMTP
- Pytest

## Kurulum

PowerShell'de proje klasöründe çalıştır:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

`.env` içindeki PostgreSQL değerlerini Docker Compose ile uyumlu tut.

## PostgreSQL ve tablolar

Docker Desktop açıkken:

```powershell
docker compose up -d db
python -m app.init_db
```

## Ollama

Ollama kurulu ve çalışır durumdayken:

```powershell
ollama pull gemma3:4b
ollama list
```

`.env` içindeki `OLLAMA_MODEL` kullanılan modelle aynı olmalıdır.

## API'yi çalıştırma

```powershell
python -m uvicorn app.main:app --reload
```

Swagger: `http://127.0.0.1:8000/docs`

Sağlık kontrolü: `http://127.0.0.1:8000/health`

## API uçları

- `POST /agents`: Bildirim agent'ı oluşturur.
- `GET /agents`: Agent'ları listeler.
- `POST /notification-jobs`: Yeni bildirim işi oluşturur.
- `GET /notification-jobs`: Bildirim işlerini listeler.
- `POST /run-pending-jobs`: Bekleyen işleri çalıştırır.

Kanal seçenekleri:

- `system`: Mesaj üretilir ve uygulama içinde başarılı olarak kaydedilir.
- `email`: Mesaj üretilir ve SMTP üzerinden gönderilir.

## Gerçek e-posta gönderimi

İlk testlerde gönderimi kapalı tut:

```env
SMTP_ENABLED=false
```

Gmail ile test etmek için 2 Adımlı Doğrulaması açık hesapta uygulama şifresi
oluştur ve `.env` içine yaz:

```env
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=mail-adresin@gmail.com
SMTP_PASSWORD=uygulama-sifresi
SMTP_FROM=mail-adresin@gmail.com
```

`.env` gizlidir, Git'e gönderilmemelidir. İlk gerçek gönderimi kendi test
adresine yap.

## Testler

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Testler gerçek Ollama, SMTP veya PostgreSQL bağlantısı kurmadan temel servis
kurallarını doğrular.

## Git notu

`.env` dosyasını eklemeden değişiklikleri gönder:

```powershell
git status
git add docs/SETUP.md .env.example tests
git commit -m "docs: add project setup guide"
git push origin main
```
