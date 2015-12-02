/* @flow weak */

'use strict';

import {expect} from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import sd from 'skin-deep';
import { makeMockComponent } from './makeMockComponent';

import React from './__mocks__/react-native';
import { createDragContext, DragContext } from '../src/DragContext';
const { View } = React;

describe('createDropZone', () => {
  let tree;
  let vdom;
  let createDropZone;
  let BaseComponent;
  let DerivedComponent;
  let dragContext;

  beforeEach(() => {
    ({createDropZone} = proxyquire('../src/DropZone', {
      'react-native': React,
      './DragContext': {
        DragContext,
        '@noCallThru': true,
      }
    }));

    BaseComponent = makeMockComponent(View);
    dragContext = createDragContext(() => {});
    DerivedComponent = createDropZone(BaseComponent, 'fake-drop-zone');
  });

  function subject() {
    tree = sd.shallowRender(
      React.createElement(DerivedComponent),
      {dragContext}
    );
    vdom = tree.getRenderOutput();
  }

  it('renders a View component', () => {
    subject();
    expect(vdom.type).to.equal(View);
  });

  it('initializes the drop zone', () => {
    sinon.stub(dragContext, 'initDropZone');
    subject();
    expect(dragContext.initDropZone).to.have.been.calledWith('fake-drop-zone');
  });

  it('renders the original component', () => {
    subject();
    expect(vdom.props.children.type).to.equal(BaseComponent);
  });

  it('attaches onLayout callback that stores layout offset', () => {
    sinon.stub(dragContext, 'setLayout');
    subject();
    const e = {
      nativeEvent: {
        layout: {
          y: 123,
          x: 0,
          width: 0,
          height: 0,
        }
      }
    };
    vdom.props.onLayout(e);
    expect(dragContext.setLayout).to.have.been.calledWithExactly(
      'fake-drop-zone',
      {
        y: 123,
        x: 0,
        width: 0,
        height: 0,
      }
    );
  });

  it('attaches onScroll callback that stores content offset', () => {
    sinon.stub(dragContext, 'setContentOffset');
    subject();
    const e = {
      nativeEvent: {
        contentOffset: {
          y: 123,
          x: 0,
        }
      }
    };
    vdom.props.children.props.onScroll(e);
    expect(dragContext.setContentOffset).to.have.been.calledWithExactly(
      'fake-drop-zone',
      {
        y: 123,
        x: 0,
      }
    );
  });

  it('attaches onDragItemLayout callback that stores dragItem layout', () => {
    sinon.stub(dragContext, 'setDragItemLayout');
    subject();
    const dragItem = {};
    const e = {
      nativeEvent: {
        layout: {
          y: 123,
          x: 0,
          width: 0,
          height: 0,
        }
      }
    };
    vdom.props.children.props.onDragItemLayout(dragItem, e);
    expect(dragContext.setDragItemLayout).to.have.been.calledWithExactly(
      'fake-drop-zone', dragItem, e.nativeEvent.layout
    );
  });

  it('attaches the drop zone name (used by Autoscrollable)', () => {
    subject();
    expect(vdom.props.children.props.dropZoneName).to.equal('fake-drop-zone');
  });
});