"""Expose l'application ASGI sans imposer de serveur de déploiement."""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "terrimaint_api.settings")
application = get_asgi_application()
