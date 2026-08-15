from fastapi import FastAPI


app = FastAPI(
    title="AI Notification Service",
    version="0.1.0",
)


@app.get("/")
def read_root():
    return {
        "message": "AI Notification Service is running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
    }