"""
Aurora AI package - Réexporte depuis aurora_ai.aurora_ai pour compatibilité
"""
# Réexporter les sous-modules pour que aurora_ai.builder fonctionne
from aurora_ai import aurora_ai

# Réexporter les modules principaux
import sys
import importlib

# Créer des alias pour les sous-modules
sys.modules['aurora_ai.builder'] = importlib.import_module('aurora_ai.aurora_ai.builder')
sys.modules['aurora_ai.llm'] = importlib.import_module('aurora_ai.aurora_ai.llm')
sys.modules['aurora_ai.models'] = importlib.import_module('aurora_ai.aurora_ai.models')
sys.modules['aurora_ai.arium'] = importlib.import_module('aurora_ai.aurora_ai.arium')

# Réexporter tout depuis aurora_ai.aurora_ai
from aurora_ai.aurora_ai import *

