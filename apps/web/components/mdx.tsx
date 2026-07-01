import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type { ComponentProps } from 'react';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    img: (props) => <ImageZoom {...(props as ComponentProps<typeof ImageZoom>)} />,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
