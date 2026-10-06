"""Vérifie le contrat HTTP de santé et sa présence dans la documentation OpenAPI."""

from fastapi.testclient import TestClient
from terrimaint_api.main import create_app


def test_health_endpoint_returns_ok() -> None:
    """Sans paramètre ni résultat, vérifie le statut 200 et le JSON exact attendu."""
    # TestClient appelle l'application en mémoire : aucun serveur réseau n'est nécessaire.
    with TestClient(create_app()) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_endpoint_is_documented_in_openapi() -> None:
    """Sans paramètre ni résultat, vérifie que le contrat de santé est documenté."""
    with TestClient(create_app()) as client:
        response = client.get("/openapi.json")

    assert response.status_code == 200
    # Le schéma public doit indiquer le nom de l'API et une réponse de succès.
    schema = response.json()
    assert schema["info"]["title"] == "TerriMaint API"
    assert "200" in schema["paths"]["/api/v1/health"]["get"]["responses"]
