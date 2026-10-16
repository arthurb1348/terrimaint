"""Point d'entrée des commandes Django, depuis la racine du dépôt."""

import os
import sys

from django.core.management import execute_from_command_line

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "terrimaint_api.settings")
    execute_from_command_line(sys.argv)
