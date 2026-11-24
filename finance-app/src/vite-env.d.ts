/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MARKET_SOURCE?: 'fixture' | 'api';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
