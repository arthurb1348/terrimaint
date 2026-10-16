"""Contrats publics et différences assumées après le remplacement de FastAPI."""

import pytest
from rest_framework.test import APIClient


def test_health_endpoint_returns_ok() -> None:
    response = APIClient().get("/api/v1/health")

    assert response.status_code == 200
    assert response["Content-Type"] == "application/json"
    assert response.content == b'{"status":"ok"}'


def test_health_remains_json_for_browser_accept_header() -> None:
    response = APIClient().get("/api/v1/health", HTTP_ACCEPT="text/html,application/json")

    assert response.status_code == 200
    assert response["Content-Type"] == "application/json"
    assert response.json() == {"status": "ok"}


def test_health_rejects_post() -> None:
    response = APIClient().post("/api/v1/health", {}, format="json")

    assert response.status_code == 405


@pytest.mark.parametrize("path", ["/openapi.json", "/docs", "/redoc", "/api/v1/health/"])
def test_unexposed_routes_return_404(path: str) -> None:
    assert APIClient().get(path).status_code == 404


def test_health_via_angular_proxy_host() -> None:
    response = APIClient().get(
        "/api/v1/health", HTTP_HOST="127.0.0.1:8000", HTTP_ORIGIN="http://localhost:4200"
    )

    assert response.status_code == 200
    # Angular passe par son proxy : aucune autorisation CORS globale à ajouter.
    assert "Access-Control-Allow-Origin" not in response


def test_unknown_host_is_rejected(settings) -> None:
    settings.DEBUG = False
    settings.ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

    assert APIClient().get("/api/v1/health", HTTP_HOST="untrusted.example").status_code == 400
