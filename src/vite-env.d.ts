/// <reference types="vite/client" />

import type {} from "react";

declare module "react" {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}
