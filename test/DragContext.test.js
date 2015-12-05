/* @flow weak */

'use strict';

import {expect} from 'chai';
import sinon from 'sinon';
import {
  createDragContext,
  EdgeTypes,
} from '../src/DragContext';

describe('DragContext', () => {
  let context;
  let edgeThreshold;
  let onDrop;

  beforeEach(() => {
    edgeThreshold = 15;
    onDrop = sinon.stub();
    context = createDragContext(onDrop, edgeThreshold);
  });

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
        x: 20,
        width: 0,
        height: 0,
      };
      layout = {
        y: 10,
        x: 50,
        width: 0,
        height: 0,
      };
      context.setLayout('fake', layout);
      context.setContentOffset('fake', {x: 10, y: 20});
      context.setDragItemLayout('fake', dragItem, dragItemLayout);
    });

    it('sets drag item layout', () => {
      expect(context.dragItemLayouts.size).to.equal(1);
    });

    it('gets y offset for drag item', () => {
      expect(context.getDragItemOffset(dragItem, 'y'))
        .to.equal(10 + 123 - 20);
    });

    it('gets x offset for drag item', () => {
      expect(context.getDragItemOffset(dragItem, 'x'))
        .to.equal(20 + 50 - 10);
    });

    it('gets the layout based on the todo ID, not the exact object reference', () => {
      const otherDragItem = {
        id: '123'
      };
      expect(context.getDragItemOffset(otherDragItem, 'y')).to.exist;
    });
  });

  describe('#getDropZoneEdge', () => {
    let dropZone;

    beforeEach(() => {
      context.initDropZone('fake');
      dropZone = context.dropZones.get('fake');

      context.setLayout('fake', {
        x: 0,
        y: 100,
        width: 100,
        height: 1000
      });
    });

    describe('when position is within the top edge threshold', () => {
      it('returns the top edge', () => {
        const edge = context.getDropZoneEdge(
          {x: 0, y: 100 + edgeThreshold},
          dropZone
        );
        expect(edge).to.equal(EdgeTypes.TOP);
      });
    });

    describe('when position is within the bottom edge threshold', () => {
      it('returns the bottom edge', () => {
        const edge = context.getDropZoneEdge(
          {x: 0, y: 1100 - edgeThreshold},
          dropZone
        );
        expect(edge).to.equal(EdgeTypes.BOTTOM);
      });
    });

    describe('when position is within left edge', () => {
      it('returns the left edge', () => {
        const edge = context.getDropZoneEdge(
          {x: 5, y: 200},
          dropZone
        );
        expect(edge).to.equal(EdgeTypes.LEFT);
      });
    });

    describe('when position is within right edge', () => {
      it('returns the right edge', () => {
        const edge = context.getDropZoneEdge(
          {x: 95, y: 200},
          dropZone
        );
        expect(edge).to.equal(EdgeTypes.RIGHT);
      });
    });

    describe('when the position is outside the drop zone entirely', () => {
      it('returns undefined', () => {
        const edge = context.getDropZoneEdge(
          {x: 0, y: 1200},
          dropZone
        );
        expect(edge).not.to.exist;
      });
    });

    describe('when position is not near an edge', () => {
      it('returns undefined', () => {
        const edge = context.getDropZoneEdge(
          {x: 50, y: 500},
          dropZone
        );
        expect(edge).not.to.exist;
      });
    });
  });

  describe('#getDropZone', () => {
    beforeEach(() => {
      context.initDropZone('foo');
      context.initDropZone('bar');
      context.setLayout('foo', {
        y: 0,
        x: 0,
        width: 10,
        height: 5,
      });
      context.setLayout('bar', {
        y: 100,
        x: 10,
        width: 20,
        height: 200,
      });
    });

    it('finds the drop zone at the correct x/y position', () => {
      const dz = context.getDropZone({
        x: 15,
        y: 150
      });
      expect(dz).to.exist;
      expect(dz).to.equal(context.dropZones.get('bar'));
    });

    it('returns null when there is no corresponding drop zone', () => {
      const dz = context.getDropZone({x: 15, y: 500});
      expect(dz).to.be.null;
    })
  });

  describe('#initDropZone', () => {
    it('adds a drop zone to the map', () => {
      context.initDropZone('foo');
      expect(context.dropZones.size).to.equal(1);
    });
  });
});
