declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  import * as React from "react";
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

interface ImportMetaEnv {
  readonly VITE_EBAY_CLIENT_TKN: string;
  readonly VITE_EBAY_CLIENT_ID: string;
  readonly VITE_EBAY_CLIENT_SEC: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REACT_APP_RAPIDAPI_KEY: string;
  readonly VITE_REACT_APP_RAPIDAPI_HOST: string;
  // add other env vars here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}