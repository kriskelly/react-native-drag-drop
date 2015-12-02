/* @flow weak */

'use strict';

import {expect} from 'chai';
import sinon from 'sinon';
import {
  createDragContext,
  EdgeTypes,
  EDGE_THRESHOLD_POINTS,
} from '../src/DragContext';

describe('DragContext', () => {
  let context;
  let onDrop;

  beforeEach(() => {
    onDrop = sinon.stub();
    context = subject(onDrop);
  });

  function subject(onDrop) {
    return createDragContext(onDrop);
  }

  describe('#drop', () => {
    it('calls the callback', () => {
      const props = {};
      const state = {};
      context.drop(props, state);
      expect(onDrop).to.have.been.calledWithExactly(props, state);
    });
  });

  describe('layout offsets', () => {
    beforeEach(() => {
      context.initDropZone('fake');
    });

    it('gets/sets layout offset', () => {
      const layout = {x: 0, y: 123, width: 123, height: 123};
      context.setLayout('fake', layout);
      expect(context.getLayout('fake')).to.equal(layout);
    });
  });

  describe('content offsets', () => {
    beforeEach(() => {
      context.initDropZone('fake');
    });

    it('gets/sets content offset', () => {
      context.setContentOffset('fake', {x: 0, y: 123});
      expect(context.getContentOffset('fake')).to.eql({x: 0, y: 123});
    });
  });

  describe('drag item offset', () => {
    let dragItem;
    let dragItemLayout;
    let layout;

    beforeEach(() => {
      context.initDropZone('fake');
      dragItem = {
        id: '123',
      };
      dragItemLayout = {
        y: 123,
        x: 0,
        width: 0,
        height: 0,
      };
      layout = {
        y: 10,
        x: 0,
        width: 0,
        height: 0,
      };
      context.setLayout('fake', layout);
      context.setContentOffset('fake', {x: 0, y: 20});
      context.setDragItemLayout('fake', dragItem, dragItemLayout);
    });

    it('sets drag item layout', () => {
      expect(context.dragItemLayouts.size).to.equal(1);
    });

    it('gets offset for drag item', () => {
      expect(context.getDragItemYOffset(dragItem))
        .to.equal(10 + 123 - 20);
    });

    it('gets the layout based on the todo ID, not the exact object reference', () => {
      const otherDragItem = {
        id: '123'
      };
      expect(context.getDragItemYOffset(otherDragItem)).to.exist;
    });
  });

  describe('#getDropZoneEdge', () => {
    beforeEach(() => {
      context.initDropZone('fake');
      context.setLayout('fake', {x: 0, y: 100, width: 100, height: 1000});
    });

    describe('when position is within the top edge threshold', () => {
      it('returns the top edge', () => {
        const edge = context.getDropZoneEdge(
          {x: 0, y: 100 + EDGE_THRESHOLD_POINTS},
          'fake'
        );
        expect(edge).to.equal(EdgeTypes.TOP);
      });
    });

    describe('when position is within the bottom edge threshold', () => {
      it('return the bottom edge', () => {
        const edge = context.getDropZoneEdge(
          {x: 0, y: 1100 - EDGE_THRESHOLD_POINTS},
          'fake'
        );
        expect(edge).to.equal(EdgeTypes.BOTTOM);
      });
    });

    describe('otherwise', () => {
      it('returns undefined', () => {
        const edge = context.getDropZoneEdge(
          {x: 0, y: 500},
          'fake'
        );
        expect(edge).not.to.exist;
      });
    });
  });

  describe('#getDropZoneFromYOffset', () => {
    beforeEach(() => {
      context.initDropZone('foo');
      context.initDropZone('bar');
      context.setLayout('foo', {
        y: 0,
        x: 0,
        width: 0,
        height: 5,
      });
      context.setLayout('bar', {
        y: 100,
        x: 0,
        width: 0,
        height: 200,
      });
    });

    it('finds the last drop zone with a y offset < y', () => {
      const dz = context.getDropZoneFromYOffset(150);
      expect(dz).to.exist;
      expect(dz).to.equal('bar');
    });

    describe('when y < minimum layout offset', () => {
      it('finds the drop zone with the lowest layout offset');
    });
  });

  describe('#initDropZone', () => {
    it('adds a drop zone to the map', () => {
      context.initDropZone('foo');
      expect(context.dropZones.size).to.equal(1);
    });
  });
});
