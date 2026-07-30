# Social Media Autopilot — Reels & TikTok para venda de produtos digitais

Todos os dias, o sistema pega no próximo vídeo da tua fila (~10 segundos) e gera
automaticamente:

- **3 ganchos alternativos** (a frase de abertura que decide se alguém continua a ver)
- **Legenda pronta para o Instagram Reels** (gancho + contexto + CTA + hashtags)
- **Legenda pronta para o TikTok** (mais curta e directa)
- **Hashtags** combinadas por alcance (amplas + nicho + específicas da plataforma)
- **Melhor hora sugerida** para publicar

Tudo chega por email às 8h da manhã, pronto a copiar e colar. Se configurares as
APIs (opcional), o sistema também consegue publicar automaticamente.

---

## Como funciona

1. Adicionas os teus vídeos (podes adicionar vários de uma vez) e dizes, em
   poucas palavras, o tema de cada um.
2. Todos os dias, o sistema escolhe o próximo vídeo da fila, gera o conteúdo e
   envia-te o pacote pronto por email.
3. Tu (ou o sistema, se activares a publicação automática) publicas no
   Instagram e no TikTok.
4. O vídeo é marcado como publicado e no dia seguinte segue para o próximo.

---

## Passo 1 — Instalar

```bash
cd social-media-autopilot
bash instalar.sh
```

Depois edita o `.env`:
- `NICHO` e `NOME_PRODUTO` — usados para personalizar os textos
- `LINK_BIO` — o teu link (Linktree, checkout, etc.)
- `SMTP_PASSWORD` — [App Password do Gmail](https://myaccount.google.com/apppasswords), para receberes o email diário
- `ANTHROPIC_API_KEY` (opcional, recomendado) — sem isto o sistema usa um banco
  de fórmulas de copywriting testadas; com isto, a Claude personaliza o gancho
  e a legenda ao tema exacto de cada vídeo do dia.

## Passo 2 — Adicionar vídeos à fila

Um vídeo de cada vez:
```bash
cd src
python main.py adicionar ~/Videos/video1.mp4 "vendas de ebooks"
```

> **Sobre o `tema`:** usa uma frase curta tipo substantivo (2-5 palavras) —
> ex: `"vendas de ebooks"`, `"criação de cursos online"`, `"produtividade para criadores"`.
> Evita frases completas ou começar por um verbo (`"como vender..."`), porque os
> ganchos são construídos à volta dessa frase. Se tiveres `ANTHROPIC_API_KEY`
> configurada, a IA lida bem com qualquer formato — esta regra aplica-se sobretudo
> ao gerador por templates (usado quando a IA não está configurada).

Vários de uma vez (a forma mais rápida de carregar um lote):
```bash
python main.py adicionar-pasta ~/Videos/lote_reels/
```
Isto adiciona todos os `.mp4`/`.mov` da pasta à fila, por ordem alfabética.
Se quiseres dar um tema específico a cada um (em vez do nome do ficheiro),
cria um `temas.csv` com colunas `ficheiro,tema` e passa-o como segundo argumento:
```bash
python main.py adicionar-pasta ~/Videos/lote_reels/ ~/Videos/lote_reels/temas.csv
```

Ver o estado da fila a qualquer momento:
```bash
python main.py fila
```

## Passo 3 — Agendar a publicação diária

```bash
cd ..
bash configurar_cron.sh
```

Isto agenda a execução todos os dias às 08:00. Cada execução consome um vídeo
da fila — quando a fila esvaziar, o sistema avisa-te no email/log para
adicionares mais.

---

## A estratégia de copywriting usada

Cada gancho segue uma fórmula diferente para não te limitares sempre ao mesmo
estilo: curiosidade, dor→solução, prova social, contra-intuitivo, urgência,
pergunta directa, lista/números, POV, storytime e comparação antes/depois.

Regras aplicadas em todas as legendas:
- Gancho sempre na primeira linha — é o que decide se a pessoa fica ou passa à frente.
- Uma única call-to-action por legenda (nunca pedir duas ações ao mesmo tempo).
- Hashtags combinadas: genéricas de alto alcance + nicho de produtos digitais
  + específicas da plataforma (`#fyp` no TikTok, `#reels` no Instagram).
- O sistema evita repetir o mesmo gancho/CTA em publicações consecutivas.

---

## Publicação automática (opcional, avançado)

Por omissão o sistema só **prepara** o conteúdo e envia por email — tu publicas
manualmente em menos de 1 minuto. Se quiseres publicação 100% automática, o
sistema já inclui a integração com as APIs oficiais, mas isto exige aprovações
das próprias plataformas (não há forma de contornar):

- **Instagram Graph API**: conta Business/Creator ligada a uma Página do
  Facebook, app na Meta for Developers, e o vídeo alojado num URL público
  (a API não aceita upload directo de ficheiro).
- **TikTok Content Posting API**: app aprovada pelo TikTok com o scope
  `video.publish`. Sem auditoria da app, os vídeos só podem ser publicados
  como privados (`SELF_ONLY`).

Preenche `IG_ACCESS_TOKEN`, `IG_BUSINESS_ACCOUNT_ID`, `VIDEO_PUBLIC_BASE_URL`,
`TIKTOK_ACCESS_TOKEN` e `AUTO_PUBLICAR=true` no `.env` quando tiveres estas
credenciais.

---

## Estrutura do projecto

```
social-media-autopilot/
├── src/
│   ├── main.py                 # Orquestrador + CLI (adicionar, fila, executar)
│   ├── gerador_conteudo.py     # Ganchos, legendas e hashtags (templates + IA opcional)
│   ├── fila_videos.py          # Fila de vídeos a publicar (um por dia)
│   ├── email_sender.py         # Email diário com o pacote pronto
│   ├── instagram_publisher.py  # Publicação automática via Instagram Graph API (opcional)
│   └── tiktok_publisher.py     # Publicação automática via TikTok Content Posting API (opcional)
├── videos/                     # Os teus vídeos (gitignored)
├── data/                       # Fila e histórico (gitignored)
├── logs/                       # Logs de execução (gitignored)
├── .env.example                # Template de configuração
├── instalar.sh                 # Instalação automática
├── configurar_cron.sh          # Agendamento diário
└── requirements.txt
```
