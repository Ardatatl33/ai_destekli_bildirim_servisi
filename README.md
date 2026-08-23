# AI Destekli Bildirim Servisi

[![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141.1-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-development-2496ED?logo=docker)](https://docs.docker.com/compose/)
[![Ollama](https://img.shields.io/badge/Ollama-local%20AI-black)](https://ollama.com/)
[![Pytest](https://img.shields.io/badge/tests-pytest-0A9EDC?logo=pytest)](https://pytest.org/)

Yapay zekâ destekli e-posta ve sistem bildirimi servisi. Uygulama, bildirim agent'larının tanımlanmasını, bildirim işlerinin kuyruğa alınmasını, Ollama üzerinden mesaj üretilmesini ve işlerin e-posta veya sistem bildirimi olarak tamamlanmasını sağlar.

## Proje hakkında

Bu proje, bir müşterinin sipariş durumu gibi yapılandırılmış bilgileri profesyonel bir bildirim metnine dönüştürmek için hazırlanmıştır.

Temel akış şöyledir:

1. Bir bildirim agent'ı oluşturulur.
2. Bu agent'a bağlı bir bildirim işi (notification job) oluşturulur.
3. İş pending durumunda veritabanına kaydedilir.
4. POST /run-pending-jobs endpoint'i bekleyen işleri bulur.
5. Ollama, agent'ın prompt'u ve işin verileriyle bildirim metni üretir.
6. Kanal email ise SMTP üzerinden e-posta gönderilir; kanal system ise iş uygulama içinde başarılı olarak tamamlanır.
7. Sonuç veritabanına sent veya failed olarak kaydedilir.

### Agent nedir?

Agent, bildirimin nasıl üretileceğini belirleyen tanımdır. Agent içinde:

- name: Agent'ın görünen adı
- channel: email veya system
- prompt: Yapay zekâya verilen üretim talimatı
- is_active: Agent'ın aktiflik bilgisi

Örneğin Kargo Bildirim Agent'ı, müşteriye kısa ve profesyonel kargo mesajı hazırlayan bir agent olabilir.

### Notification job nedir?

Notification job, gönderilecek tek bir bildirimin kuyruğa alınmış halidir. Alıcı, konu ve sipariş bilgileri job içinde tutulur. Job'ın yaşam döngüsü şöyledir:

pending → processing → sent

Bir hata oluşursa son durum failed olur ve hata açıklaması error_message alanına kaydedilir.

## Özellikler

- FastAPI ile REST API
- Swagger/OpenAPI dokümantasyonu
- PostgreSQL veritabanı
- SQLAlchemy ORM ile veritabanı erişimi
- Ollama üzerinden yerel yapay zekâ ile bildirim metni üretimi
- Agent oluşturma ve listeleme
- Bildirim işi oluşturma ve listeleme
- Bekleyen işleri toplu çalıştırma
- SMTP/Gmail üzerinden e-posta gönderimi
- SMTP kapalıyken güvenli test modu
- Başarılı ve başarısız işlerin veritabanında saklanması
- Pydantic ile istek ve cevap doğrulaması
- AI provider ve e-posta servisi için birim testleri

## Bildirim akışı

~~~mermaid
flowchart TD
    A[Agent oluştur] --> B[Notification job oluştur]
    B --> C[(PostgreSQL: pending)]
    C --> D[POST /run-pending-jobs]
    D --> E[Job processor]
    E --> F[Ollama: bildirim metni üret]
    F --> G{Kanal}
    G -->|email| H[SMTP ile e-posta gönder]
    G -->|system| I[Sistem bildirimi tamamlandı olarak kaydet]
    H --> J[(PostgreSQL: sent veya failed)]
    I --> J
~~~

> Mevcut sürümde bekleyen işler manuel olarak POST /run-pending-jobs endpoint'i ile çalıştırılır. Otomatik zamanlayıcı henüz eklenmemiştir.

## Kullanılan teknolojiler

| Teknoloji | Kullanım amacı |
|---|---|
| Python 3.13 | Uygulama dili |
| FastAPI | REST API ve Swagger dokümantasyonu |
| Pydantic v2 | Veri doğrulama ve şema tanımları |
| SQLAlchemy 2 | ORM ve veritabanı işlemleri |
| PostgreSQL 16 | Kalıcı veri saklama |
| Docker Compose | Yerel PostgreSQL çalıştırma |
| Ollama | Yerel yapay zekâ modeli çalıştırma |
| psycopg | Python-PostgreSQL bağlantısı |
| SMTP | E-posta gönderimi |
| Pytest | Otomatik testler |

## Proje yapısı

~~~text
stajyer_projesi/
├── app/
│   ├── api/
│   │   ├── agents.py       # Agent endpoint'leri
│   │   ├── jobs.py         # Bildirim job endpoint'leri
│   │   └── runner.py       # Bekleyen job çalıştırma endpoint'i
│   ├── services/
│   │   ├── ai_provider.py  # Ollama provider
│   │   ├── ai_service.py    # Prompt ve güvenli fallback mantığı
│   │   ├── email_service.py # SMTP e-posta servisi
│   │   └── job_processor.py # Job işleme akışı
│   ├── database.py          # SQLAlchemy bağlantısı ve session
│   ├── init_db.py           # Tabloları oluşturma komutu
│   ├── main.py              # FastAPI uygulaması
│   ├── models.py            # Veritabanı modelleri
│   └── schemas.py            # Pydantic request/response şemaları
├── docs/
│   └── SETUP.md             # Kurulum notları
├── tests/
│   ├── test_ai_service.py
│   ├── test_email_service.py
│   └── test_schemas.py
├── .env.example             # Ortam değişkenleri örneği
├── docker-compose.yml        # PostgreSQL servisi
├── requirements.txt          # Python bağımlılıkları
└── README.md
~~~

## Kurulum

Komutlar Windows PowerShell içindir.

### 1. Projeyi klonla ve klasöre gir

~~~powershell
git clone https://github.com/Ardatatl33/ai_destekli_bildirim_servisi.git
cd ai_destekli_bildirim_servisi
~~~

### 2. Sanal ortam oluştur

~~~powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
~~~

### 3. Ortam dosyasını oluştur

~~~powershell
Copy-Item .env.example .env
~~~

.env dosyası gizli bilgiler içerir ve Git'e gönderilmemelidir. .gitignore bu dosyayı dışarıda bırakır.

### 4. PostgreSQL'i başlat

Docker Desktop açıkken:

~~~powershell
docker compose up -d db
~~~

İsteğe bağlı kontrol:

~~~powershell
docker ps
docker compose logs --tail=20 db
~~~

### 5. Veritabanı tablolarını oluştur

~~~powershell
python -m app.init_db
~~~

### 6. Ollama modelini indir

Ollama kurulu ve çalışır durumdayken:

~~~powershell
ollama pull gemma3:4b
~~~

Model adı .env içindeki OLLAMA_MODEL değeriyle aynı olmalıdır.

### 7. API'yi başlat

~~~powershell
python -m uvicorn app.main:app --reload
~~~

Servis varsayılan olarak http://127.0.0.1:8000 adresinde çalışır.

Daha ayrıntılı yerel kurulum notları için [docs/SETUP.md](docs/SETUP.md) dosyasına bakabilirsiniz.

## Ortam değişkenleri

.env.example dosyasını .env olarak kopyaladıktan sonra değerleri kendi bilgisayarınıza göre düzenleyin.

| Değişken | Açıklama | Örnek |
|---|---|---|
| POSTGRES_DB | PostgreSQL veritabanı adı | notification_db |
| POSTGRES_USER | PostgreSQL kullanıcı adı | notification_user |
| POSTGRES_PASSWORD | PostgreSQL şifresi | change_me |
| POSTGRES_PORT | Bilgisayardaki PostgreSQL portu | 5432 |
| OLLAMA_HOST | Ollama adresi | http://localhost:11434 |
| OLLAMA_MODEL | Kullanılacak model | gemma3:4b |
| OLLAMA_TEMPERATURE | Model üretim sıcaklığı | 0.2 |
| SMTP_ENABLED | E-posta gönderimini açar/kapatır | false |
| SMTP_HOST | SMTP sunucu adresi | smtp.gmail.com |
| SMTP_PORT | SMTP portu | 587 |
| SMTP_USERNAME | SMTP kullanıcı/e-posta hesabı | ornek@gmail.com |
| SMTP_PASSWORD | SMTP şifresi veya uygulama şifresi | gizli_deger |
| SMTP_FROM | Gönderici adresi | ornek@gmail.com |

## API kullanımı

API çalışırken Swagger arayüzü üzerinden endpoint'leri deneyebilirsiniz.

| Metot | Endpoint | Açıklama |
|---|---|---|
| GET | / | Servis bilgisi |
| GET | /health | Sağlık kontrolü |
| POST | /agents | Yeni bildirim agent'ı oluşturur |
| GET | /agents | Agent'ları listeler |
| POST | /notification-jobs | Yeni bildirim işi oluşturur |
| GET | /notification-jobs | Bildirim işlerini listeler |
| POST | /run-pending-jobs | Bekleyen işleri işler |

### Agent oluşturma

POST /agents isteği:

~~~json
{
  "name": "Kargo Bildirim Agent'ı",
  "channel": "email",
  "prompt": "Müşteriye kısa ve profesyonel bir kargo bildirimi hazırla.",
  "is_active": true
}
~~~

channel yalnızca email veya system olabilir. Başarılı cevap HTTP 201 Created döner ve veritabanındaki agent bilgilerini içerir.

### Bildirim işi oluşturma

Önce mevcut bir agent'ın id değerini öğrenin. Sonra POST /notification-jobs isteği gönderin:

~~~json
{
  "agent_id": 1,
  "recipient": "musteri@example.com",
  "subject": "Siparişiniz Kargoya Verildi",
  "input_data": {
    "customer_name": "Ahmet",
    "order_id": "12345",
    "status": "Kargoya verildi"
  }
}
~~~

input_data esnek bir JSON nesnesidir. Örneğin kargo firması veya takip numarası gibi ek bilgiler de gönderilebilir. Uygulamanın güvenli fallback metni özellikle customer_name, order_id, status, tracking_number ve delivery_estimate alanlarını kullanır.

### Bekleyen işleri çalıştırma

~~~text
POST /run-pending-jobs
~~~

Örnek cevap:

~~~json
{
  "message": "Bekleyen bildirim işleri işlendi.",
  "processed_count": 1,
  "sent_count": 1,
  "failed_count": 0
}
~~~

Bu endpoint bekleyen tüm job'ları sırayla işler. E-posta gönderiminde hata olursa job failed durumuna alınır; hata nedeni error_message alanında saklanır.

### Bildirim işini listeleme

GET /notification-jobs cevabında her işin durumu, AI çıktısı, hata mesajı, oluşturulma zamanı ve gönderilme zamanı görülebilir.

## Swagger ve sağlık kontrolü

API başladıktan sonra tarayıcıdan şu adresler açılabilir:

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- Sağlık kontrolü: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

## E-posta gönderimi

Geliştirme sırasında SMTP_ENABLED=false bırakılırsa uygulama gerçek e-posta göndermez; e-posta servisi test modunda çalışır. Bu mod, SMTP hesabı yapılandırmadan akışı denemek için kullanılır.

Gerçek e-posta göndermek için:

1. Gmail hesabında iki adımlı doğrulamayı açın.
2. Google hesap ayarlarından bir uygulama şifresi oluşturun.
3. .env içinde SMTP_ENABLED=true yapın.
4. SMTP_USERNAME, SMTP_PASSWORD ve SMTP_FROM değerlerini doldurun.
5. Uygulamayı yeniden başlatıp yeni bir email job'ı oluşturun.
6. POST /run-pending-jobs endpoint'ini çalıştırın.

Gmail normal hesap şifresini SMTP şifresi olarak kullanmak yerine uygulama şifresi kullanılmalıdır. Uygulama şifresi ve .env içindeki diğer gizli bilgiler GitHub'a gönderilmemelidir.

system kanalı mevcut sürümde gerçek bir harici bildirim sağlayıcısına bağlanmaz; job'ın uygulama içinde başarılı olarak tamamlanmasını temsil eder.

## Veritabanı modelleri

### notification_agents

| Alan | Açıklama |
|---|---|
| id | Agent kimliği |
| name | Agent adı |
| channel | email veya system |
| prompt | AI üretim talimatı |
| is_active | Aktiflik bilgisi |

### notification_jobs

| Alan | Açıklama |
|---|---|
| id | Job kimliği |
| agent_id | İlişkili agent |
| recipient | Bildirim alıcısı |
| subject | Bildirim konusu |
| input_data | Bildirim üretim verileri |
| status | pending, processing, sent veya failed |
| ai_output | Üretilen bildirim metni |
| error_message | Hata oluştuysa hata açıklaması |
| created_at | Oluşturulma zamanı |
| sent_at | Başarılı gönderim zamanı |

## Testler

Testleri çalıştırmak için:

~~~powershell
python -m pytest -q
~~~

Mevcut testler şema doğrulamasını, AI servisindeki metin/fallback davranışını ve e-posta servisini kontrol eder. Testlerde gerçek Ollama, SMTP veya PostgreSQL servisine bağlanılmaz; sahte provider ve test modu kullanılır.

## Güvenlik notları

- .env dosyasını Git'e göndermeyin; yalnızca .env.example paylaşın.
- Gmail için normal hesap şifresi yerine uygulama şifresi kullanın.
- Üretim ortamında varsayılan/örnek PostgreSQL şifreleri kullanmayın.
- API şu an kimlik doğrulama ve yetkilendirme içermemektedir; internete doğrudan açılmamalıdır.
- AI çıktısı doğrudan güvenilmemeli; uygulamadaki güvenli prompt ve fallback kuralları korunmalıdır.
- Gerçek SMTP bilgilerini ekran görüntülerinde, loglarda veya README içinde paylaşmayın.

## Mevcut durum

Projenin temel MVP akışı çalışır durumdadır:

- Agent oluşturma ve listeleme çalışır.
- Bildirim job'ı oluşturma ve listeleme çalışır.
- Ollama ile yerel AI metni üretilebilir.
- E-posta SMTP üzerinden gönderilebilir.
- Bekleyen job'lar manuel runner ile işlenebilir.
- Başarılı ve başarısız sonuçlar PostgreSQL'e kaydedilir.
- Otomatik zamanlayıcı, kullanıcı kimlik doğrulama, Alembic migration, CI/CD ve üretim deployment yapılandırması henüz yoktur.

