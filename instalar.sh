#!/bin/bash
# Script de instalação da automação

echo "🚀 A instalar AI Business Portugal - Automação de Leads"
echo "======================================================="

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Instala em https://python.org"
    exit 1
fi

echo "✅ Python 3 encontrado: $(python3 --version)"

# Criar ambiente virtual
echo ""
echo "📦 A criar ambiente virtual..."
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
echo "📥 A instalar dependências..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo "✅ Dependências instaladas"

# Criar ficheiro .env se não existir
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "⚠️  AÇÃO NECESSÁRIA:"
    echo "   1. Abre o ficheiro .env"
    echo "   2. Preenche o GOOGLE_MAPS_API_KEY"
    echo "   3. Preenche o SMTP_PASSWORD (App Password do Gmail)"
    echo ""
    echo "   Como obter a Google Maps API Key:"
    echo "   → https://console.cloud.google.com/apis/library/places-backend.googleapis.com"
    echo ""
    echo "   Como obter o Gmail App Password:"
    echo "   → https://myaccount.google.com/apppasswords"
fi

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "Para executar agora:"
echo "   source venv/bin/activate"
echo "   cd src && python main.py"
echo ""
echo "Para agendar execução diária às 8h da manhã:"
echo "   bash configurar_cron.sh"
