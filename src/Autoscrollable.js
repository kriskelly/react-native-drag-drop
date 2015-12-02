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

const AUTOSCROLL_POS_INCREMENT = 20;
const AUTOSCROLL_TIME_INTERVAL = 300;

export function createAutoscrollable(Component: ReactClass): ReactClass {
  class Autoscrollable extends (React.Component : typeof ReactComponent) {
    props: Props;
    static defaultProps: {};

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
      const yOffset = contentOffset.y;
      if (yOffset <= 0) {
        this.stopAutoscroll();
      }
      let dy;
      switch(dropZoneEdge) {
        case EdgeTypes.TOP: {
          // Move up
          dy = 0 - AUTOSCROLL_POS_INCREMENT;
          break;
        }
        case EdgeTypes.BOTTOM: {
          dy = AUTOSCROLL_POS_INCREMENT;
          break;
        }
        default: {
          throw 'invalid edge type!';
        }
      }

      this.scrollableRef && this.scrollableRef.scrollTo(yOffset + dy);
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
      this.autoscrollInterval = setInterval(() => {
        this._doAutoscroll(dropZoneEdge);
      }, AUTOSCROLL_TIME_INTERVAL);
    }

    stopAutoscroll() {
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

  return Autoscrollable;
}