#!/bin/bash
# Instalação do Social Media Autopilot

echo "🎬 A instalar o Social Media Autopilot"
echo "======================================="

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Instala em https://python.org"
    exit 1
fi

echo "✅ Python 3 encontrado: $(python3 --version)"

echo ""
echo "📦 A criar ambiente virtual..."
python3 -m venv venv
source venv/bin/activate

echo "📥 A instalar dependências..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo "✅ Dependências instaladas"

if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "⚠️  AÇÃO NECESSÁRIA:"
    echo "   1. Abre o ficheiro .env"
    echo "   2. Preenche NICHO, NOME_PRODUTO, LINK_BIO"
    echo "   3. Preenche o SMTP_PASSWORD (App Password do Gmail) para receberes o email diário"
    echo "   4. (Opcional) Preenche ANTHROPIC_API_KEY para legendas personalizadas por IA"
fi

mkdir -p videos data logs

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "Passo seguinte — adiciona os teus vídeos à fila:"
echo "   source venv/bin/activate"
echo "   cd src"
echo "   python main.py adicionar ~/Videos/video1.mp4 \"vendas de ebooks\""
echo "   python main.py adicionar-pasta ~/Videos/lote_de_reels/"
echo ""
echo "Testar a publicação de hoje agora mesmo:"
echo "   python main.py"
echo ""
echo "Agendar execução diária às 8h da manhã:"
echo "   cd .. && bash configurar_cron.sh"
