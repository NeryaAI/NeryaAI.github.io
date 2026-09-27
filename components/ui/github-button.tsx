import React from 'react';
import { ArrowUpRight, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Real link: works before hydration and with JavaScript disabled. */
export function GitHubButton({ compact = false, secondary = false, className }: {
  compact?: boolean; secondary?: boolean; className?: string;
}) {
  return <a href="https://github.com/NeryaAI/Nerya" target="_blank" rel="noopener noreferrer" data-get-started
    className={cn('github-cta inline-flex items-center justify-center gap-3 rounded-lg', compact && 'github-cta-small', secondary && 'github-cta-secondary', className)}>
    <GitBranch size={compact ? 15 : 18} strokeWidth={1.6} aria-hidden="true"/>
    <span data-i18n data-zh={compact ? '开始使用' : '前往 GitHub'} data-en={compact ? 'Get started' : 'Get Nerya on GitHub'}>{compact ? '开始使用' : '前往 GitHub'}</span>
    <ArrowUpRight size={compact ? 14 : 16} aria-hidden="true"/>
  </a>;
}
