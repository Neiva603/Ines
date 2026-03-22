# AI Business Portugal — Automação de Leads

Envia todos os dias **20 contactos WhatsApp** de negócios locais em Portugal (incluindo Açores e Madeira) que não têm website ou têm website fraco, para `ai.businessportugal@gmail.com`.

---

## Como funciona

1. Pesquisa negócios no Google Maps (restaurantes, cabeleireiros, mecânicos, etc.)
2. Verifica se cada negócio tem website e avalia a sua qualidade
3. Filtra os que não têm website ou têm website fraco
4. Envia email com 20 contactos por dia — com botão que abre o WhatsApp directamente

---

## Passo 1 — Activar a Google Places API

A chave `AIzaSyAIq3aps_0y6APnT4PcXMlPuMS2wIwtXQI` já está configurada.
Só precisas de activar a API no Google Cloud:

1. Aceder a: **https://console.cloud.google.com**
2. Seleccionar o projecto associado à tua chave API
3. No menu lateral: **APIs e Serviços → Biblioteca**
4. Pesquisar **"Places API"** → clicar → **Activar**
5. No menu lateral: **Faturação** → associar um cartão de crédito
   *(o Google oferece $200/mês grátis — mais do que suficiente para este uso)*

> **Nota:** A Places API requer faturação activada, mas com $200 de crédito mensal gratuito nunca pagarás nada para este volume de pesquisas.

---

## Passo 2 — Activar Gmail App Password

A App Password `dksb nhna ljog vfyu` já está configurada.

Se precisares de criar uma nova:
1. Aceder a: **https://myaccount.google.com/apppasswords**
2. Criar para "Mail" / "Outro"
3. Copiar os 16 caracteres

---

## Passo 3 — Instalar e executar

### No teu computador (Mac/Linux):

```bash
# Clonar o repositório
git clone <url-do-repo>
cd Ines

# Instalar
bash instalar.sh

# Executar agora (teste)
source venv/bin/activate
cd src && python main.py

# Agendar para todos os dias às 8h00
bash configurar_cron.sh
```

### No Windows:

```bash
# Instalar Python 3.11+ em https://python.org
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd src
python main.py
```

Para agendar no Windows, usar o **Agendador de Tarefas**:
- Programa: `C:\caminho\para\Ines\venv\Scripts\python.exe`
- Argumentos: `C:\caminho\para\Ines\src\main.py`
- Hora: 08:00 diariamente

---

## O que recebes todos os dias

Email às 8h00 com 20 contactos:

| Campo | Exemplo |
|---|---|
| Nome | Restaurante O Zé |
| WhatsApp | Botão verde → abre directamente |
| Telefone | +351 912 345 678 |
| Categoria | Restaurante |
| Região | Lisboa |
| Estado | SEM WEBSITE ou WEBSITE FRACO |
| Google Maps | Link para ver a localização |

Também inclui uma mensagem sugerida para copiar e enviar.

---

## Estrutura do projecto

```
Ines/
├── src/
│   ├── main.py                 # Script principal
│   ├── google_maps_scraper.py  # Pesquisa no Google Maps
│   ├── website_checker.py      # Avalia qualidade dos websites
│   ├── email_sender.py         # Envia email HTML
│   └── storage.py              # Evita repetir contactos
├── data/                       # Histórico local (gitignored)
├── logs/                       # Logs de execução (gitignored)
├── .env                        # Credenciais (gitignored)
├── .env.example                # Template de configuração
├── instalar.sh                 # Instalação automática
├── configurar_cron.sh          # Agendamento automático
└── requirements.txt            # Dependências Python
```

---

## Critérios de "website fraco"

Um website é considerado fraco quando:
- Está numa plataforma gratuita (Wix, Weebly, Jimdo, Blogspot, etc.)
- Retorna erro HTTP (404, 500, etc.)
- É inacessível
- Tem menos de 100 palavras de conteúdo
- Não tem imagens, CSS externo, ou informação de contacto
- Não é responsivo (sem meta viewport)

Negócios com bom website são ignorados automaticamente.
