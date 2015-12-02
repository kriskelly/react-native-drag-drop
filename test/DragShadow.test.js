/* @flow weak */

'use strict';

import {expect} from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import sd from 'skin-deep';
import { makeMockComponent } from './makeMockComponent';
import React from './__mocks__/react-native';

import type { Props } from '../src/DragShadow';
const { Animated, View } = React;


describe('createDragShadow', () => {
  let tree;
  let vdom;
  let BaseComponent;
  let createDragShadow;

  let props: ?Props;

  let DerivedShadow;

  beforeEach(() => {
    ({createDragShadow} = proxyquire('../src/DragShadow', {
      'react-native': React,
    }));

    let pan = new Animated.ValueXY();
    sinon.stub(pan, 'getLayout').returns({
      top: 123,
      left: 456,
    });
    props = {
      pan,
      dragItemLayout: {
        x: 0,
        y: 0,
        width: 100,
        height: 200,
      }
    };

    BaseComponent = makeMockComponent(View);
    DerivedShadow = createDragShadow(BaseComponent)
  });

  function subject(props: Props) {
    tree = sd.shallowRender(
      React.createElement(DerivedShadow, props));
    vdom = tree.getRenderOutput();
  }

  it('renders the wrapped component', () => {
    props && subject(props);
    expect(vdom.type).to.equal(BaseComponent);
  });

  it('passes style prop with position info', () => {
    props && subject(props);
    const { style } = vdom.props;
    expect(style).to.have.property('top', 123);
    expect(style).to.have.property('left', 456);
    expect(style).to.have.property('width', 100);
    expect(style).to.have.property('height', 200);
  });
});