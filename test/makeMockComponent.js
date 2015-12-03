/* @flow */
/* eslint react-jsx-scope: 0 */

'use strict';

export function makeMockComponent(baseComponent: ReactClass): ReactClass {
  const mock = () => <baseComponent />;
  mock['@noCallThru'] = true;
  mock['@global'] = true;
  return mock;
}