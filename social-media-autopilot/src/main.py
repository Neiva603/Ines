"""
Social Media Autopilot — gera e entrega a publicação diária (Reels/TikTok) para
vender produtos digitais.

Uso:
    python main.py                          → executa o envio diário (usado pelo cron)
    python main.py adicionar <video> "<tema>"        → adiciona 1 vídeo à fila
    python main.py adicionar-pasta <pasta> [temas.csv] → adiciona vários vídeos de uma vez
    python main.py fila                      → mostra o estado da fila
"""

import logging
import os
import sys
from datetime import datetime

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from email_sender import enviar_pacote_diario
from fila_videos import adicionar_lote, adicionar_video, estado_fila, marcar_publicado, proximo_video
from gerador_conteudo import gerar

log_dir = os.path.join(os.path.dirname(__file__), "..", "logs")
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(log_dir, "automacao.log"), encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


def executar():
    logger.info("=" * 60)
    logger.info("A gerar a publicação diária...")
    logger.info(f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M')}")

    video = proximo_video()
    if not video:
        logger.warning(
            "A fila está vazia! Adiciona vídeos com: "
            "python main.py adicionar <video> \"<tema>\""
        )
        return

    idioma = os.getenv("IDIOMA", "en")
    nicho = os.getenv("NICHO", "pet page monetization with digital products")
    produto = os.getenv("NOME_PRODUTO", "digital products for pet page owners")
    palavra_chave = os.getenv("PALAVRA_CHAVE_CTA", "PET")
    link_bio = os.getenv("LINK_BIO", "")

    pacote = gerar(
        tema=video["tema"],
        nicho=nicho,
        produto=produto,
        palavra_chave=palavra_chave,
        link_bio=link_bio,
        idioma=idioma,
    )
    logger.info(f"Conteúdo gerado ({pacote['fonte']}) para o vídeo: {video['ficheiro']}")

    smtp_password = os.getenv("SMTP_PASSWORD")
    if smtp_password:
        sucesso = enviar_pacote_diario(
            ficheiro_video=video["ficheiro"],
            pacote=pacote,
            smtp_host=os.getenv("SMTP_HOST", "smtp.gmail.com"),
            smtp_port=int(os.getenv("SMTP_PORT", "587")),
            smtp_user=os.getenv("SMTP_USER"),
            smtp_password=smtp_password,
            email_destino=os.getenv("EMAIL_DESTINO"),
            dias_restantes=estado_fila()["pendentes"],
        )
        if not sucesso:
            logger.error("Falha no envio do email com a publicação diária.")
    else:
        logger.info("SMTP_PASSWORD não configurada — a saltar envio de email.")

    if os.getenv("AUTO_PUBLICAR", "false").lower() == "true":
        _tentar_publicar_automaticamente(video, pacote)

    marcar_publicado(video["ficheiro"])
    logger.info("Concluído.")
    logger.info("=" * 60)


def _tentar_publicar_automaticamente(video: dict, pacote: dict):
    caminho_video = os.path.join(os.path.dirname(__file__), "..", "videos", video["ficheiro"])

    ig_token = os.getenv("IG_ACCESS_TOKEN")
    ig_conta = os.getenv("IG_BUSINESS_ACCOUNT_ID")
    video_base_url = os.getenv("VIDEO_PUBLIC_BASE_URL")
    if ig_token and ig_conta and video_base_url:
        try:
            from instagram_publisher import publicar_reel
            video_url = f"{video_base_url.rstrip('/')}/{video['ficheiro']}"
            publicar_reel(video_url, pacote["legenda_instagram"], ig_conta, ig_token)
        except Exception as e:
            logger.error(f"Falha ao publicar automaticamente no Instagram: {e}")
    else:
        logger.info("Publicação automática no Instagram não configurada (ver .env.example).")

    tiktok_token = os.getenv("TIKTOK_ACCESS_TOKEN")
    if tiktok_token:
        try:
            from tiktok_publisher import publicar_video
            privacy = os.getenv("TIKTOK_PRIVACY_LEVEL", "SELF_ONLY")
            publicar_video(caminho_video, pacote["legenda_tiktok"], tiktok_token, privacy)
        except Exception as e:
            logger.error(f"Falha ao publicar automaticamente no TikTok: {e}")
    else:
        logger.info("Publicação automática no TikTok não configurada (ver .env.example).")


def _cli():
    args = sys.argv[1:]

    if not args:
        executar()
        return

    comando = args[0]

    if comando == "adicionar" and len(args) >= 3:
        entrada = adicionar_video(args[1], " ".join(args[2:]))
        print(f"✅ Adicionado à fila: {entrada['ficheiro']} — tema: {entrada['tema']}")

    elif comando == "adicionar-pasta" and len(args) >= 2:
        ficheiro_temas = args[2] if len(args) >= 3 else None
        adicionados = adicionar_lote(args[1], ficheiro_temas)
        print(f"✅ {len(adicionados)} vídeo(s) adicionados à fila:")
        for v in adicionados:
            print(f"   - {v['ficheiro']} — tema: {v['tema']}")

    elif comando == "fila":
        estado = estado_fila()
        print(f"📋 Fila de publicações:")
        print(f"   Total: {estado['total']}")
        print(f"   Pendentes: {estado['pendentes']} (dá para {estado['dias_restantes']} dias)")
        print(f"   Já publicados: {estado['publicados']}")
        print(f"   Próximo: {estado['proximo'] or '(fila vazia)'}")

    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    _cli()
