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
  instance: ReactComponent,
  dragContext: DragContext,
  panDirection: string,
  onStop: Function
) {
  invariant(instance.state.pan, 'Pan must be initialized before creating drag handlers.');

  return {
    onStartShouldSetPanResponder: () => {
      return !!instance.state.dragItem;
    },

    onMoveShouldSetPanResponder: () => {
      return !!instance.state.dragItem;
    },

    onPanResponderGrant: () => {
      invariant(instance.state.dragItem, 'Dragged todo must be specified before pan starts.');
      // const diff = Math.abs(pan.y._offset - gestureState.moveY);
      // console.log('diff: ', diff);
    },

    onPanResponderMove: createOnPanResponderMove(instance.state.pan, dragContext, panDirection),

    onPanResponderRelease: () => {
      invariant(instance.state.dragItem,
        'Dragged todo must be specified before pan release.');
      invariant(
        instance.state.pan && instance.state.pan.y._offset >= 0,
        'Pan y offset must be >= 0 when dropping.');
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

/**
 * Create a PanResponder for the drag operation.
 *
 * Used directly by DragArena and makes assumptions about state.
 *
 * Note that this function receives the mounted React
 * component instance instead of the component state,
 * because apparently state on its own is not a stable object
 * reference that can be checked for changes.
 *
 * @param  ReactComponent instance
 * @param  DragContext dragContext
 * @param  string panDirection
 * @param  function onStop
 * @return PanResponder
 */
export function createDragPanResponder(
  instance: ReactComponent,
  dragContext: DragContext,
  panDirection: string,
  onStop: Function
): PanResponder {
  return PanResponder.create(createDragHandlers(
    instance, dragContext, panDirection, onStop
  ));
}

