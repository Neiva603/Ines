# AI Business Portugal — Automação de Leads

Envia todos os dias 20 contactos de WhatsApp de negócios locais em Portugal (incluindo Açores e Madeira) que **não têm website ou têm website fraco**, para o email `ai.businessportugal@gmail.com`.

## Como funciona

1. **Pesquisa** negócios no Google Maps (restaurantes, cabeleireiros, mecânicos, etc.)
2. **Verifica** se cada negócio tem website e avalia a sua qualidade
3. **Filtra** os que não têm website ou têm website fraco
4. **Envia email** com 20 contactos por dia, com link direto para WhatsApp

## Instalação

### 1. Clonar e instalar

```bash
git clone <repo>
cd Ines
bash instalar.sh
```

### 2. Configurar credenciais

Editar o ficheiro `.env`:

```env
GOOGLE_MAPS_API_KEY=AIza...          # Google Maps API Key
SMTP_PASSWORD=xxxx xxxx xxxx xxxx   # Gmail App Password
```

#### Obter Google Maps API Key
1. Aceder a [Google Cloud Console](https://console.cloud.google.com)
2. Criar projeto ou selecionar existente
3. Ativar **Places API**
4. Criar credencial → API Key
5. (Recomendado) Restringir a chave à Places API

#### Obter Gmail App Password
1. Ativar verificação em 2 passos no Gmail
2. Aceder a [App Passwords](https://myaccount.google.com/apppasswords)
3. Criar password para "Mail" / "Windows Computer"
4. Copiar os 16 caracteres gerados

### 3. Executar

```bash
# Executar manualmente
source venv/bin/activate
cd src && python main.py

# Agendar para executar todos os dias às 8h
bash configurar_cron.sh
```

## Email recebido

O email diário contém:
- Nome do negócio
- Botão WhatsApp (abre diretamente a conversa)
- Categoria (restaurante, cabeleireiro, etc.)
- Região (cidade)
- Estado do website (sem website / website fraco)
- Link para Google Maps
- Mensagem sugerida para enviar

## Estrutura

```
Ines/
├── src/
│   ├── main.py              # Script principal
│   ├── google_maps_scraper.py  # Pesquisa no Google Maps
│   ├── website_checker.py   # Avalia qualidade dos websites
│   ├── email_sender.py      # Envia email HTML
│   └── storage.py           # Evita repetir contactos
├── data/                    # Base de dados local (gitignored)
├── logs/                    # Logs de execução (gitignored)
├── .env                     # Credenciais (gitignored)
├── .env.example             # Template de configuração
├── instalar.sh              # Script de instalação
├── configurar_cron.sh       # Configura execução automática
└── requirements.txt         # Dependências Python
```
