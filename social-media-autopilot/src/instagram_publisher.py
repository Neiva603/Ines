"""
Publicação automática de Reels via Instagram Graph API (opcional/avançado).

Requisitos reais da API (não há forma de contornar isto):
- Conta Instagram Business/Creator ligada a uma Página do Facebook.
- App na Meta for Developers com o produto "Instagram Graph API".
- Access token de longa duração com permissões instagram_content_publish.
- O vídeo tem de estar acessível num URL público (a API não aceita upload
  binário directo) — usa um serviço como Cloudinary, Bunny.net, S3, etc., e
  define VIDEO_PUBLIC_BASE_URL no .env a apontar para onde alojas os vídeos.

Ver: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/reels
"""

import logging
import time

import requests

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = "v19.0"
GRAPH_BASE_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


def publicar_reel(video_url: str, legenda: str, ig_business_account_id: str,
                   access_token: str, timeout_segundos: int = 180) -> dict:
    """
    Cria o container do Reel e publica-o. Lança RuntimeError se algo falhar.
    Retorna o resultado da API com o ID da publicação criada.
    """
    criacao = requests.post(
        f"{GRAPH_BASE_URL}/{ig_business_account_id}/media",
        data={
            "media_type": "REELS",
            "video_url": video_url,
            "caption": legenda,
            "access_token": access_token,
        },
        timeout=30,
    ).json()

    if "id" not in criacao:
        raise RuntimeError(f"Falha ao criar container do Reel: {criacao}")

    creation_id = criacao["id"]
    logger.info(f"Container do Reel criado: {creation_id}. A aguardar processamento...")

    inicio = time.time()
    while time.time() - inicio < timeout_segundos:
        estado = requests.get(
            f"{GRAPH_BASE_URL}/{creation_id}",
            params={"fields": "status_code", "access_token": access_token},
            timeout=30,
        ).json()
        status_code = estado.get("status_code")

        if status_code == "FINISHED":
            break
        if status_code == "ERROR":
            raise RuntimeError(f"Processamento do vídeo falhou: {estado}")
        time.sleep(5)
    else:
        raise RuntimeError("Tempo limite excedido a aguardar processamento do vídeo.")

    publicacao = requests.post(
        f"{GRAPH_BASE_URL}/{ig_business_account_id}/media_publish",
        data={"creation_id": creation_id, "access_token": access_token},
        timeout=30,
    ).json()

    if "id" not in publicacao:
        raise RuntimeError(f"Falha ao publicar o Reel: {publicacao}")

    logger.info(f"Reel publicado com sucesso: {publicacao['id']}")
    return publicacao
