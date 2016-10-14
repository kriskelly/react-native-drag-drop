/* @flow */

'use strict';

import React, { PropTypes } from 'react';
import {
  View,
} from 'react-native';

import invariant from 'invariant';
import { DragContext } from './DragContext';
import { NativeLayoutEvent, SyntheticNativeEvent } from './types';

/**
 * Higher-order component to set up a drop zone.
 *
 * Returns a component that can be rendered by any parent that
 * has been wrapped in createDragArena(). The two components
 * share a context object to communicate.
 *
 * Most of the trickiness thus far in creating a drag/drop implementation
 * has been getting the screen measurements right, both in terms of how/where
 * to render the drag shadow as well as finding the exact location of the drop.
 *
 * That location corresponds to the upper bound of the drag shadow view, not
 * the screen coordinates of the pan gesture. This just means some janky
 * calculations need to take place before we can be sure we're dropping the
 * thing correctly.
 *
 * Usage: createDropZone(MyView, name='something special');
 * @param  ReactClass Component
 * @param  string name
 * @return ReactClass
 */
export function createDropZone(Component: ReactClass, dropZoneName: string): ReactClass {
  invariant(dropZoneName, 'Drop zone name must be set!');

  class DropZone extends (React.Component : typeof ReactComponent) {

    context: {
      dragContext: DragContext
    };

    componentWillMount() {
      invariant(
        this.context && this.context.dragContext,
        'Context not configured correctly!'
      );
      // Initialize drop zone here.
      this.context.dragContext.initDropZone(dropZoneName);
    }

    handleDragItemLayout(dragItem: any, e: NativeLayoutEvent) {
      this.context.dragContext.setDragItemLayout(
        dropZoneName,
        dragItem,
        e.nativeEvent.layout
      );
    }

    handleLayout(e: NativeLayoutEvent) {
      this.context.dragContext.setLayout(
        dropZoneName,
        e.nativeEvent.layout
      );
    }

    handleScroll(e: SyntheticNativeEvent) {
      this.context.dragContext.setContentOffset(
        dropZoneName,
        e.nativeEvent.contentOffset
      );
    }

    render() {
      return (
        <View onLayout={this.handleLayout.bind(this)}>
          <Component
            {...this.props}
            dropZoneName={dropZoneName}
            onScroll={this.handleScroll.bind(this)}
            onDragItemLayout={this.handleDragItemLayout.bind(this)} />
        </View>
      );
    }
  }

  DropZone.contextTypes = {
    dragContext: PropTypes.instanceOf(DragContext).isRequired,
  };

  return DropZone;
}
