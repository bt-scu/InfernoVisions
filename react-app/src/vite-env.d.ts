/// <reference types="vite/client" />

// WebSpatial custom JSX attributes
declare namespace React {
  interface HTMLAttributes<T> {
    'enable-xr'?: boolean | '';
    'enable-xr-monitor'?: boolean | '';
  }

  interface CSSProperties {
    '--xr-back'?: string;
    '--xr-z-index'?: string;
    '--xr-background-material'?: string;
  }
}

// WebSpatial globals
declare const initScene: (name: string, config: (cfg: any) => any) => void;
declare const __XR_ENV_BASE__: string;
