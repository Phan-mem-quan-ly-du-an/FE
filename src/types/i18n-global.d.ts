declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module 'react-csv';
declare module 'lodash';
declare module 'prismjs';
declare module 'react-dom/client';

// Fix i18next t() typing globally
import { TFunction } from 'i18next';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    returnNull: false
  }
}

declare global {
  interface Window {
    confirm: (message: string) => boolean;
  }
}

export {};
