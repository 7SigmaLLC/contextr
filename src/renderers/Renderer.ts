import { FileContext } from '../types';

export interface Renderer {
  render(context: FileContext): string;
}