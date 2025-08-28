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