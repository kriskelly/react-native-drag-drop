/* @flow */

'use strict';

import React from 'react-native';
const {
  Animated,
  PanResponder,
} = React;

import { DragContext } from './DragContext';
import invariant from 'invariant';

import type { State } from './DragArena';

function setBounds(yTop, tracker) {
  return (e, gestureState) => {
    const isBelowYTop = gestureState.moveY >= yTop;
    const movingDownward = gestureState.vy > 0;
    if (isBelowYTop || movingDownward) {
      return tracker(e, gestureState);
    }
  };
}

/**
 * Create a PanResponder callback for onPanResponderMove().
 *
 * Generally, this will track the movement of the pan in the Y
 * direction.
 *
 * If the y movement goes beyond the bounds of the DragArena,
 * movement should stop.
 */
function createOnPanResponderMove(
  pan: Animated.ValueXY,
  dragContext: DragContext
) {
  return setBounds(
    dragContext.getBaseLayout().y,
    Animated.event([
      null,
      {dy: pan.y}
    ])
  );
}

function createDragHandlers(
  state: State,
  dragContext: DragContext,
  onStop: Function
) {
  const { pan } = state;
  invariant(pan, 'Pan must be initialized before creating drag handlers.');

  return {
    onStartShouldSetPanResponder: () => {
      return !!state.dragItem;
    },

    onMoveShouldSetPanResponder: () => {
      return !!state.dragItem;
    },

    onPanResponderGrant: () => {
      invariant(state.dragItem, 'Dragged todo must be specified before pan starts.');
      // const diff = Math.abs(pan.y._offset - gestureState.moveY);
      // console.log('diff: ', diff);
    },

    onPanResponderMove: createOnPanResponderMove(pan, dragContext),

    onPanResponderRelease: () => {
      invariant(state.dragItem, 'Dragged todo must be specified before pan release.');
      invariant(pan && pan.y._offset >= 0, 'Pan y offset must be >= 0 when dropping.');
      return onStop();
    },

    onPanResponderTerminationRequest: () => {
      return false;
    },
    onPanResponderTerminate: () => {
      onStop();
    }
  }
}

export function createDragPanResponder(
  state: State,
  dragContext: DragContext,
  onStop: Function
): PanResponder {
  return PanResponder.create(createDragHandlers(
    state, dragContext, onStop
  ));
}

