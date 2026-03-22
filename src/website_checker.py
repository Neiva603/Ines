"""
Verifica a qualidade de websites de negócios.
Classifica como: sem website, fraco, ou bom.
"""

import re
import httpx
import tldextract
from bs4 import BeautifulSoup


SINAIS_WEBSITE_FRACO = [
    "wix.com", "weebly.com", "jimdo.com", "webnode.pt", "webnode.com",
    "blogspot.com", "wordpress.com", "sapo.pt/~", "web.app",
]

TIMEOUT = 8


def verificar_website(url: str) -> dict:
    """
    Verifica se um website existe e avalia a sua qualidade.
    Retorna: {"tem_website": bool, "qualidade": "sem"|"fraco"|"bom", "motivo": str}
    """
    if not url:
        return {"tem_website": False, "qualidade": "sem", "motivo": "Sem website registado"}

    url = url.strip()
    if not url.startswith("http"):
        url = "https://" + url

    # Verificar se é plataforma gratuita (website fraco)
    for plataforma in SINAIS_WEBSITE_FRACO:
        if plataforma in url:
            return {
                "tem_website": True,
                "qualidade": "fraco",
                "motivo": f"Website em plataforma gratuita: {plataforma}",
            }

    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        }
        resp = httpx.get(url, timeout=TIMEOUT, follow_redirects=True, headers=headers)

        if resp.status_code >= 400:
            return {
                "tem_website": True,
                "qualidade": "fraco",
                "motivo": f"Website com erro HTTP {resp.status_code}",
            }

        soup = BeautifulSoup(resp.text, "lxml")
        pontuacao = _avaliar_conteudo(soup, resp.text)

        if pontuacao <= 2:
            return {
                "tem_website": True,
                "qualidade": "fraco",
                "motivo": f"Website com pouco conteúdo (pontuação: {pontuacao}/10)",
            }

        return {
            "tem_website": True,
            "qualidade": "bom",
            "motivo": f"Website com bom conteúdo (pontuação: {pontuacao}/10)",
        }

    except (httpx.ConnectError, httpx.TimeoutException):
        return {
            "tem_website": True,
            "qualidade": "fraco",
            "motivo": "Website inacessível ou com erro de ligação",
        }
    except Exception as e:
        return {
            "tem_website": True,
            "qualidade": "fraco",
            "motivo": f"Erro ao verificar: {str(e)[:60]}",
        }


def _avaliar_conteudo(soup: BeautifulSoup, html: str) -> int:
    """Avalia a qualidade do website de 0 a 10."""
    pontos = 0

    # Tem título
    titulo = soup.find("title")
    if titulo and len(titulo.text.strip()) > 5:
        pontos += 1

    # Tem meta description
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc and meta_desc.get("content", ""):
        pontos += 1

    # Tem imagens
    imagens = soup.find_all("img")
    if len(imagens) >= 2:
        pontos += 1

    # Tem texto suficiente
    texto = soup.get_text(separator=" ", strip=True)
    palavras = len(texto.split())
    if palavras > 100:
        pontos += 1
    if palavras > 300:
        pontos += 1

    # Tem mais de uma página (navegação)
    links_internos = soup.find_all("a", href=True)
    hrefs_internos = [
        a["href"] for a in links_internos
        if not a["href"].startswith("http") or tldextract.extract(a["href"]).domain
        == tldextract.extract(soup.find("base", href=True)["href"] if soup.find("base", href=True) else "").domain
    ]
    if len(hrefs_internos) > 3:
        pontos += 1

    # Tem contacto
    if re.search(r"\+?351\s?\d{9}|\d{9}", texto):
        pontos += 1

    # Tem CSS externo (não só inline)
    if soup.find("link", rel="stylesheet"):
        pontos += 1

    # Responsive (viewport meta)
    viewport = soup.find("meta", attrs={"name": "viewport"})
    if viewport:
        pontos += 1

    # Tem formulário ou CTA
    if soup.find("form") or re.search(r"contact|contacto|reserva|orçamento", texto, re.IGNORECASE):
        pontos += 1

    return pontos
