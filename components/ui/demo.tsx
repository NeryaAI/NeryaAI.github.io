"use client";
import React from 'react';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';

/** Standalone integration example. The production page passes its actual
 * isolated workspace as children, not a stock image or a Next.js dependency. */
export function HeroScrollDemo() {
  return <ContainerScroll titleComponent={<h1 className="text-4xl font-semibold text-foreground">One idea<br/><span>A team to build it</span></h1>}>
    <img src="/assets/product-demos/strategy-poster.webp" alt="Nerya strategy walkthrough example"
      width={960} height={640} draggable={false} className="mx-auto h-full w-full rounded-2xl object-cover" />
  </ContainerScroll>;
}
