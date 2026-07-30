"""
Publicação automática via TikTok Content Posting API (opcional/avançado).

Requisitos reais da API (não há forma de contornar isto):
- App aprovada no TikTok for Developers com o scope "video.publish".
- Enquanto a app não for auditada pelo TikTok, os vídeos publicados por API
  só podem ficar como rascunho/privado (privacy_level=SELF_ONLY) — é uma
  limitação da plataforma, não deste sistema.
- Access token OAuth2 válido da conta TikTok.

Este módulo usa o método FILE_UPLOAD (envio directo do ficheiro em chunks),
que não exige alojamento público do vídeo.

Ver: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
"""

import logging
import os

import requests

logger = logging.getLogger(__name__)

API_BASE_URL = "https://open.tiktokapis.com/v2"
CHUNK_SIZE = 10 * 1024 * 1024  # 10MB, dentro dos limites da API


def publicar_video(caminho_video: str, legenda: str, access_token: str,
                    privacy_level: str = "SELF_ONLY") -> dict:
    """
    Inicia, envia e finaliza a publicação de um vídeo no TikTok.
    privacy_level: "SELF_ONLY" (privado, funciona sem auditoria) ou
    "PUBLIC_TO_EVERYONE" (requer app auditada pelo TikTok).
    """
    tamanho_video = os.path.getsize(caminho_video)
    total_chunks = max(1, (tamanho_video + CHUNK_SIZE - 1) // CHUNK_SIZE)

    init_resp = requests.post(
        f"{API_BASE_URL}/post/publish/video/init/",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8",
        },
        json={
            "post_info": {
                "title": legenda,
                "privacy_level": privacy_level,
                "disable_duet": False,
                "disable_comment": False,
                "disable_stitch": False,
            },
            "source_info": {
                "source": "FILE_UPLOAD",
                "video_size": tamanho_video,
                "chunk_size": min(CHUNK_SIZE, tamanho_video),
                "total_chunk_count": total_chunks,
            },
        },
        timeout=30,
    ).json()

    if "data" not in init_resp or "publish_id" not in init_resp["data"]:
        raise RuntimeError(f"Falha ao iniciar publicação no TikTok: {init_resp}")

    publish_id = init_resp["data"]["publish_id"]
    upload_url = init_resp["data"]["upload_url"]

    with open(caminho_video, "rb") as f:
        conteudo = f.read()

    fim = min(CHUNK_SIZE, tamanho_video) - 1
    upload_resp = requests.put(
        upload_url,
        headers={
            "Content-Type": "video/mp4",
            "Content-Range": f"bytes 0-{fim}/{tamanho_video}",
        },
        data=conteudo[:CHUNK_SIZE] if total_chunks > 1 else conteudo,
        timeout=120,
    )

    if upload_resp.status_code not in (200, 201):
        raise RuntimeError(f"Falha ao enviar vídeo para o TikTok: {upload_resp.text}")

    logger.info(f"Vídeo enviado ao TikTok. publish_id={publish_id} (privacy={privacy_level})")
    return {"publish_id": publish_id, "privacy_level": privacy_level}
