/* @flow */

'use strict';

import React from 'react-native';
const {
  Animated,
  PanResponder,
  PropTypes,
  View,
} = React;

import invariant from 'invariant';
import { DragContext } from './DragContext';
import type { DragItem } from './DragContext';

import type {
  NativeLayoutEvent,
  Position,
} from './types';

type Props = {};

type State = {
  currentDropZone: ?string,
  currentDropZoneEdge: ?string,
  dragItem: ?any,
  panResponder: ?PanResponder,
  pan: ?Animated.ValueXY,
};

export function createDragArena(
  Component: ReactClass,
  DragShadowComponent: ReactClass,
  dragContext: DragContext
): ReactClass {
  class DragArena extends (React.Component : typeof ReactComponent) {
    props: Props;
    state: State;

    static defaultProps: {};

    panListener: string;

    constructor(props: Props) {
      super(props);

      this.panListener = '';
      this.state = {
        currentDropZone: null,
        currentDropZoneEdge: null,
        dragItem: null,
        panResponder: null, // Will be initialized during a drag.
        pan: null,
      };
    }

    getChildContext() {
      return {
        dragContext,
      };
    }

    cacheBaseLayout(e: NativeLayoutEvent) {
      dragContext.setBaseLayout(e.nativeEvent.layout);
    }

    /**
     * Long press gesture handler, starts drag operation.
     *
     * Sets up the state invariants for the drag, such as default pan state.
     *
     * Note that the pan needs to be re-initialized to a non-zero value,
     * because the drag shadow tracks the pan state and it will jump around
     * when pan offset defaults to 0.
     *
     */
    handleLongPress(dragItem: DragItem) {
      // invariant(typeof dropZoneName === 'string', 'Drop zone must be a string!');
      invariant(dragItem, 'Drag item must be valid!');
      this.setState((state: State) => {
        const dragItemLayout = dragContext.getDragItemLayout(dragItem);
        invariant(dragItemLayout, 'Drag item layout not stored!');
        state.currentDropZone = dragItemLayout.dropZoneName;
        invariant(state.currentDropZone, 'Must have a valid drop zone!');
        state.dragItem = dragItem;
        const pan = state.pan = new Animated.ValueXY();
        this.panListener = pan.addListener(this.watchPanChanges.bind(this));
        pan.setOffset({
          x: dragContext.getDragItemOffset(dragItem, 'x'),
          y: dragContext.getDragItemOffset(dragItem, 'y'),
        });
        state.panResponder = this.createPanResponder(pan);
        return state;
      });
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
    createOnPanResponderMove(pan: Animated.ValueXY) {
      function setBounds(yTop, tracker) {
        return (e, gestureState) => {
          const isBelowYTop = gestureState.moveY >= yTop;
          const movingDownward = gestureState.vy > 0;
          if (isBelowYTop || movingDownward) {
            return tracker(e, gestureState);
          }
        };
      }

      return setBounds(
        dragContext.baseLayout.y,
        Animated.event([
          null,
          {dy: pan.y}
        ])
      );
    }

    createPanResponder(pan: Animated.ValueXY): PanResponder {
      const dragHandlers = {
        onStartShouldSetPanResponder: () => {
          return !!this.state.dragItem;
        },
        onMoveShouldSetPanResponder: () => {
          return !!this.state.dragItem;
        },
        onPanResponderGrant: () => {
          invariant(this.state.dragItem, 'Dragged todo must be specified before pan starts.');
          // const diff = Math.abs(pan.y._offset - gestureState.moveY);
          // console.log('diff: ', diff);
        },
        onPanResponderMove: this.createOnPanResponderMove(pan),
        onPanResponderRelease: function() {
          invariant(this.state.dragItem, 'Dragged todo must be specified before pan release.');
          invariant(pan.y._offset >= 0, 'Pan offset must be >= 0 when dropping.');
          return dragContext.drop(this.props, this.state).then(() => {
            this.stopDrag();
          });
        }.bind(this),
        onPanResponderTerminationRequest: function() {
          return false;
        }.bind(this),
        onPanResponderTerminate: function() {
          this.stopDrag();
        }.bind(this)
      };
      return PanResponder.create(dragHandlers);
    }

    watchPanChanges(pos: Position) {
      const dropZoneName = dragContext.getDropZoneFromYOffset(pos.y);

      if (dropZoneName) {
        const edge = dragContext.getDropZoneEdge(pos, dropZoneName);
        if (edge !== this.state.currentDropZoneEdge) {
          this.setState({
            currentDropZoneEdge: edge
          });
        }

        if (dropZoneName !== this.state.currentDropZone) {
          this.setState({
            currentDropZone: dropZoneName,
          });
        }
      }
    }

    /**
     * Stop the drag action.
     *
     * Nullify all the state required for the drag (pan, pan responder,
     * drop zone, etc.).
     *
     * This also removes the pan listener.
     */
    stopDrag() {
      this.setState((state) => {
        state.currentDropZone = null;
        state.dragItem = null;
        state.panResponder = null;
        // onPanResponderRelease() can occasionally be called multiple times.
        state.pan && state.pan.removeListener(this.panListener);
        this.panListener = '';
        state.pan = null;
        return state;
      });
    }

    render() {
      const {
        currentDropZone,
        currentDropZoneEdge,
        dragItem,
        pan,
      } = this.state;

      let dragShadow;
      let panHandlers;

      if (dragItem && pan) {
        dragShadow = (
          <DragShadowComponent
            currentDropZone={currentDropZone}
            pan={pan}
            dragItem={dragItem}
            dragItemLayout={dragContext.getDragItemLayout(dragItem).layout} />
        );
      }

      if (this.state.panResponder) {
        panHandlers = this.state.panResponder.panHandlers;
      }

      const cacheBaseLayout = this.cacheBaseLayout.bind(this);
      const startDragHandler = this.handleLongPress.bind(this);
      const scrollEnabled = !dragItem;
      return (
        <View style={{flex: 1}} {...panHandlers} onLayout={cacheBaseLayout}>
          <Component
            startDragHandler={startDragHandler}
            scrollEnabled={scrollEnabled}
            dragItem={dragItem}
            currentDropZone={currentDropZone}
            currentDropZoneEdge={currentDropZoneEdge}
            {...this.props} />
          {dragShadow}
        </View>
      );
    }
  }

  DragArena.childContextTypes = {
    dragContext: PropTypes.instanceOf(DragContext),
  };

  return DragArena;
}