"""
Envia o email diário com o vídeo a publicar hoje + ganchos, legendas e hashtags
prontos a copiar para o Instagram e o TikTok.
"""

import logging
import smtplib
from datetime import date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def enviar_pacote_diario(
    ficheiro_video: str,
    pacote: dict,
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_password: str,
    email_destino: str,
    dias_restantes: int,
) -> bool:
    hoje = date.today().strftime("%d/%m/%Y")
    assunto = f"🎬 Publicação de hoje pronta — {hoje}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = assunto
    msg["From"] = smtp_user
    msg["To"] = email_destino

    msg.attach(MIMEText(_gerar_texto(ficheiro_video, pacote, hoje, dias_restantes), "plain", "utf-8"))
    msg.attach(MIMEText(_gerar_html(ficheiro_video, pacote, hoje, dias_restantes), "html", "utf-8"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, email_destino, msg.as_string())
        logger.info(f"Email da publicação diária enviado para {email_destino}")
        return True
    except Exception as e:
        logger.error(f"Erro ao enviar email: {e}")
        return False


def _bloco(titulo: str, cor: str, conteudo_html: str) -> str:
    return f"""
    <div style="background:#f8f9fa;border-left:4px solid {cor};padding:16px 20px;
                border-radius:6px;margin-bottom:20px">
        <h3 style="margin:0 0 10px;color:#2c3e50">{titulo}</h3>
        {conteudo_html}
    </div>"""


def _caixa_texto(texto: str) -> str:
    texto_html = texto.replace("\n", "<br>")
    return f"""
    <div style="background:white;border:1px solid #ddd;border-radius:5px;padding:14px;
                white-space:pre-wrap;color:#333;font-size:14px;line-height:1.5">
        {texto_html}
    </div>"""


def _gerar_html(ficheiro_video: str, pacote: dict, hoje: str, dias_restantes: int) -> str:
    ganchos_html = "".join(
        f'<li><strong>[{g["categoria"]}]</strong> {g["texto"]}</li>'
        for g in pacote["ganchos_alternativos"]
    )

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px">

    <div style="background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045);
                color:white;padding:30px;border-radius:10px;margin-bottom:25px;text-align:center">
        <h1 style="margin:0;font-size:26px">🎬 Publicação de hoje</h1>
        <p style="margin:10px 0 0;opacity:0.95">{hoje}</p>
    </div>

    <div style="background:#eaf4fb;border-left:4px solid #3498db;padding:15px;
                border-radius:5px;margin-bottom:25px">
        <strong>📁 Vídeo:</strong> {ficheiro_video}<br>
        <span style="color:#7f8c8d;font-size:13px">
            Tema: {pacote['tema']} · Fonte do conteúdo: {pacote.get('fonte', 'templates')} ·
            Restam {dias_restantes} vídeo(s) na fila
        </span>
    </div>

    {_bloco("🪝 Ganchos alternativos (escolhe o que preferires)", "#f39c12",
            f"<ul style='margin:0;padding-left:20px;color:#333'>{ganchos_html}</ul>")}

    {_bloco("📸 Legenda para o Instagram Reels", "#e1306c",
            _caixa_texto(pacote["legenda_instagram"]))}

    {_bloco("🎵 Legenda para o TikTok", "#010101",
            _caixa_texto(pacote["legenda_tiktok"]))}

    {_bloco("⏰ Melhor hora para publicar", "#27ae60",
            f"<p style='margin:0;color:#333'>{pacote['melhor_hora']}</p>")}

    <div style="background:#fff8e1;border:1px solid #ffe082;padding:16px 20px;
                border-radius:6px;margin-top:10px">
        <strong>✅ Checklist rápido:</strong>
        <ol style="margin:8px 0 0;padding-left:20px;color:#555;font-size:14px">
            <li>Abre o Instagram/TikTok e carrega o ficheiro <code>{ficheiro_video}</code></li>
            <li>Cola a legenda correspondente à plataforma</li>
            <li>Confirma que só há UM call-to-action na legenda</li>
            <li>Publica próximo da hora sugerida acima</li>
        </ol>
    </div>

    <p style="text-align:center;color:#bdc3c7;font-size:12px;margin-top:30px">
        Social Media Autopilot — publicação diária automática
    </p>
</body>
</html>"""


def _gerar_texto(ficheiro_video: str, pacote: dict, hoje: str, dias_restantes: int) -> str:
    linhas = [
        f"Publicação de hoje — {hoje}",
        "=" * 60,
        f"Vídeo: {ficheiro_video}",
        f"Tema: {pacote['tema']}",
        f"Restam {dias_restantes} vídeo(s) na fila",
        "",
        "GANCHOS ALTERNATIVOS:",
    ]
    for g in pacote["ganchos_alternativos"]:
        linhas.append(f"  [{g['categoria']}] {g['texto']}")

    linhas += [
        "",
        "LEGENDA INSTAGRAM:",
        pacote["legenda_instagram"],
        "",
        "LEGENDA TIKTOK:",
        pacote["legenda_tiktok"],
        "",
        f"Melhor hora para publicar: {pacote['melhor_hora']}",
    ]
    return "\n".join(linhas)
