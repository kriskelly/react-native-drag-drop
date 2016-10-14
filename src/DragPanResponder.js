/* @flow */

'use strict';

import React from 'react';
import {
  Animated,
  PanResponder,
} from 'react-native';

import { DragContext } from './DragContext';
import invariant from 'invariant';

import type { State } from './DragArena';

function setBounds(bounds, tracker, direction) {
  return (e, gestureState) => {
    if (direction === 'y') {
      const aboveTop = gestureState.moveY < bounds.y;
      const belowBottom = gestureState.moveY > (bounds.y + bounds.height);
      const movingDownward = gestureState.vy > 0;
      const movingUpward = gestureState.vy < 0;
      if ((!aboveTop || movingDownward) && (!belowBottom || movingUpward)) {
        return tracker(e, gestureState);
      }
    } else if (direction === 'x') {
      const beyondLeft = gestureState.moveX < bounds.x;
      const beyondRight = gestureState.moveX > (bounds.x + bounds.width);
      const movingLeft = gestureState.vx < 0;
      const movingRight = gestureState.vx > 0;
      if ((!beyondLeft || movingRight) && (!beyondRight || movingLeft)) {
        return tracker(e, gestureState);
      }
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
  dragContext: DragContext,
  panDirection: string
) {
  let trackerArgs;
  if (panDirection === 'y') {
    trackerArgs = [
      null,
      {dy: pan.y}
    ];
  } else {
    trackerArgs = [
      null,
      {dx: pan.x}
    ];
  }

  return setBounds(
    dragContext.getBaseLayout(),
    Animated.event(trackerArgs),
    panDirection
  );
}

function createDragHandlers(
  state: State,
  dragContext: DragContext,
  panDirection: string,
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

    onPanResponderMove: createOnPanResponderMove(pan, dragContext, panDirection),

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
  panDirection: string,
  onStop: Function
): PanResponder {
  return PanResponder.create(createDragHandlers(
    state, dragContext, panDirection, onStop
  ));
}
