"""Smoke tests for the initial HTTP contract."""

from fastapi.testclient import TestClient
from terrimaint_api.main import create_app


def test_health_endpoint_returns_ok() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_endpoint_is_documented_in_openapi() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/openapi.json")

    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["title"] == "TerriMaint API"
    assert "200" in schema["paths"]["/api/v1/health"]["get"]["responses"]
