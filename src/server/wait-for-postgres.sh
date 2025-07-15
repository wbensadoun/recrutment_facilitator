#!/bin/sh
# wait-for-postgres.sh

set -e

host="$1"
shift
cmd="$@"

# Attendre que PostgreSQL soit prêt
echo "Attente de PostgreSQL..."
sleep 10

# Exécuter la commande
echo "PostgreSQL devrait être prêt - exécution de la commande"
exec $cmd
