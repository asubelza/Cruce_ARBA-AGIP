/**
 * ECJY Design Tokens - CSS Custom Property Generator
 * Generates --ecjy-* CSS variables from tokens for dark mode
 */

import { tokens as defaultTokens, DesignTokens, TokenPath } from './tokens';

const PREFIX = 'ecjy';

function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function flattenTokens(
  obj: Record<string, unknown>,
  prefix: string = '',
  result: Record<string, string | number> = {}
): Record<string, string | number> {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}-${toKebabCase(key)}` : toKebabCase(key);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenTokens(value as Record<string, unknown>, newKey, result);
    } else {
      result[newKey] = value as string | number;
    }
  }
  return result;
}

function generateCSSVars(tokenObj: DesignTokens, selector: string): string {
  const flat = flattenTokens(tokenObj as unknown as Record<string, unknown>);
  const lines = Object.entries(flat).map(
    ([key, value]) => `  --${PREFIX}-${key}: ${value};`
  );
  return `${selector} {\n${lines.join('\n')}\n}`;
}

export function generateRootCSSVars(tokenObj: DesignTokens = defaultTokens): string {
  return generateCSSVars(tokenObj, ':root');
}

export function generateDarkModeCSSVars(tokenObj: DesignTokens = defaultTokens): string {
  return generateCSSVars(tokenObj, '[data-theme="dark"]');
}

export function generateAllCSSVars(tokenObj: DesignTokens = defaultTokens): string {
  return `${generateRootCSSVars(tokenObj)}\n\n${generateDarkModeCSSVars(tokenObj)}`;
}

export function injectCSSVars(cssVars: string = generateAllCSSVars()): void {
  if (typeof document === 'undefined') return;

  let styleEl = document.getElementById('ecjy-design-tokens') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'ecjy-design-tokens';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = cssVars;
}

export function removeCSSVars(): void {
  if (typeof document === 'undefined') return;
  const styleEl = document.getElementById('ecjy-design-tokens');
  if (styleEl) {
    styleEl.remove();
  }
}

export function getCSSVarName(path: TokenPath): string {
  const flat = flattenTokens(defaultTokens as unknown as Record<string, unknown>);
  const key = Object.keys(flat).find((k) => {
    const tokenPath = path.replace(/\./g, '-').toLowerCase();
    return k.endsWith(tokenPath) || k === tokenPath;
  });
  return key ? `--${PREFIX}-${key}` : `--${PREFIX}-${path.replace(/\./g, '-').toLowerCase()}`;
}

export function getCSSVarValue(path: TokenPath): string {
  return `var(${getCSSVarName(path)})`;
}

export const cssVarMap: Record<TokenPath, string> = new Proxy(
  {} as Record<TokenPath, string>,
  {
    get(_, prop: string) {
      return getCSSVarValue(prop as TokenPath);
    },
  }
);