import { games, type Game } from './games';
import baseline from '../content/version.json';
import { mergeGames as merge } from '../content/merge.mjs';
import { version as appVersion } from '../package.json';
export type Bundle = { version: string; games: Game[] };
export type UpdateStatus = { state: 'current' | 'available'; version: string };
export interface ContentBridge {
  load(): Promise<Bundle | null>;
  check(): Promise<UpdateStatus>;
  install(): Promise<Bundle>;
}
declare global { interface Window { learningContent?: ContentBridge } }
export const contentVersion = baseline.version;
export function mergeGames(downloaded: Game[]) {
  return merge(games, downloaded);
}
export async function loadPublished(): Promise<Bundle | null> {
  if (window.learningContent) return window.learningContent.load().catch(() => null);
  try {
    const base = `${import.meta.env.BASE_URL}content/`;
    const response = await fetch(`${base}manifest.json`, { cache: 'no-cache' });
    if (!response.ok) return null;
    const manifest = await response.json();
    if (manifest.formatVersion !== 1 || !/^\d+\.\d+\.\d+$/.test(manifest.version) || manifest.files?.[0]?.path !== `versions/${manifest.version}/bundle.json`) return null;
    if (!/^\d+\.\d+\.\d+$/.test(manifest.minAppVersion) || manifest.files[0].size > 40 * 1024 * 1024) return null;
    const minimum = manifest.minAppVersion.split('.').map(Number);
    const current = appVersion.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (minimum[i] > current[i]) return null;
      if (minimum[i] < current[i]) break;
    }
    const result = await fetch(base + manifest.files[0].path);
    if (!result.ok) return null;
    const bytes = await result.arrayBuffer();
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
    if (bytes.byteLength !== manifest.files[0].size || hash !== manifest.files[0].sha256) return null;
    const bundle = JSON.parse(new TextDecoder().decode(bytes));
    return bundle.formatVersion === 1 && bundle.version === manifest.version && Array.isArray(bundle.games) ? bundle : null;
  } catch { return null; }
}
