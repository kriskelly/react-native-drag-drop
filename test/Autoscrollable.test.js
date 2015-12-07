/* @flow weak */

'use strict';

import {expect} from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import sd from 'skin-deep';
import { makeMockComponent } from './makeMockComponent';

import React from './__mocks__/react-native';
import { DragContext } from '../src/DragContext';
const { View } = React;

describe('createAutoscrollable', () => {
  beforeEach(() => {
    global.__DEV__ = false;
  });

  let tree;
  let vdom;
  let instance;

  let createAutoscrollable;
  let AutoscrollableComponent;
  let BaseComponent;

  let currentDropZone;
  let dropZoneName;
  let currentDropZoneEdge;
  let scrollEnabled;

  let dragContext;
  let scrollable;

  beforeEach(() => {
    currentDropZone = null;
    dropZoneName = 'foobar';
    currentDropZoneEdge = null;
    scrollEnabled = false;

    ({createAutoscrollable} = proxyquire('../src/Autoscrollable', {
      'react-native': React,
      './DragContext': {
        DragContext,
      }
    }));

    scrollable = {
      scrollTo: sinon.stub()
    };

    dragContext = new DragContext(() => {});
    dragContext.initDropZone('foobar');

    BaseComponent = makeMockComponent(View);

    AutoscrollableComponent = createAutoscrollable(BaseComponent);
  });

  function subject() {
    tree = sd.shallowRender(
      React.createElement(AutoscrollableComponent, {
        currentDropZone,
        dropZoneName,
        currentDropZoneEdge,
        scrollEnabled,
      }), {dragContext});
    vdom = tree.getRenderOutput();
    instance = tree.getMountedInstance();
  }

  it('renders original component', () => {
    subject();
    expect(vdom.type).to.equal(BaseComponent);
  });

  it('assigns a ref for the scrollable base component', () => {
    subject();
    vdom.ref('foo');
    expect(instance.scrollableRef).to.equal('foo');
  });

  describe('lifecycle', () => {
    beforeEach(() => {
      subject();
      sinon.stub(instance, 'stopAutoscroll');
      sinon.stub(instance, 'startAutoscroll');
      vdom.ref(scrollable);
    });

    describe('componentWillReceiveProps', () => {
      describe('when the drop zone is not the current one', () => {
        beforeEach(() => {
          instance.componentWillReceiveProps({
            currentDropZone: 'foo',
            currentDropZoneEdge: null,
            dropZoneName: 'bar'
          });
        });
        it('stops autoscrolling', () => {
          expect(instance.stopAutoscroll).to.have.been.called;
        });
      });

      describe('when the drop zone is the current one', () => {
        let props;

        beforeEach(() => {
          props = {
            currentDropZone: 'foo',
            dropZoneName: 'foo',
          };
        });

        describe('and the drop zone edge has changed', () => {
          describe('to null (no longer dropping on an edge)', () => {
            beforeEach(() => {
              currentDropZoneEdge = 'BOTTOM';
              subject();
              vdom.ref(scrollable);
              sinon.stub(instance, 'stopAutoscroll');
              props.currentDropZoneEdge = null;
              instance.componentWillReceiveProps(props);
            });
            it('stops autoscrolling', () => {
              expect(instance.stopAutoscroll).to.have.been.called;
            });
          });

          describe('to a non-null drop zone', () => {
            beforeEach(() => {
              props.currentDropZoneEdge = 'TOP';
              instance.componentWillReceiveProps(props);
            });
            it('starts autoscrolling', () => {
              expect(instance.startAutoscroll).to.have.been.calledWithExactly('TOP');
            });
          });

          describe('to a different drop zone', () => {
            beforeEach(() => {
              currentDropZoneEdge = 'BOTTOM';
              subject();
              vdom.ref(scrollable);
              sinon.stub(instance, 'stopAutoscroll');
              sinon.stub(instance, 'startAutoscroll');
              props.currentDropZoneEdge = 'TOP';
              instance.componentWillReceiveProps(props);
            });
            it('starts autoscrolling', () => {
              expect(instance.startAutoscroll).to.have.been.calledWithExactly('TOP');
            });
          });
        });

        describe('and the drop zone edge is the same as before', () => {
          beforeEach(() => {
            currentDropZoneEdge = 'BOTTOM';
            subject();
            vdom.ref(scrollable);
            instance = tree.getMountedInstance();
            sinon.stub(instance, 'stopAutoscroll');
            sinon.stub(instance, 'startAutoscroll');
            props.currentDropZoneEdge = 'BOTTOM';
            instance.componentWillReceiveProps(props);
          });
          it('does nothing', () => {
            expect(instance.stopAutoscroll).not.to.have.been.called;
            expect(instance.startAutoscroll).not.to.have.been.called;
          });
        });
      });
    });

    describe('componentWillUnmount', () => {
      it('stops autoscrolling', () => {
        instance.componentWillUnmount();
        expect(instance.stopAutoscroll).to.have.been.called;
      });
    });
  });

  describe('autoscrolling', () => {
    let clock;

    let instance;
    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    beforeEach(() => {
      subject();
      instance = tree.getMountedInstance();
      vdom.ref(scrollable);
    });

    describe('startAutoscroll', () => {
      const contentWidth = 100;
      const  contentHeight = 500;
      beforeEach(() => {
        dragContext.setContentOffset('foobar', {x: 50, y: 100});
        dragContext.setLayout('foobar', {
          x: 0,
          y: 0,
          height: contentHeight,
          width: contentWidth,
        });
      });

      function scrollOnce(direction) {
        instance.startAutoscroll(direction);
        clock.tick(400);
      }

      function itStopsScrolling(direction, contentOffset) {
        describe('scrolling past the ' + direction + ' bound', () => {
          beforeEach(() => {
            dragContext.setContentOffset('foobar', contentOffset);
            sinon.stub(instance, 'stopAutoscroll');
            clock.tick(400);
          });

          it('stops the autoscrolling', () => {
            expect(instance.stopAutoscroll).to.have.been.called;
          });
        });
      }

      it('creates an interval', () => {
        instance.startAutoscroll('BOTTOM');
        expect(instance.autoscrollInterval).to.be.ok;
      });

      describe('when the interval runs', () => {
        describe('scrolling down', () => {
          beforeEach(() => {
            scrollOnce('BOTTOM');
          });

          it('scrolls down a little bit', () => {
            expect(scrollable.scrollTo).to.have.been.calledWith(
              100 + 20
            );
          });

          itStopsScrolling('BOTTOM', {x: 0, y: contentHeight});
        });

        describe('scrolling up', () => {
          beforeEach(() => {
            scrollOnce('TOP');
          });

          it('scrolls up a little bit', () => {
            expect(scrollable.scrollTo).to.have.been.calledWith(
              100 - 20
            );
          });

          itStopsScrolling('TOP', {x: 0, y: 0});
        });

        describe('scrolling left', () => {
          beforeEach(() => {
            scrollOnce('LEFT');
          });

          it('scrolls left a bit', () => {
            expect(scrollable.scrollTo).to.have.been.calledWithExactly(
              100, 50 - 20
            );
          });

          itStopsScrolling('LEFT', {x: 0, y: contentHeight / 2});
        });

        describe('scrolling right', () => {
          beforeEach(() => {
            scrollOnce('RIGHT');
          });

          it('scrolls right', () => {
            expect(scrollable.scrollTo).to.have.been.calledWithExactly(
              100, 50 + 20
            );
          });

          itStopsScrolling('RIGHT', {x: contentWidth, y: contentHeight / 2});
        });
      });
    });

    describe('stopAutoscroll', () => {
      beforeEach(() => {
        subject();
        instance.startAutoscroll('TOP');
        instance.stopAutoscroll();
      });

      it('clears the interval created by startAutoscroll()', () => {
        clock.tick(400);
        expect(scrollable.scrollTo).not.to.have.been.called;
        expect(instance.autoscrollInterval).not.to.be.ok;
      });
    });
  });
});