from app import models
from app.database import Base, engine


Base.metadata.create_all(bind=engine)

print("Veritabanı tabloları başarıyla oluşturuldu.")