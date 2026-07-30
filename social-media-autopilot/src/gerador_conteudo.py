"""
Gerador de ganchos, legendas e hashtags para Reels/TikTok de venda de produtos digitais.

Combina duas fontes:
1. Banco de fórmulas de copywriting testadas em vídeo curto (sempre disponível, sem custos).
2. Geração assistida por IA (Claude) quando ANTHROPIC_API_KEY está configurada — usa o
   tema do vídeo do dia para personalizar ganchos e legendas.

Suporta dois "packs" de conteúdo, escolhidos via idioma ("pt" ou "en"):
- "pt": produtos digitais em geral, em português.
- "en": nicho activo por omissão — monetizar páginas de animais de estimação
  (pet pages) com produtos digitais, em inglês, com legendas construídas para
  gerar curiosidade e levar a pessoa a querer ler a descrição toda.
"""

import json
import logging
import os
import random

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# PACK "pt" — produtos digitais em geral, português.
# ---------------------------------------------------------------------------

GANCHOS_PT = {
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
        "Isto não precisa ser complicado — só te venderam essa ideia sobre {tema}.",
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

CORPOS_PT = [
    "Neste vídeo mostro exactamente como aplicar isto em {tema}, passo a passo.",
    "É simples, rápido e qualquer pessoa consegue aplicar hoje em {tema}.",
    "Deixei tudo pronto para tu só teres de copiar o processo em {tema}.",
    "Testei isto até funcionar — agora está tudo condensado para ti.",
    "Não precisas de experiência nenhuma para começar com {tema}.",
]

CTAS_COMENTARIO_PT = [
    'Comenta "{palavra}" que te envio o link por DM. 📩',
    'Escreve "{palavra}" nos comentários e mando-te tudo. 📩',
    'Quer o link? Comenta "{palavra}" agora. 📩',
]
CTAS_BIO_PT = [
    "Link na bio para garantires já o teu acesso. 🔗",
    "Todo o acesso está no link da bio. 🔗",
    "Vai ao link da bio antes que acabe. 🔗",
]
CTAS_GUARDAR_PT = [
    "Guarda este vídeo para não perderes quando precisares. 🔖",
    "Guarda já — vais precisar disto mais tarde. 🔖",
    "Envia isto a alguém que precisa de ver. ➡️",
]

HASHTAGS_AMPLAS_PT = [
    "#produtodigital", "#infoprodutos", "#marketingdigital", "#empreendedorismo",
    "#negociodigital", "#dinheironainternet", "#trabalharemcasa", "#liberdadefinanceira",
    "#rendaextra", "#vendaonline", "#empreender", "#sucessoonline",
]
HASHTAGS_NICHO_PT = [
    "#cursoonline", "#ebook", "#copywriting", "#vendasonline", "#marketingdigitalportugal",
    "#negocioonline", "#criadordeconteudo", "#estrategiadigital", "#infoproduto",
    "#marketingparaempreendedores", "#vendasdigitais", "#produtosdigitais",
]
HASHTAGS_TIKTOK_EXTRA_PT = ["#fyp", "#foryoupage", "#viral", "#aprenderonline", "#dicasdenegocio"]
HASHTAGS_INSTAGRAM_EXTRA_PT = ["#reels", "#instareels", "#reelsbrasil", "#reelsportugal", "#explorepage"]

MELHORES_HORAS_PT = [
    "07h30–09h00 (antes de as pessoas começarem o dia)",
    "12h30–13h30 (hora de almoço)",
    "19h00–21h30 (pico de utilização à noite)",
]

# ---------------------------------------------------------------------------
# PACK "en" — nicho activo: monetizar páginas de pets com produtos digitais.
# "assinatura" = ganchos independentes do tema, no tom exacto pedido
# (personificação/CEO, choque financeiro) — os restantes usam {tema} (o
# ângulo/produto do vídeo do dia, ex.: "training guides", "treat recipes").
# ---------------------------------------------------------------------------

GANCHOS_EN = {
    "assinatura": [
        "You don't need 10k followers for your dog to pay your rent.",
        "How your dog became a CEO.",
        "Your pet's Instagram is worth more than you think.",
        "This dog has never had a job. He still pays his own vet bills.",
        "Somewhere out there, a cat is out-earning its owner.",
        "Nobody tells you a 3k-follower pet page can pay for itself.",
    ],
    "curiosidade": [
        "Nobody talks about this part of {tema}.",
        "I found out how pet pages are quietly making money from {tema}.",
        "The part of {tema} every pet owner skips — and shouldn't.",
        "This changed how I think about {tema} for pet pages.",
        "Here's what nobody tells you about {tema}.",
    ],
    "dor_solucao": [
        "Still posting {tema} for free? Here's what you're missing.",
        "Tired of {tema} getting likes but no income?",
        "This fixed the biggest mistake pet pages make with {tema}.",
        "You don't need a huge following to make {tema} pay off.",
        "Struggling to turn {tema} into actual income? This helps.",
    ],
    "prova_social": [
        "Pet pages are already using {tema} to make real money.",
        "This is the {tema} strategy small pet accounts keep using.",
        "The exact way pet pages turn {tema} into income.",
        "This is what separates pet pages that earn from the ones that don't.",
        "More pet owners are quietly cashing in on {tema}.",
    ],
    "contraintuitivo": [
        "Big following ≠ big income — just look at {tema}.",
        "Forget growth hacks — small pet pages get paid through {tema}.",
        "You've been thinking about {tema} backwards.",
        "The follower-count myth that's stopping {tema} from earning.",
        "You don't need 100k followers for {tema} to work.",
    ],
    "urgencia": [
        "I'm only explaining {tema} like this once — save it.",
        "This {tema} method won't stay this easy for long.",
        "Before your next post, watch this about {tema}.",
        "Every day you wait is a day your pet page isn't earning from {tema}.",
        "Last time I break down {tema} for free.",
    ],
    "pergunta": [
        "What if your pet's page could pay for {tema} itself?",
        "Did you know pet pages are earning from {tema} under 5k followers?",
        "Ever wonder how small pet accounts afford {tema}?",
        "What if follower count isn't what decides {tema} income?",
        "Could your pet's page actually turn {tema} into a business?",
    ],
    "lista": [
        "3 things every pet page should know about {tema}.",
        "2 steps to turn {tema} into income this month.",
        "5 minutes to understand how pet pages profit from {tema}.",
        "1 mistake keeping your pet page from earning off {tema}.",
        "3 things no one tells you about {tema}.",
    ],
    "pov": [
        "POV: your pet's page just started earning from {tema}.",
        "For pet owners tired of doing {tema} for free.",
        "Tag a pet owner who needs to see this about {tema}.",
        "This is for the pet page stuck under 5k trying {tema}.",
        "POV: {tema} just became your pet's side income.",
    ],
    "storytime": [
        "A year ago this page made $0 from {tema}. Not anymore.",
        "Nobody believed a pet page could earn from {tema}. Then this happened.",
        "The day I realized {tema} could actually pay the bills.",
        "This is the before and after of monetizing {tema}.",
        "How one small pet page turned {tema} into real income.",
    ],
    "comparacao": [
        "Free {tema} content vs. {tema} that pays for itself.",
        "The difference between cute {tema} posts and profitable ones.",
        "What changes when your pet page stops giving {tema} away for free.",
        "A big following vs. a pet page actually earning from {tema} — not the same thing.",
        "Compare: posting {tema} for likes vs. posting it to sell.",
    ],
}

# Corpo da legenda — a parte que mantém o "loop" de curiosidade aberto e
# convida explicitamente a ler a legenda até ao fim, em vez de vender logo.
CORPOS_EN = [
    "I broke the whole strategy down in the caption — worth the read. 👇",
    "Keep reading, this gets good. There's a simple way to turn {tema} into income without needing a huge following. 👇",
    "The full breakdown is below — simpler than most pet owners think.",
    "Stick around, the caption explains exactly how {tema} can start paying for itself.",
    "I laid out the whole thing underneath this post. Read it before you scroll past.",
]

CTAS_COMENTARIO_EN = [
    'Comment "{palavra}" and I\'ll send you the exact guide. 📩',
    'Type "{palavra}" below and I\'ll DM you the breakdown. 📩',
    'Want the templates? Comment "{palavra}" now. 📩',
]
CTAS_BIO_EN = [
    "Full guide is linked in my bio. 🔗",
    "Grab it before it's gone — link in bio. 🔗",
    "Everything you need is one tap away in my bio. 🔗",
]
CTAS_GUARDAR_EN = [
    "Save this before your feed eats it. 🔖",
    "Save this — you'll need it later. 🔖",
    "Send this to a pet owner who needs to see it. ➡️",
]

HASHTAGS_AMPLAS_EN = [
    "#digitalproducts", "#passiveincome", "#sidehustle", "#contentcreator",
    "#onlinebusiness", "#makemoneyonline", "#smallbusinesstips", "#creatoreconomy",
    "#digitalproduct", "#onlineincome",
]
HASHTAGS_NICHO_EN = [
    "#petinfluencer", "#petsofinstagram", "#dogsofinstagram", "#catsofinstagram",
    "#monetizeyourpet", "#petbusiness", "#petcontentcreator", "#petpage",
    "#petmarketing", "#doginfluencer",
]
HASHTAGS_TIKTOK_EXTRA_EN = ["#fyp", "#foryoupage", "#viral", "#petsoftiktok", "#dogsoftiktok"]
HASHTAGS_INSTAGRAM_EXTRA_EN = ["#reels", "#instareels", "#explorepage", "#petreels", "#reelsinstagram"]

MELHORES_HORAS_EN = [
    "7:30–9:00 AM (before people start their day)",
    "12:30–1:30 PM (lunch break scroll)",
    "7:00–9:30 PM (peak evening usage)",
]

_PACKS = {
    "pt": {
        "ganchos": GANCHOS_PT,
        "corpos": CORPOS_PT,
        "cta_comentario": CTAS_COMENTARIO_PT,
        "cta_bio": CTAS_BIO_PT,
        "cta_guardar": CTAS_GUARDAR_PT,
        "hashtags_amplas": HASHTAGS_AMPLAS_PT,
        "hashtags_nicho": HASHTAGS_NICHO_PT,
        "hashtags_tiktok_extra": HASHTAGS_TIKTOK_EXTRA_PT,
        "hashtags_instagram_extra": HASHTAGS_INSTAGRAM_EXTRA_PT,
        "melhores_horas": MELHORES_HORAS_PT,
    },
    "en": {
        "ganchos": GANCHOS_EN,
        "corpos": CORPOS_EN,
        "cta_comentario": CTAS_COMENTARIO_EN,
        "cta_bio": CTAS_BIO_EN,
        "cta_guardar": CTAS_GUARDAR_EN,
        "hashtags_amplas": HASHTAGS_AMPLAS_EN,
        "hashtags_nicho": HASHTAGS_NICHO_EN,
        "hashtags_tiktok_extra": HASHTAGS_TIKTOK_EXTRA_EN,
        "hashtags_instagram_extra": HASHTAGS_INSTAGRAM_EXTRA_EN,
        "melhores_horas": MELHORES_HORAS_EN,
    },
}


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


def _escolher_sem_repetir(chave: str, lista: list) -> tuple[str, int]:
    """Escolhe um item da lista evitando repetir o último usado com esta chave."""
    data = _carregar_historico()
    ultimo = data.get("ultimo_indice", {}).get(chave, -1)

    indices_possiveis = [i for i in range(len(lista)) if i != ultimo] or list(range(len(lista)))
    indice = random.choice(indices_possiveis)

    data.setdefault("ultimo_indice", {})[chave] = indice
    _guardar_historico(data)
    return lista[indice], indice


def _preencher(template: str, tema: str) -> str:
    return template.format(tema=tema).strip()


def gerar_ganchos(tema: str, idioma: str = "en", quantidade: int = 3) -> list[dict]:
    """Gera N variações de gancho de categorias diferentes para o utilizador escolher."""
    banco = _PACKS[idioma]["ganchos"]
    categorias = random.sample(list(banco.keys()), k=min(quantidade, len(banco)))
    resultado = []
    for categoria in categorias:
        template, _ = _escolher_sem_repetir(f"{idioma}_gancho_{categoria}", banco[categoria])
        resultado.append({"categoria": categoria, "texto": _preencher(template, tema)})
    return resultado


def _montar_hashtags(amplas: list[str], nicho: list[str], extra: list[str], total: int) -> list[str]:
    escolhidas_amplas = random.sample(amplas, k=min(5, len(amplas)))
    escolhidas_nicho = random.sample(nicho, k=min(5, len(nicho)))
    escolhidas_extra = random.sample(extra, k=min(3, len(extra)))
    tags = list(dict.fromkeys(escolhidas_amplas + escolhidas_nicho + escolhidas_extra))
    return tags[:total]


def gerar_pacote(tema: str, palavra_chave: str = "PET", link_bio: str = "", idioma: str = "en") -> dict:
    """
    Gera o pacote completo do dia: 3 ganchos, legendas para Instagram e TikTok,
    hashtags por plataforma, CTA e melhor hora sugerida para publicar.
    """
    pack = _PACKS[idioma]
    ganchos = gerar_ganchos(tema, idioma=idioma, quantidade=3)
    gancho_principal = ganchos[0]["texto"]

    corpo, _ = _escolher_sem_repetir(f"{idioma}_corpo", pack["corpos"])
    corpo = _preencher(corpo, tema)

    tipo_cta = random.choice(["comentario", "bio", "guardar"])
    if tipo_cta == "comentario":
        cta_template, _ = _escolher_sem_repetir(f"{idioma}_cta_comentario", pack["cta_comentario"])
        cta = cta_template.format(palavra=palavra_chave)
    elif tipo_cta == "bio" and link_bio:
        cta, _ = _escolher_sem_repetir(f"{idioma}_cta_bio", pack["cta_bio"])
    else:
        cta, _ = _escolher_sem_repetir(f"{idioma}_cta_guardar", pack["cta_guardar"])

    hashtags_ig = _montar_hashtags(
        pack["hashtags_amplas"], pack["hashtags_nicho"], pack["hashtags_instagram_extra"], total=15,
    )
    hashtags_tt = _montar_hashtags(
        pack["hashtags_amplas"], pack["hashtags_nicho"], pack["hashtags_tiktok_extra"], total=6,
    )

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
        "melhor_hora": random.choice(pack["melhores_horas"]),
    }


# ---------------------------------------------------------------------------
# Geração assistida por IA (opcional) — personaliza o pacote ao tema exacto do
# vídeo usando o modelo Claude, mantendo as regras de copywriting de vídeo curto.
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_IA_PT = """\
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

SYSTEM_PROMPT_IA_EN = """\
You are a short-form video copywriter specialising in the pet-account monetization niche — \
helping pet Instagram/TikTok pages sell digital products (guides, templates, growth blueprints) \
to other pet owners.

Mandatory rules:
- Hooks must be scroll-stopping in the first 1-3 seconds: use curiosity, a bold contrarian claim, \
playful personification of the pet (e.g. "your dog became a CEO"), or a surprising financial angle. \
Never generic. Match this tone exactly: "You don't need 10k followers for your dog to pay your rent." \
/ "How your dog became a CEO."
- Captions must build curiosity and make the reader want to open and finish reading the caption — \
use an explicit open loop ("here's exactly how 👇", "keep reading"), never just a hard sell.
- Never state specific unverified dollar amounts as fact (no fake case-study numbers). Keep value \
claims aspirational and general ("could start earning", "without needing a huge following").
- Use exactly ONE call-to-action per caption (never ask for two actions at once).
- Instagram caption: hook + 2-4 short curiosity-driven lines + one CTA + hashtags. \
TikTok caption: hook + CTA + a handful of hashtags, punchier and shorter.
- Always respond in English.
- Respond ONLY in valid JSON, no surrounding text, in this exact format:
{
  "ganchos_alternativos": ["hook 1", "hook 2", "hook 3"],
  "legenda_instagram": "...",
  "legenda_tiktok": "...",
  "hashtags_instagram": ["#tag1", "#tag2", ...],
  "hashtags_tiktok": ["#tag1", "#tag2", ...]
}
"""

_SYSTEM_PROMPTS_IA = {"pt": SYSTEM_PROMPT_IA_PT, "en": SYSTEM_PROMPT_IA_EN}


def gerar_com_ia(tema: str, nicho: str, produto: str, palavra_chave: str = "PET",
                  idioma: str = "en") -> dict | None:
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
            system=_SYSTEM_PROMPTS_IA[idioma],
            messages=[{
                "role": "user",
                "content": (
                    f"Today's video topic/angle: {tema}\n"
                    f"Niche: {nicho}\n"
                    f"Digital product being sold: {produto}\n"
                    f'Keyword to comment (if you use a comment-based CTA): "{palavra_chave}"\n\n'
                    "Generate the content package as JSON following the rules."
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
        pacote["cta"] = "See generated caption."
        pacote["melhor_hora"] = random.choice(_PACKS[idioma]["melhores_horas"])
        pacote.setdefault("hashtags_instagram", [])
        pacote.setdefault("hashtags_tiktok", [])
        pacote["ganchos_alternativos"] = [
            {"categoria": "ia", "texto": g} for g in pacote["ganchos_alternativos"]
        ]
        return pacote
    except Exception as e:
        logger.warning(f"Falha ao gerar conteúdo com IA ({e}) — a usar gerador por templates.")
        return None


def gerar(tema: str, nicho: str = "", produto: str = "", palavra_chave: str = "PET",
          link_bio: str = "", idioma: str = "en") -> dict:
    """Ponto de entrada único: tenta IA, cai para templates se indisponível."""
    pacote = gerar_com_ia(tema, nicho, produto, palavra_chave, idioma)
    if pacote:
        pacote["fonte"] = "ia"
        return pacote
    pacote = gerar_pacote(tema, palavra_chave, link_bio, idioma)
    pacote["fonte"] = "templates"
    return pacote
