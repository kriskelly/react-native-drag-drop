/* @flow weak */

'use strict';

import {expect} from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

import React from './__mocks__/react-native';
// Import the real DragContext class so that type checking works.
import { DragContext } from '../src/DragContext';
const { PanResponder } = React;

describe('createDragPanResponder', () => {
  let createDragPanResponder;
  let dragContext;

  let dragItem;
  let onStop;
  let panResponder;
  let state;

  beforeEach(() => {
    dragItem = {
      id: '123',
    };

    state = {
      dragItem,
      pan: new React.Animated.ValueXY()
    };

    ({createDragPanResponder} = proxyquire('../src/DragPanResponder', {
      'react-native': React,
      './DragContext': {
        DragContext,
        '@noCallThru': true,
      },
    }));

    dragContext = {
      getBaseLayout: sinon.stub(),
    };

    dragContext.getBaseLayout.returns({
      x: 0, y: 0
    });

    onStop = sinon.stub();
  });

  function subject() {
    return createDragPanResponder(
      state,
      dragContext,
      onStop
    );
  }

  it('sets up the pan responder for dragging', () => {
    sinon.spy(PanResponder, 'create');
    subject();
    expect(PanResponder.create).to.have.been.called;
    PanResponder.create.restore();
  });

  describe('handlers', () => {
    let handlers;

    describe('onStartShouldSetPanResponder/onMoveShouldSetPanResponder', () => {
      beforeEach(() => {
        const responder = subject();
        handlers = responder.handlers;
      });

      it('responds on start/move', () => {
        expect(handlers.onStartShouldSetPanResponder()).to.be.true;
        expect(handlers.onMoveShouldSetPanResponder()).to.be.true;
      });
    });

    describe('onPanResponderMove', () => {
      let eventTracker;

      beforeEach(() => {
        eventTracker = sinon.stub();
        sinon.stub(React.Animated, 'event').returns(eventTracker);
        handlers = subject().handlers;
      });

      afterEach(() => {
        React.Animated.event.restore();
      });

      it('tracks y axis movement via the pan state', () => {
        const e = 'fake synthetic event';
        const gestureState = {
          moveY: 100
        };
        handlers.onPanResponderMove(e, gestureState);
        expect(React.Animated.event).to.have.been.called;
        expect(eventTracker).to.have.been.calledWith(
          e, gestureState
        );
      });

      describe('when the gesture moves beyond the upper bounds', () => {
        it('stops tracking the pan', () => {
          const e = 'fake synthetic event';
          const gestureState = {
            moveY: -5
          };
          handlers.onPanResponderMove(e, gestureState);
          expect(eventTracker).not.to.have.been.called;
        });

        describe('when the gesture is moving downwards', () => {
          it('allows tracking', () => {
            const e = 'fake';
            const gestureState = {
              moveY: -5,
              vy: 3
            };
            handlers.onPanResponderMove(e, gestureState);
            expect(eventTracker).to.have.been.calledWithExactly(
              e, gestureState
            );
          });
        });
      });
    });
  });
});