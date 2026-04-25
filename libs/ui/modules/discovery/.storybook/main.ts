
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import tailwindcss from '@tailwindcss/vite';

import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from "vite";


const config: StorybookConfig = {
  stories: [
    
    '../src/lib/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'
  ],
  addons: [],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {
      
      builder: {
        viteConfigPath: 'vite.config.mts',
      },
      
    },
  },
  viteFinal: async (config) => {
    return mergeConfig(config, {
      plugins: [tailwindcss()],
    });
  },
};


function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}


export default config;




// To customize your Vite configuration you can use the viteFinal field.
// Check https://storybook.js.org/docs/react/builders/vite#configuration
// and https://nx.dev/recipes/storybook/custom-builder-configs
