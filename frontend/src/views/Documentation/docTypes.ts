export interface DocSection {
  id: string;
  title: string;
  category: 'START HERE' | 'SYSTEM ARCHITECTURE' | 'STATISTICAL METHODOLOGY' | 'ENGINEERING & DATA' | 'REFERENCE & AUDIT' | 'JUDGE EVALUATION';
  badge?: string;
  content: string; // Markdown or rich structured text
}

export const DOC_CATEGORIES = [
  'START HERE',
  'SYSTEM ARCHITECTURE',
  'STATISTICAL METHODOLOGY',
  'ENGINEERING & DATA',
  'REFERENCE & AUDIT',
  'JUDGE EVALUATION',
] as const;
