# Social Media Autopilot — Reels & TikTok para venda de produtos digitais

Nicho activo por omissão: **monetizar páginas de pets com produtos digitais**,
em inglês (`IDIOMA=en` no `.env`). Todos os dias, o sistema pega no próximo
vídeo da tua fila (~10 segundos) e gera automaticamente:

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
- `IDIOMA` — `en` (nicho de monetização de páginas de pets, activo por omissão)
  ou `pt` (produtos digitais em geral, português)
- `NICHO` e `NOME_PRODUTO` — usados para personalizar os textos
- `PALAVRA_CHAVE_CTA` — palavra que pedes para comentar (ex.: `PET`)
- `LINK_BIO` — o teu link (Linktree, checkout, etc.)
- `SMTP_PASSWORD` — [App Password do Gmail](https://myaccount.google.com/apppasswords), para receberes o email diário
- `ANTHROPIC_API_KEY` (opcional, recomendado) — sem isto o sistema usa um banco
  de fórmulas de copywriting testadas; com isto, a Claude personaliza o gancho
  e a legenda ao tema exacto de cada vídeo do dia (em qualquer um dos idiomas).

## Passo 2 — Adicionar vídeos à fila

Um vídeo de cada vez:
```bash
cd src
python main.py adicionar ~/Videos/video1.mp4 "training guides"
```

> **Sobre o `tema`:** usa uma frase curta tipo substantivo (2-5 palavras) — o
> ângulo/produto digital que esse vídeo específico aborda. Com `IDIOMA=en`
> (nicho de pets), ex: `"training guides"`, `"treat recipes"`, `"pet photography
> presets"`. Com `IDIOMA=pt`, ex: `"vendas de ebooks"`, `"criação de cursos
> online"`. Evita frases completas ou começar por um verbo, porque os ganchos
> são construídos à volta dessa frase — isto aplica-se ao gerador por templates;
> com `ANTHROPIC_API_KEY` configurada, a IA lida bem com qualquer formato.
> Não precisas de repetir os ganchos "assinatura" do nicho de pets (estilo
> "How your dog became a CEO.") — esses já rodam automaticamente todos os dias,
> independentemente do tema que indicares.

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
estilo: uma categoria "assinatura" (só no nicho de pets — personificação/choque
financeiro, no tom de `"How your dog became a CEO."`), curiosidade, dor→solução,
prova social, contra-intuitivo, urgência, pergunta directa, lista/números, POV,
storytime e comparação antes/depois. Todos os dias recebes **3 ganchos
alternativos** de categorias diferentes para escolheres o que preferires.

Regras aplicadas em todas as legendas:
- Gancho sempre na primeira linha — é o que decide se a pessoa fica ou passa à frente.
- A legenda constrói curiosidade e convida explicitamente a ler até ao fim
  (`"keep reading 👇"`, `"the full breakdown is below"`) em vez de vender logo
  na primeira linha — o objectivo é que a pessoa abra e leia a descrição toda.
- Uma única call-to-action por legenda (nunca pedir duas ações ao mesmo tempo).
- Nenhum valor monetário específico é inventado como facto (sem falsos
  "case studies" com números) — as promessas de valor são aspiracionais e gerais.
- Hashtags combinadas: genéricas de alto alcance + nicho + específicas da
  plataforma (`#fyp` no TikTok, `#reels` no Instagram).
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
