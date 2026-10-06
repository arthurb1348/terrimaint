"""Application entry point and liveness endpoint."""

from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"


def create_app() -> FastAPI:
    app = FastAPI(title="TerriMaint API", version="0.1.0")

    @app.get("/api/v1/health", response_model=HealthResponse, tags=["health"])
    def health() -> HealthResponse:
        """Confirm that the API process responds; this does not check the database."""
        return HealthResponse()

    return app


app = create_app()
