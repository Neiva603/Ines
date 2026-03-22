"""
Gestão de contactos já enviados para evitar repetição.
"""

import json
import os
import logging
from datetime import date, datetime

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "contactos_enviados.json")


def _carregar() -> dict:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if not os.path.exists(DB_PATH):
        return {"enviados": [], "historico": []}
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _guardar(data: dict):
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def telefones_ja_enviados() -> set:
    """Retorna conjunto de telefones já enviados anteriormente."""
    data = _carregar()
    return set(data.get("enviados", []))


def registar_envio(contactos: list[dict]):
    """Regista os contactos enviados hoje."""
    data = _carregar()
    hoje = date.today().isoformat()

    telefones_novos = [c["telefone"] for c in contactos]
    data["enviados"] = list(set(data.get("enviados", []) + telefones_novos))

    data.setdefault("historico", []).append({
        "data": hoje,
        "timestamp": datetime.now().isoformat(),
        "total": len(contactos),
        "contactos": contactos,
    })

    _guardar(data)
    logger.info(f"Registados {len(contactos)} contactos no histórico.")


def estatisticas() -> dict:
    """Retorna estatísticas gerais."""
    data = _carregar()
    historico = data.get("historico", [])
    return {
        "total_enviados": len(data.get("enviados", [])),
        "dias_com_envio": len(historico),
        "ultimo_envio": historico[-1]["data"] if historico else "nunca",
    }
