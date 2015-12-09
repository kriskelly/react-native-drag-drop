/* @flow */

'use strict';

import invariant from 'invariant';
import React from 'react-native';
const {
  PropTypes,
} = React;

import type {
  DropZoneEdge,
} from './types';

import { DragContext, EdgeTypes } from './DragContext';

type Props = {
  currentDropZone: ?string,
  dropZoneName: string,
  currentDropZoneEdge: DropZoneEdge,
  scrollEnabled: boolean,
};

const DEFAULT_AUTOSCROLL_POS_INCREMENT = 20;
const DEFAULT_AUTOSCROLL_TIME_INTERVAL = 300;

type Options = {
  positionIncrement?: number,
  scrollInterval?: number,
};

export function createAutoscrollable(Component: ReactClass, options: Options = {}): ReactClass {
  class Autoscrollable extends (React.Component : typeof ReactComponent) {
    props: Props;
    static defaultProps: {};
    static scrollInterval: number;
    static positionIncrement: number;

    context: {
      dragContext: DragContext
    };

    scrollableRef: ?Object;
    autoscrollInterval: ?number;

    constructor(props: Props) {
      super(props);
    }

    componentDidMount() {
      invariant(
        this.scrollableRef && this.scrollableRef.scrollTo,
        'Autoscrollable: Wrapped component must implement scrollTo()!'
      );
    }

    componentWillReceiveProps(props: Props) {
      invariant(props.hasOwnProperty('currentDropZone'), 'Autoscrollable: must be passed \'currentDropZone\' prop');
      invariant(props.hasOwnProperty('currentDropZoneEdge'), 'Autoscrollable: must be passed \'currentDropZoneEdge\' prop');
      invariant(this.scrollableRef, 'Autoscrollable: wrapped component must be "ref"-able');
      invariant(this.scrollableRef.scrollTo, 'Autoscrollable: wrapped component must implement scrollTo()');

      if (props.currentDropZone !== props.dropZoneName) {
        this.stopAutoscroll();
      } else {
        // Only do something if the edge prop changed
        if (props.currentDropZoneEdge !== this.props.currentDropZoneEdge) {
          if (props.currentDropZoneEdge) {
            this.startAutoscroll(props.currentDropZoneEdge);
          } else {
            this.stopAutoscroll();
          }
        }
      }
    }

    componentWillUnmount() {
      this.stopAutoscroll();
    }

    _doAutoscroll(dropZoneEdge) {
      const contentOffset = this.context.dragContext.getContentOffset(
        this.props.dropZoneName
      );
      const layout = this.context.dragContext.getLayout(
        this.props.dropZoneName
      );

      let dy = 0;
      let dx = 0;
      switch(dropZoneEdge) {
        case EdgeTypes.TOP: {
          // Move up
          dy = 0 - Autoscrollable.positionIncrement;
          if (contentOffset.y <= layout.y) {
            this.stopAutoscroll();
            return;
          }
          break;
        }
        case EdgeTypes.BOTTOM: {
          dy = Autoscrollable.positionIncrement;
          if (contentOffset.y >= (layout.y + layout.height)) {
            this.stopAutoscroll();
            return;
          }
          break;
        }
        case EdgeTypes.LEFT: {
          dx = 0 - Autoscrollable.positionIncrement;
          if (contentOffset.x <= layout.x) {
            this.stopAutoscroll();
            return;
          }
          break;
        }
        case EdgeTypes.RIGHT: {
          dx = Autoscrollable.positionIncrement;
          if (contentOffset.x >= (layout.x + layout.width)) {
            this.stopAutoscroll();
            return;
          }
          break;
        }
        default: {
          throw 'invalid edge type: ', dropZoneEdge;
        }
      }

      const destY = contentOffset.y + dy;
      const destX = contentOffset.x + dx;
      if (__DEV__) {
        console.log(`Autoscrollable: scrollTo(${destY}, ${destX})`);
      }
      this.scrollableRef && this.scrollableRef.scrollTo(
        destY, destX
      );
      this.forceUpdate();
    }

    /**
     * Autoscrolling.
     *
     * Set up an interval that grabs the current content offset
     * and scrolls by a small amount in the given direction.
     *
     * @param  DropZoneEdge dropZoneEdge If null, stop the autoscrolling.
     */
    startAutoscroll(dropZoneEdge: DropZoneEdge) {
      this.stopAutoscroll();
      if (__DEV__) {
        console.log(`Autoscrollable: startAutoscroll(${dropZoneEdge})`);
      }
      this.autoscrollInterval = setInterval(() => {
        this._doAutoscroll(dropZoneEdge);
      }, Autoscrollable.scrollInterval);
    }

    stopAutoscroll() {
      if (__DEV__) {
        console.log('Autoscrollable: stopAutoscroll()');
      }
      this.autoscrollInterval && clearInterval(this.autoscrollInterval);
      this.autoscrollInterval = null;
    }

    render() {
      return (
        <Component
          {...this.props}
          ref={c => this.scrollableRef = c} />
      );
    }
  }

  Autoscrollable.contextTypes = {
    dragContext: PropTypes.instanceOf(DragContext).isRequired,
  };

  Autoscrollable.scrollInterval = options.scrollInterval
                                ? options.scrollInterval
                                : DEFAULT_AUTOSCROLL_TIME_INTERVAL;
  Autoscrollable.positionIncrement = options.positionIncrement
                                   ? options.positionIncrement
                                   : DEFAULT_AUTOSCROLL_POS_INCREMENT;
  return Autoscrollable;
}