import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


# Proje klasöründeki .env dosyasını okuyup ortam değişkenlerini yükler.
load_dotenv()


# PostgreSQL bağlantısı için gereken değerleri .env dosyasından alıyoruz.
POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")


# Eksik bir ayar varsa uygulamayı anlaşılır bir hata ile durduracağız.
required_settings = {
    "POSTGRES_DB": POSTGRES_DB,
    "POSTGRES_USER": POSTGRES_USER,
    "POSTGRES_PASSWORD": POSTGRES_PASSWORD,
    "POSTGRES_PORT": POSTGRES_PORT,
}


missing_settings = [
    name for name, value in required_settings.items() if not value
]

if missing_settings:
    missing_names = ", ".join(missing_settings)
    raise RuntimeError(
        f"Eksik ortam değişkenleri: {missing_names}"
    )


# SQLAlchemy'nin PostgreSQL'e bağlanmak için kullanacağı adres.
DATABASE_URL = (
    f"postgresql+psycopg://"
    f"{POSTGRES_USER}:{POSTGRES_PASSWORD}"
    f"@localhost:{POSTGRES_PORT}/{POSTGRES_DB}"
)


# Engine, veritabanı bağlantılarını yöneten ana SQLAlchemy nesnesidir.
engine = create_engine(
    DATABASE_URL,
    echo=False,
)


# Veritabanı işlemlerinde kullanacağımız session nesnelerini üretir.
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


# Veritabanı modellerimizin miras alacağı temel sınıf.
class Base(DeclarativeBase):
    pass
