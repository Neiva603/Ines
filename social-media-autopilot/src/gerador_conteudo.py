"""
Gerador de ganchos, legendas e hashtags para Reels/TikTok de venda de produtos digitais.

Combina duas fontes:
1. Banco de fórmulas de copywriting testadas em vídeo curto (sempre disponível, sem custos).
2. Geração assistida por IA (Claude) quando ANTHROPIC_API_KEY está configurada — usa o
   tema do vídeo do dia para personalizar ganchos e legendas.
"""

import json
import logging
import os
import random
from collections import defaultdict

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Banco de ganchos (primeiras 1-3 palavras/segundos do vídeo — o que decide se
# a pessoa continua a ver ou passa à frente). Cada categoria explora um gatilho
# psicológico diferente para não caimos sempre no mesmo tipo de abertura.
# ---------------------------------------------------------------------------

GANCHOS = {
    "curiosidade": [
        "Ninguém te vai contar isto sobre {tema}.",
        "Descobri isto sobre {tema} e mudou tudo.",
        "Isto sobre {tema} devia ser proibido.",
        "O segredo de {tema} que ninguém partilha.",
        "Pausa. Isto sobre {tema} vai-te surpreender.",
    ],
    "dor_solucao": [
        "Se ainda fazes {tema} assim, estás a perder dinheiro.",
        "Cansado(a) de tentar {tema} sem resultados? Vê isto.",
        "Foi assim que resolvi o maior problema com {tema}.",
        "Achas que {tema} é difícil? Só porque ninguém te mostrou isto.",
        "Isto acaba com a tua maior dor à volta de {tema}.",
    ],
    "prova_social": [
        "+500 pessoas já usaram isto para {tema}.",
        "Isto ajudou centenas de pessoas a resolver {tema}.",
        "Os meus clientes pediram-me para gravar isto sobre {tema}.",
        "O resultado que mais me pedem para explicar: {tema}.",
        "Isto é o que separa quem consegue {tema} de quem não consegue.",
    ],
    "contraintuitivo": [
        "Para {tema}, esquece tudo o que te ensinaram.",
        "A forma como aprendeste {tema} está errada.",
        "Fazer menos é a chave para {tema}. Explico.",
        "O erro nº1 em {tema} é o que toda a gente faz.",
        "{tema} não precisa ser complicado — só te venderam essa ideia.",
    ],
    "urgencia": [
        "Só vou explicar isto sobre {tema} uma vez.",
        "Guarda já este vídeo sobre {tema} antes que desapareça.",
        "Isto sobre {tema} só está disponível esta semana.",
        "Se queres {tema} feito certo, vê isto até ao fim.",
        "Última vez que explico {tema} desta forma.",
    ],
    "pergunta": [
        "Sabias que dá para resolver {tema} em minutos?",
        "Já tentaste {tema} e não resultou?",
        "Queres finalmente perceber {tema}?",
        "E se {tema} fosse mais simples do que pensas?",
        "Quantas vezes já tentaste {tema} sem sucesso?",
    ],
    "lista": [
        "3 erros que todos cometem em {tema}.",
        "2 passos para resolver {tema} hoje.",
        "5 minutos para perceberes {tema}.",
        "1 truque que muda tudo em {tema}.",
        "3 coisas que ninguém te disse sobre {tema}.",
    ],
    "pov": [
        "POV: finalmente percebeste {tema}.",
        "Para quem quer resolver {tema} sem complicar.",
        "Se és tu que ainda lutas com {tema}, este vídeo é para ti.",
        "Marca quem precisa de ver isto sobre {tema}.",
        "Isto é para quem está preso(a) em {tema}.",
    ],
    "storytime": [
        "Há um ano eu não fazia ideia de {tema}. Hoje é diferente.",
        "Ninguém acreditava que eu ia conseguir {tema}. Consegui.",
        "A história de como resolvi {tema} sozinho(a).",
        "O dia em que percebi {tema} mudou o meu negócio.",
        "Isto é o antes e depois de aprender {tema}.",
    ],
    "comparacao": [
        "Antes vs. depois de aplicar isto em {tema}.",
        "A diferença entre fazer {tema} sozinho(a) e ter um atalho.",
        "O que muda quando paras de improvisar em {tema}.",
        "{tema}: o caminho difícil vs. o caminho inteligente.",
        "Compara: com e sem este método para {tema}.",
    ],
}

# ---------------------------------------------------------------------------
# Corpo da legenda — contexto curto a seguir ao gancho.
# ---------------------------------------------------------------------------

CORPOS = [
    "Neste vídeo mostro exactamente como aplicar isto em {tema}, passo a passo.",
    "É simples, rápido e qualquer pessoa consegue aplicar hoje em {tema}.",
    "Deixei tudo pronto para tu só teres de copiar o processo em {tema}.",
    "Testei isto até funcionar — agora está tudo condensado para ti.",
    "Não precisas de experiência nenhuma para começar com {tema}.",
]

# ---------------------------------------------------------------------------
# CTAs — sempre UM único pedido claro, nunca vários ao mesmo tempo.
# ---------------------------------------------------------------------------

CTAS_COMENTARIO = [
    'Comenta "{palavra}" que te envio o link por DM. 📩',
    'Escreve "{palavra}" nos comentários e mando-te tudo. 📩',
    'Quer o link? Comenta "{palavra}" agora. 📩',
]

CTAS_BIO = [
    "Link na bio para garantires já o teu acesso. 🔗",
    "Todo o acesso está no link da bio. 🔗",
    "Vai ao link da bio antes que acabe. 🔗",
]

CTAS_GUARDAR = [
    "Guarda este vídeo para não perderes quando precisares. 🔖",
    "Guarda já — vais precisar disto mais tarde. 🔖",
    "Envia isto a alguém que precisa de ver. ➡️",
]

# ---------------------------------------------------------------------------
# Hashtags — combinadas por alcance para maximizar descoberta sem parecer spam.
# ---------------------------------------------------------------------------

HASHTAGS_AMPLAS = [
    "#produtodigital", "#infoprodutos", "#marketingdigital", "#empreendedorismo",
    "#negociodigital", "#dinheironainternet", "#trabalharemcasa", "#liberdadefinanceira",
    "#rendaextra", "#vendaonline", "#empreender", "#sucessoonline",
]

HASHTAGS_NICHO = [
    "#cursoonline", "#ebook", "#copywriting", "#vendasonline", "#marketingdigitalportugal",
    "#negocioonline", "#criadordeconteudo", "#estrategiadigital", "#infoproduto",
    "#marketingparaempreendedores", "#vendasdigitais", "#produtosdigitais",
]

HASHTAGS_TIKTOK_EXTRA = ["#fyp", "#foryoupage", "#viral", "#aprenderonline", "#dicasdenegocio"]
HASHTAGS_INSTAGRAM_EXTRA = ["#reels", "#instareels", "#reelsbrasil", "#reelsportugal", "#explorepage"]

MELHORES_HORAS = [
    "07h30–09h00 (antes de as pessoas começarem o dia)",
    "12h30–13h30 (hora de almoço)",
    "19h00–21h30 (pico de utilização à noite)",
]


def _historico_path() -> str:
    return os.path.join(os.path.dirname(__file__), "..", "data", "historico_conteudo.json")


def _carregar_historico() -> dict:
    caminho = _historico_path()
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    if not os.path.exists(caminho):
        return {"ultimo_indice": {}}
    with open(caminho, "r", encoding="utf-8") as f:
        return json.load(f)


def _guardar_historico(data: dict):
    with open(_historico_path(), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _escolher_sem_repetir(categoria: str, lista: list) -> tuple[str, int]:
    """Escolhe um item da lista evitando repetir o último usado nessa categoria."""
    data = _carregar_historico()
    ultimo = data.get("ultimo_indice", {}).get(categoria, -1)

    indices_possiveis = [i for i in range(len(lista)) if i != ultimo] or list(range(len(lista)))
    indice = random.choice(indices_possiveis)

    data.setdefault("ultimo_indice", {})[categoria] = indice
    _guardar_historico(data)
    return lista[indice], indice


def _preencher(template: str, tema: str) -> str:
    return template.format(tema=tema).strip()


def gerar_ganchos(tema: str, quantidade: int = 3) -> list[dict]:
    """Gera N variações de gancho de categorias diferentes para o utilizador escolher."""
    categorias = random.sample(list(GANCHOS.keys()), k=min(quantidade, len(GANCHOS)))
    resultado = []
    for categoria in categorias:
        template, _ = _escolher_sem_repetir(f"gancho_{categoria}", GANCHOS[categoria])
        resultado.append({"categoria": categoria, "texto": _preencher(template, tema)})
    return resultado


def _montar_hashtags(extra: list[str], total: int) -> list[str]:
    amplas = random.sample(HASHTAGS_AMPLAS, k=min(5, len(HASHTAGS_AMPLAS)))
    nicho = random.sample(HASHTAGS_NICHO, k=min(5, len(HASHTAGS_NICHO)))
    extras = random.sample(extra, k=min(3, len(extra)))
    tags = list(dict.fromkeys(amplas + nicho + extras))
    return tags[:total]


def gerar_pacote(tema: str, palavra_chave: str = "QUERO", link_bio: str = "") -> dict:
    """
    Gera o pacote completo do dia: ganchos, legendas para Instagram e TikTok,
    hashtags por plataforma, CTA e melhor hora sugerida para publicar.
    """
    ganchos = gerar_ganchos(tema, quantidade=3)
    gancho_principal = ganchos[0]["texto"]

    corpo, _ = _escolher_sem_repetir("corpo", CORPOS)
    corpo = _preencher(corpo, tema)

    tipo_cta = random.choice(["comentario", "bio", "guardar"])
    if tipo_cta == "comentario":
        cta_template, _ = _escolher_sem_repetir("cta_comentario", CTAS_COMENTARIO)
        cta = cta_template.format(palavra=palavra_chave)
    elif tipo_cta == "bio" and link_bio:
        cta_template, _ = _escolher_sem_repetir("cta_bio", CTAS_BIO)
        cta = cta_template
    else:
        cta_template, _ = _escolher_sem_repetir("cta_guardar", CTAS_GUARDAR)
        cta = cta_template

    hashtags_ig = _montar_hashtags(HASHTAGS_INSTAGRAM_EXTRA, total=20)
    hashtags_tt = _montar_hashtags(HASHTAGS_TIKTOK_EXTRA, total=6)

    legenda_instagram = f"{gancho_principal}\n\n{corpo}\n\n{cta}\n\n" + " ".join(hashtags_ig)
    legenda_tiktok = f"{gancho_principal} {cta}\n" + " ".join(hashtags_tt)

    return {
        "tema": tema,
        "ganchos_alternativos": ganchos,
        "gancho_usado": gancho_principal,
        "legenda_instagram": legenda_instagram,
        "legenda_tiktok": legenda_tiktok,
        "hashtags_instagram": hashtags_ig,
        "hashtags_tiktok": hashtags_tt,
        "cta": cta,
        "melhor_hora": random.choice(MELHORES_HORAS),
    }


# ---------------------------------------------------------------------------
# Geração assistida por IA (opcional) — personaliza o pacote ao tema exacto do
# vídeo usando o modelo Claude, mantendo as regras de copywriting de vídeo curto.
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_IA = """\
És um copywriter especialista em vídeos curtos (Reels/TikTok) para venda de produtos digitais \
(cursos, ebooks, templates, mentorias) em português de Portugal.

Regras obrigatórias:
- O gancho (primeira frase) tem de captar atenção nos primeiros 1-3 segundos: usa curiosidade, \
dor, prova social, contra-intuição, urgência ou uma pergunta directa.
- Frases curtas, linguagem simples, sem jargão. Nunca escrevas legendas longas — vídeo tem ~10 segundos.
- Usa a segunda pessoa ("tu"), tom directo e humano, nunca robótico.
- A legenda do Instagram pode ter 2-4 linhas de contexto + 1 CTA claro + hashtags.
- A legenda do TikTok é mais curta e directa: gancho + CTA + poucas hashtags.
- Usa APENAS UM call-to-action por legenda (nunca peças duas ações ao mesmo tempo).
- Evita palavras que reduzem alcance no Instagram/TikTok como "dinheiro fácil", "ganha já", \
"grátis" em excesso, ou promessas exageradas — foca-te em valor real e especificidade.
- Responde SEMPRE em JSON válido, sem texto à volta, no formato exacto:
{
  "ganchos_alternativos": ["gancho 1", "gancho 2", "gancho 3"],
  "legenda_instagram": "...",
  "legenda_tiktok": "...",
  "hashtags_instagram": ["#tag1", "#tag2", ...],
  "hashtags_tiktok": ["#tag1", "#tag2", ...]
}
"""


def gerar_com_ia(tema: str, nicho: str, produto: str, palavra_chave: str = "QUERO") -> dict | None:
    """
    Usa a API da Anthropic para gerar um pacote personalizado ao tema do vídeo.
    Retorna None se ANTHROPIC_API_KEY não estiver configurada ou se houver erro
    (o chamador deve usar gerar_pacote() como alternativa nesse caso).
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    try:
        import anthropic
    except ImportError:
        logger.warning("Pacote 'anthropic' não instalado — a usar gerador por templates.")
        return None

    try:
        client = anthropic.Anthropic(api_key=api_key)
        resposta = client.messages.create(
            model="claude-sonnet-5",
            max_tokens=1024,
            system=SYSTEM_PROMPT_IA,
            messages=[{
                "role": "user",
                "content": (
                    f"Tema do vídeo de hoje: {tema}\n"
                    f"Nicho: {nicho}\n"
                    f"Produto digital a vender: {produto}\n"
                    f'Palavra-chave para comentar (se usares CTA de comentário): "{palavra_chave}"\n\n'
                    "Gera o pacote de conteúdo em JSON conforme as regras."
                ),
            }],
        )
        texto = resposta.content[0].text.strip()
        if texto.startswith("```"):
            texto = texto.strip("`")
            texto = texto.split("\n", 1)[1] if "\n" in texto else texto
        pacote = json.loads(texto)
        pacote["tema"] = tema
        pacote["gancho_usado"] = pacote["ganchos_alternativos"][0]
        pacote["cta"] = "Ver legenda gerada por IA."
        pacote["melhor_hora"] = random.choice(MELHORES_HORAS)
        pacote.setdefault("hashtags_instagram", [])
        pacote.setdefault("hashtags_tiktok", [])
        pacote["ganchos_alternativos"] = [
            {"categoria": "ia", "texto": g} for g in pacote["ganchos_alternativos"]
        ]
        return pacote
    except Exception as e:
        logger.warning(f"Falha ao gerar conteúdo com IA ({e}) — a usar gerador por templates.")
        return None


def gerar(tema: str, nicho: str = "", produto: str = "", palavra_chave: str = "QUERO",
          link_bio: str = "") -> dict:
    """Ponto de entrada único: tenta IA, cai para templates se indisponível."""
    pacote = gerar_com_ia(tema, nicho, produto, palavra_chave)
    if pacote:
        pacote["fonte"] = "ia"
        return pacote
    pacote = gerar_pacote(tema, palavra_chave, link_bio)
    pacote["fonte"] = "templates"
    return pacote
