# Dockerfile pour Flo AI API - Structure propre
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY aurora_ai/ ./aurora_ai/
COPY api.py .

# Créer un utilisateur non-root
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Exposer le port
EXPOSE 8000

# Commande de démarrage
CMD ["python", "api.py"]

