/* @flow */

'use strict';

import invariant from 'invariant';
import React from 'react';

import {
  Animated,
} from 'react-native';

import type {
  DragShadowStyle,
  Layout,
} from './types';

export type Props = {
  pan: Animated.ValueXY,
  dragItemLayout: Layout,
};

export function createDragShadow(Component: ReactClass): ReactClass {
  class DragShadow extends (React.Component : typeof ReactComponent) {

    props: Props;

    dragShadowStyle(): DragShadowStyle {
      const { width, height } = this.props.dragItemLayout;
      invariant(width && height, 'Width and height required to render drag shadow!');
      const { top, left } = this.props.pan.getLayout();
      return {
         top,
         left,
         width,
         height,
      };
    }

    render() {

      return (
        <Component
          {...this.props}
          style={this.dragShadowStyle()} />
      );
    }
  }

  return DragShadow;
}
