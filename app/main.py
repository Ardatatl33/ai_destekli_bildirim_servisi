from fastapi import FastAPI

from app.api.jobs import router as jobs_router
from app.api.agents import router as agents_router


app = FastAPI(
    title="AI Destekli Bildirim Servisi",
    version="0.1.0",
    description=(
        "Yapay zekâ destekli e-posta ve sistem bildirimi servisi."
    ),
)


app.include_router(agents_router)
app.include_router(jobs_router)


@app.get(
    "/",
    summary="Servis bilgisi",
)
def read_root():
    return {
        "mesaj": "AI Destekli Bildirim Servisi çalışıyor.",
    }


@app.get(
    "/health",
    summary="Servis sağlık kontrolü",
)
def health_check():
    return {
        "durum": "çalışıyor",
    }
