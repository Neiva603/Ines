"""
Automação principal — executa a pesquisa e envia o email diário.
Pode ser executado manualmente ou agendado com cron/systemd.
"""

import os
import sys
import logging
import random
from datetime import datetime
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from google_maps_scraper import buscar_negocios
from email_sender import enviar_email_diario
from storage import telefones_ja_enviados, registar_envio, estatisticas

# Configurar logging
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
    logger.info("A iniciar automação de leads diária...")
    logger.info(f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M')}")

    # Carregar configuração
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    email_destino = os.getenv("EMAIL_DESTINO", "ai.businessportugal@gmail.com")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    contactos_por_dia = int(os.getenv("CONTACTOS_POR_DIA", "20"))

    if not api_key:
        logger.error("GOOGLE_MAPS_API_KEY não configurada! Ver ficheiro .env")
        sys.exit(1)

    if not smtp_password:
        logger.error("SMTP_PASSWORD não configurada! Ver ficheiro .env")
        sys.exit(1)

    # Buscar negócios
    logger.info("A pesquisar negócios no Google Maps...")
    todos = buscar_negocios(api_key, quantidade=contactos_por_dia * 3)
    logger.info(f"Total encontrados antes de filtrar: {len(todos)}")

    # Filtrar já enviados
    ja_enviados = telefones_ja_enviados()
    novos = [c for c in todos if c["telefone"] not in ja_enviados]
    logger.info(f"Após filtrar já enviados: {len(novos)} novos contactos")

    if not novos:
        logger.warning("Sem contactos novos hoje. Tente aumentar as regiões/categorias.")
        return

    # Selecionar os melhores (priorizar sem website > fraco)
    sem_website = [c for c in novos if c["estado_website"] == "sem"]
    website_fraco = [c for c in novos if c["estado_website"] == "fraco"]

    random.shuffle(sem_website)
    random.shuffle(website_fraco)

    selecionados = (sem_website + website_fraco)[:contactos_por_dia]
    logger.info(f"Selecionados: {len(selecionados)} contactos "
                f"({len([c for c in selecionados if c['estado_website'] == 'sem'])} sem website, "
                f"{len([c for c in selecionados if c['estado_website'] == 'fraco'])} website fraco)")

    # Enviar email
    logger.info(f"A enviar email para {email_destino}...")
    sucesso = enviar_email_diario(
        contactos=selecionados,
        smtp_host=smtp_host,
        smtp_port=smtp_port,
        smtp_user=smtp_user,
        smtp_password=smtp_password,
        email_destino=email_destino,
    )

    if sucesso:
        registar_envio(selecionados)
        stats = estatisticas()
        logger.info(f"Concluído com sucesso!")
        logger.info(f"Estatísticas: {stats['total_enviados']} contactos enviados no total, "
                    f"{stats['dias_com_envio']} dias de envio")
    else:
        logger.error("Falha no envio do email!")

    logger.info("=" * 60)


if __name__ == "__main__":
    executar()
