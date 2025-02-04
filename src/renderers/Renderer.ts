// src/renderers/Renderer.ts
import { FileContext } from '../types';

export interface Renderer<T = unknown> {
  render(context: FileContext): T;
}