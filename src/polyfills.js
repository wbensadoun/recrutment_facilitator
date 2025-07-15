// Polyfill pour process.env dans le navigateur
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {
      PGHOST: import.meta.env.VITE_POSTGRES_HOST || 'localhost',
      PGUSER: import.meta.env.VITE_POSTGRES_USER || 'postgres',
      PGPASSWORD: import.meta.env.VITE_POSTGRES_PASSWORD || 'postgres',
      PGDATABASE: import.meta.env.VITE_POSTGRES_DB || 'recruitment_facilitator',
      PGPORT: import.meta.env.VITE_POSTGRES_PORT || '5432',
    }
  };
}
