import { render } from '@testing-library/react';

import UiModuleRestaurants from './ui-module-restaurants';

describe('UiModuleRestaurants', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<UiModuleRestaurants />);
    expect(baseElement).toBeTruthy();
  });
});
