"""
Envia o email diário com os 20 contactos de WhatsApp.
"""

import smtplib
import logging
from datetime import date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def enviar_email_diario(
    contactos: list[dict],
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_password: str,
    email_destino: str,
) -> bool:
    """
    Envia email com os contactos do dia.
    Retorna True se enviado com sucesso.
    """
    if not contactos:
        logger.warning("Nenhum contacto para enviar hoje.")
        return False

    hoje = date.today().strftime("%d/%m/%Y")
    assunto = f"🎯 {len(contactos)} Potenciais Clientes para Websites - {hoje}"

    html = _gerar_html(contactos, hoje)
    texto = _gerar_texto(contactos, hoje)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = assunto
    msg["From"] = smtp_user
    msg["To"] = email_destino

    msg.attach(MIMEText(texto, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, email_destino, msg.as_string())

        logger.info(f"Email enviado com {len(contactos)} contactos para {email_destino}")
        return True

    except Exception as e:
        logger.error(f"Erro ao enviar email: {e}")
        return False


def _gerar_html(contactos: list[dict], hoje: str) -> str:
    linhas = ""
    for i, c in enumerate(contactos, 1):
        cor_badge = "#e74c3c" if c["estado_website"] == "sem" else "#f39c12"
        label = "SEM WEBSITE" if c["estado_website"] == "sem" else "WEBSITE FRACO"
        whatsapp_url = f"https://wa.me/{c['telefone'].replace('+', '')}"

        linhas += f"""
        <tr style="background:{'#f9f9f9' if i % 2 == 0 else '#ffffff'}">
            <td style="padding:12px;font-weight:bold;color:#2c3e50">{i}. {c['nome']}</td>
            <td style="padding:12px">
                <a href="{whatsapp_url}" target="_blank"
                   style="background:#25D366;color:white;padding:6px 12px;
                          border-radius:20px;text-decoration:none;font-weight:bold">
                    📱 {c['telefone']}
                </a>
            </td>
            <td style="padding:12px;color:#7f8c8d">{c['categoria']}</td>
            <td style="padding:12px;color:#7f8c8d">{c['regiao']}</td>
            <td style="padding:12px">
                <span style="background:{cor_badge};color:white;padding:3px 8px;
                             border-radius:10px;font-size:11px;font-weight:bold">
                    {label}
                </span>
            </td>
            <td style="padding:12px">
                <a href="{c['google_maps_url']}" target="_blank"
                   style="color:#3498db;text-decoration:none">Ver no Maps</a>
            </td>
        </tr>"""

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:1000px;margin:0 auto;padding:20px">

    <div style="background:linear-gradient(135deg,#2c3e50,#3498db);
                color:white;padding:30px;border-radius:10px;margin-bottom:30px;text-align:center">
        <h1 style="margin:0;font-size:28px">🌐 AI Business Portugal</h1>
        <p style="margin:10px 0 0;font-size:16px;opacity:0.9">
            Potenciais clientes para criação de website — {hoje}
        </p>
    </div>

    <div style="background:#eaf4fb;border-left:4px solid #3498db;
                padding:15px;border-radius:5px;margin-bottom:25px">
        <strong>✅ {len(contactos)} contactos selecionados hoje</strong><br>
        <span style="color:#7f8c8d;font-size:14px">
            Negócios sem website ou com website fraco em Portugal, Açores e Madeira.
            Clica no número para abrir o WhatsApp diretamente.
        </span>
    </div>

    <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;
                  box-shadow:0 2px 10px rgba(0,0,0,0.1)">
        <thead>
            <tr style="background:#2c3e50;color:white">
                <th style="padding:14px;text-align:left">Negócio</th>
                <th style="padding:14px;text-align:left">WhatsApp</th>
                <th style="padding:14px;text-align:left">Categoria</th>
                <th style="padding:14px;text-align:left">Região</th>
                <th style="padding:14px;text-align:left">Estado</th>
                <th style="padding:14px;text-align:left">Localização</th>
            </tr>
        </thead>
        <tbody>
            {linhas}
        </tbody>
    </table>

    <div style="background:#f8f9fa;border:1px solid #dee2e6;
                padding:20px;border-radius:8px;margin-top:30px">
        <h3 style="margin:0 0 10px;color:#2c3e50">💬 Mensagem sugerida para WhatsApp</h3>
        <p style="background:white;padding:15px;border-radius:5px;border:1px solid #ddd;
                  font-style:italic;color:#555;margin:0">
            Olá! Vi que o vosso negócio ainda não tem website (ou o website atual pode ser melhorado).
            Tenho uma proposta para criar um site profissional para vocês por um preço acessível.
            Posso enviar mais informações? 🚀
        </p>
    </div>

    <p style="text-align:center;color:#bdc3c7;font-size:12px;margin-top:30px">
        AI Business Portugal — Automação de leads diária
    </p>
</body>
</html>"""


def _gerar_texto(contactos: list[dict], hoje: str) -> str:
    linhas = [f"AI Business Portugal - {len(contactos)} Contactos - {hoje}", "=" * 60, ""]
    for i, c in enumerate(contactos, 1):
        wa = f"https://wa.me/{c['telefone'].replace('+', '')}"
        linhas.append(f"{i}. {c['nome']}")
        linhas.append(f"   Tel/WhatsApp: {c['telefone']}")
        linhas.append(f"   WhatsApp link: {wa}")
        linhas.append(f"   Categoria: {c['categoria']}")
        linhas.append(f"   Região: {c['regiao']}")
        linhas.append(f"   Estado: {c['estado_website'].upper()}")
        linhas.append(f"   Maps: {c['google_maps_url']}")
        linhas.append("")
    return "\n".join(linhas)
