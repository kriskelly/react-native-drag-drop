/* @flow */

'use strict';

export function makeMockComponent(baseComponent: ReactClass): ReactClass {
  const mock = () => <baseComponent />;
  mock['@noCallThru'] = true;
  mock['@global'] = true;
  return mock;
}