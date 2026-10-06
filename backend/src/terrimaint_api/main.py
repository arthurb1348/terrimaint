"""Construit l'API FastAPI et expose son endpoint de santé HTTP."""

from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Décrit la réponse JSON : ``status`` ne peut contenir que la valeur ``ok``.

    Pydantic valide ce contrat et FastAPI l'ajoute à la documentation OpenAPI.
    """

    status: Literal["ok"] = "ok"


def create_app() -> FastAPI:
    """Sans paramètre, retourne une nouvelle application prête à recevoir des requêtes.

    Une fabrique permet aux tests de créer une application indépendante du serveur.
    """

    app = FastAPI(title="TerriMaint API", version="0.1.0")

    @app.get("/api/v1/health", response_model=HealthResponse, tags=["health"])
    def health() -> HealthResponse:
        """Sans paramètre, retourne un modèle sérialisé en JSON avec un statut HTTP 200.

        Ce contrôle prouve que le processus répond, sans tester une base de données.
        Aucune erreur métier n'est traitée ici : cet endpoint ne dépend d'aucun service.
        """
        return HealthResponse()

    return app


# Uvicorn importe cet objet via « terrimaint_api.main:app » pour servir l'API.
app = create_app()
