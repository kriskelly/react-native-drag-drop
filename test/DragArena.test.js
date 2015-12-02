/* @flow weak */

'use strict';

import {expect} from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import sd from 'skin-deep';

import React from './__mocks__/react-native';
import { makeMockComponent } from './makeMockComponent';
// DragContext has no RN dependencies so we can import the real one.
import { createDragContext, DragContext } from '../src/DragContext';
const { View } = React;

describe('createDragArena', () => {
  let tree;
  let vdom;

  let createDragArena;
  let BaseComponent;
  let ShadowComponent;
  let dragContext;

  beforeEach(() => {
    ({createDragArena} = proxyquire('../src/DragArena', {
      'react-native': React,
      './DragContext': {
        DragContext, // No idea why this needs to be here, but it does.
        '@noCallThru': true,
      },
    }));

    BaseComponent = makeMockComponent(View);
    ShadowComponent = makeMockComponent(View);

    dragContext = createDragContext(() => {});
  });

  function subject() {
    const component = createDragArena(
      BaseComponent,
      ShadowComponent,
      dragContext
    );

    tree = sd.shallowRender(
      React.createElement(component));
    vdom = tree.getRenderOutput();
  }

  it('renders a View component', () => {
    subject();
    expect(vdom.type).to.equal(View);
  });

  it('renders the base component', () => {
    subject();
    expect(vdom.props.children[0].type).to.equal(BaseComponent);
  });

  describe('base component props', () => {
    let startDragHandler;
    let scrollEnabled;
    let dragItem;

    beforeEach(() => {
      subject();
      const baseComponent = vdom.props.children[0];
      ({
        startDragHandler,
        scrollEnabled,
        dragItem,
      } = baseComponent.props);
    });

    describe('dragItem', () => {
      it('is not set by default', () => {
        expect(dragItem).to.be.null;
      });
    });

    describe('scrollEnabled', () => {
      it('is true by default', () => {
        expect(scrollEnabled).to.be.true;
      });
    });

    describe('#watchPanChanges', () => {
      let instance;

      beforeEach(() => {
        instance = tree.getMountedInstance();
        sinon.stub(dragContext, 'getDropZoneFromYOffset')
          .onFirstCall().returns('foo')
          .onSecondCall().returns('foo')
          .onThirdCall().returns('bar');
        sinon.spy(instance, 'setState');

        sinon.stub(dragContext, 'getDropZoneEdge');
      });

      it('sets the drop zone state', () => {
        instance.watchPanChanges({y: 3});
        expect(instance.setState).to.have.been.calledWith(
          { currentDropZone: 'foo'}
        );
      });

      it('only sets the state when the drop zone changes (performance)', () => {
        instance.watchPanChanges({y: 3});
        instance.watchPanChanges({y: 3});
        expect(instance.setState.withArgs({currentDropZone: 'foo'})).to.have.been.calledOnce;
        instance.watchPanChanges({y: 3});
        expect(instance.setState).to.have.been.calledWith({
          currentDropZone: 'bar'
        });
      });

      it('detects the edge of the drop zone', () => {
        dragContext.getDropZoneEdge.returns('TOP');
        instance.watchPanChanges({y: 3});
        expect(instance.setState.withArgs({
          currentDropZoneEdge: 'TOP'
        })).to.have.been.calledOnce;
      });

      it('only sets the state when the drop zone edge changes', () => {
        dragContext.getDropZoneEdge
          .onFirstCall().returns('TOP')
          .onSecondCall().returns('TOP')
          .onThirdCall().returns(null);

        instance.watchPanChanges({y: 3});
        instance.watchPanChanges({y: 3});

        expect(instance.setState.withArgs({
          currentDropZoneEdge: 'TOP'
        })).to.have.been.calledOnce;
      });
    });

    describe('startDragHandler', () => {
      let dragItem;
      let instance;
      let eventTracker;

      function startDrag() {
        startDragHandler(dragItem);
        instance = tree.getMountedInstance();
      }

      beforeEach(() => {
        eventTracker = sinon.stub();
        React.Animated.event = sinon.stub().returns(eventTracker);
        React.PanResponder.create = sinon.stub();
        dragItem = {
          id: '123',
        };

        dragContext.setBaseLayout({y: 0});

        dragContext.setDragItemLayout(
          'CALENDAR',
          dragItem,
          {
            y: 50
          }
        );

        dragContext.initDropZone('CALENDAR');
      });

      it('saves the dragItem in state', () => {
        startDrag();
        expect(instance.state.dragItem).to.equal(dragItem);
      });

      it('saves the current drop zone', () => {
        startDrag();
        expect(instance.state).to.have.property('currentDropZone', 'CALENDAR');
      });

      it('does not explode if the dragItem changed in between caching the layout and starting the drag', () => {
        // Same ID but different object reference.
        dragItem = {
          id: dragItem.id,
          completed: true,
        };
        expect(startDrag).to.not.throw(TypeError);
      });

      it('sets up the pan responder for dragging', () => {
        startDrag();
        expect(React.PanResponder.create).to.have.been.called;
      });

      describe('PanResponder', () => {
        let handlers;

        beforeEach(() => {
          startDrag();
          handlers = React.PanResponder.create.args[0][0];
        });

        it('responds on start/move', () => {
          expect(handlers.onStartShouldSetPanResponder()).to.be.true;
          expect(handlers.onMoveShouldSetPanResponder()).to.be.true;
        });

        describe('onPanResponderMove', () => {
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
  });
});