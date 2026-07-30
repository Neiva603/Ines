"""
Gestão da fila de vídeos a publicar — permite adicionar vários vídeos de uma vez
(um por dia, por ordem) e evita publicar o mesmo vídeo duas vezes.
"""

import csv
import json
import logging
import os
import shutil
from datetime import datetime

logger = logging.getLogger(__name__)

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
VIDEOS_DIR = os.path.join(BASE_DIR, "videos")
FILA_PATH = os.path.join(BASE_DIR, "data", "fila_videos.json")
EXTENSOES_VALIDAS = (".mp4", ".mov", ".m4v")


def _carregar() -> dict:
    os.makedirs(os.path.dirname(FILA_PATH), exist_ok=True)
    if not os.path.exists(FILA_PATH):
        return {"fila": []}
    with open(FILA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _guardar(data: dict):
    with open(FILA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def adicionar_video(caminho_origem: str, tema: str) -> dict:
    """
    Copia o vídeo para a pasta videos/ (se ainda não lá estiver) e adiciona-o
    ao fim da fila com o tema/descrição indicado.
    """
    if not os.path.exists(caminho_origem):
        raise FileNotFoundError(f"Vídeo não encontrado: {caminho_origem}")

    os.makedirs(VIDEOS_DIR, exist_ok=True)
    nome_ficheiro = os.path.basename(caminho_origem)
    destino = os.path.join(VIDEOS_DIR, nome_ficheiro)

    if os.path.abspath(caminho_origem) != os.path.abspath(destino):
        shutil.copy2(caminho_origem, destino)

    entrada = {
        "ficheiro": nome_ficheiro,
        "tema": tema,
        "adicionado_em": datetime.now().isoformat(),
        "publicado": False,
        "publicado_em": None,
    }

    data = _carregar()
    data["fila"].append(entrada)
    _guardar(data)
    logger.info(f"Vídeo adicionado à fila: {nome_ficheiro} — tema: {tema}")
    return entrada


def adicionar_lote(pasta: str, ficheiro_temas: str | None = None) -> list[dict]:
    """
    Adiciona todos os vídeos de uma pasta à fila de uma só vez.

    ficheiro_temas (opcional): CSV com colunas "ficheiro,tema" para dar um tema
    específico a cada vídeo. Vídeos sem entrada no CSV usam o nome do ficheiro
    como tema.
    """
    temas_por_ficheiro = {}
    if ficheiro_temas and os.path.exists(ficheiro_temas):
        with open(ficheiro_temas, "r", encoding="utf-8") as f:
            for linha in csv.DictReader(f):
                temas_por_ficheiro[linha["ficheiro"]] = linha["tema"]

    adicionados = []
    for nome in sorted(os.listdir(pasta)):
        if not nome.lower().endswith(EXTENSOES_VALIDAS):
            continue
        tema = temas_por_ficheiro.get(nome, os.path.splitext(nome)[0].replace("_", " "))
        entrada = adicionar_video(os.path.join(pasta, nome), tema)
        adicionados.append(entrada)

    logger.info(f"{len(adicionados)} vídeo(s) adicionados em lote a partir de {pasta}")
    return adicionados


def proximo_video() -> dict | None:
    """Retorna o próximo vídeo não publicado (ordem de entrada na fila, FIFO)."""
    data = _carregar()
    for entrada in data["fila"]:
        if not entrada["publicado"]:
            return entrada
    return None


def marcar_publicado(ficheiro: str):
    data = _carregar()
    for entrada in data["fila"]:
        if entrada["ficheiro"] == ficheiro and not entrada["publicado"]:
            entrada["publicado"] = True
            entrada["publicado_em"] = datetime.now().isoformat()
            break
    _guardar(data)
    logger.info(f"Vídeo marcado como publicado: {ficheiro}")


def estado_fila() -> dict:
    data = _carregar()
    pendentes = [e for e in data["fila"] if not e["publicado"]]
    publicados = [e for e in data["fila"] if e["publicado"]]
    return {
        "total": len(data["fila"]),
        "pendentes": len(pendentes),
        "publicados": len(publicados),
        "proximo": pendentes[0]["ficheiro"] if pendentes else None,
        "dias_restantes": len(pendentes),
    }
