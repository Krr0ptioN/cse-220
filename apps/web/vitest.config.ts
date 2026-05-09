import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
      'ui-common': path.resolve(rootDir, '../../libs/ui/common/src/index.ts'),
      'ui-common/styles': path.resolve(rootDir, '../../libs/ui/common/src/styles'),
      'ui-common/server': path.resolve(rootDir, '../../libs/ui/common/src/server.ts'),
      'ui-common/components': path.resolve(rootDir, '../../libs/ui/common/src/lib/components'),
      'ui-common/lib': path.resolve(rootDir, '../../libs/ui/common/src/lib'),
      'ui-common/hooks': path.resolve(rootDir, '../../libs/ui/common/src/lib/hooks'),
      '@flavor-map/ui-module-restaurants': path.resolve(
        rootDir,
        '../../libs/ui/modules/restaurants/src/index.ts',
      ),
    },
  },
  test: {
    environment: 'node',
  },
});
