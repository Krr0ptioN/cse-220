import { render } from '@testing-library/react';

import UiModuleOwner from './ui-module-owner';

describe('UiModuleOwner', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<UiModuleOwner />);
    expect(baseElement).toBeTruthy();
  });
});
