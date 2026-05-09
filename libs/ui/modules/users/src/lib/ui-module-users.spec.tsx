import { render } from '@testing-library/react';

import UiModuleUsers from './ui-module-users';

describe('UiModuleUsers', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<UiModuleUsers />);
    expect(baseElement).toBeTruthy();
  });
});
