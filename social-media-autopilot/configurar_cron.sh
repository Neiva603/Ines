#!/bin/bash
# Configura o cron para gerar/enviar a publicação diária automaticamente às 8h

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON="$SCRIPT_DIR/venv/bin/python"
MAIN="$SCRIPT_DIR/src/main.py"
LOG="$SCRIPT_DIR/logs/cron.log"

if [ ! -f "$PYTHON" ]; then
    echo "❌ Ambiente virtual não encontrado. Executa primeiro: bash instalar.sh"
    exit 1
fi

CRON_JOB="0 8 * * * cd $SCRIPT_DIR/src && $PYTHON $MAIN >> $LOG 2>&1"

(crontab -l 2>/dev/null | grep -v "$MAIN"; echo "$CRON_JOB") | crontab -

echo "✅ Cron configurado com sucesso!"
echo ""
echo "Agendamento: todos os dias às 08:00"
echo "Comando: $CRON_JOB"
echo ""
echo "Para verificar o cron ativo:"
echo "   crontab -l"
echo ""
echo "Para executar manualmente agora:"
echo "   $PYTHON $MAIN"
echo ""
echo "Para ver os logs:"
echo "   tail -f $LOG"
