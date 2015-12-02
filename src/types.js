/* @flow */

'use strict';

import React from 'react-native';

const {
  Animated
} = React;

export type SyntheticNativeEvent = {
  nativeEvent: any
};

export type ContentOffset = {
  x: number,
  y: number,
};

type AnimatedStyle = number | Animated.Value;

export type DragShadowStyle = {
  top: AnimatedStyle,
  left: AnimatedStyle,
  width: AnimatedStyle,
  height: AnimatedStyle,
};

export type DropZoneEdge = string | void;

export type DropZoneName = string;

export type DropZone = {
  name: DropZoneName,
  layout: Layout,
  contentOffset: ContentOffset,
};

export type DragItemLayout = {
  layout: Layout,
  dropZoneName: DropZoneName,
};

export type Layout = {
  y: number,
  x: number,
  width: number,
  height: number,
};

export type NativeLayoutEvent = {
  nativeEvent: {
    layout: Layout
  }
};

export type Position = {
  x: number,
  y: number
};