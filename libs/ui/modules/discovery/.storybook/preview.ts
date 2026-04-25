import 'ui-common/styles/global.css';
import './preview.css';

import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      expanded: true,
    },
  },
};

export default preview;
