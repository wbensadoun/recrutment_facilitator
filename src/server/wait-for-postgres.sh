#!/bin/sh
# wait-for-postgres.sh

set -e

host="$1"
shift
cmd="$@"

# Boucle jusqu'à ce que Postgres soit prêt. 
# Les variables DB_USER, DB_PASSWORD et DB_NAME doivent être définies dans l'environnement.
until PGPASSWORD=$DB_PASSWORD psql -h "$host" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  >&2 echo "Postgres est indisponible - en attente..."
  sleep 1
done

>&2 echo "Postgres est prêt - exécution de la commande."
exec $cmd
