/* @flow */

'use strict';

import invariant from 'invariant';

import type {
  ContentOffset,
  DragItemLayout,
  DropZone,
  DropZoneEdge,
  DropZoneName,
  Layout,
  Position,
} from './types';

export type DragItem = {
  id: string,
};

export const EdgeTypes = {
  TOP: 'TOP',
  BOTTOM: 'BOTTOM',
};


type OnDrop = (props: Object, state: Object) => Promise;

export const EDGE_THRESHOLD_POINTS = 10;

export class DragContext {
  baseLayout: Layout;
  dragItemLayouts: Map<string, DragItemLayout>;
  dropZones: Map<DropZoneName, DropZone>;
  onDrop: (props: Object, state: Object, context: DragContext) => Promise;

  constructor(onDrop: OnDrop) {
    this.onDrop = onDrop;
    this.dropZones = new Map();
    this.dragItemLayouts = new Map();
  }

  /**
   * Determine whether the given position represents an edge
   * on the drop zone. If not, return undefine
   * @param  Position pos:      Position      x/y coordinates
   * @param  DropZone dropZone: DropZone
   * @return DropZoneEdge
   */
  getDropZoneEdge(pos: Position, dropZoneName: DropZoneName): DropZoneEdge {
    const layout = this.getLayout(dropZoneName);
    const topThreshold = layout.y + EDGE_THRESHOLD_POINTS;
    const bottomThreshold = layout.y + layout.height - EDGE_THRESHOLD_POINTS;
    if (pos.y <= topThreshold) {
      return EdgeTypes.TOP;
    } else if (pos.y >= bottomThreshold) {
      return EdgeTypes.BOTTOM;
    }
  }

  drop(props: Object, state: Object): Promise {
    return this.onDrop.apply(this, [props, state]);
  }

  getContentOffset(dropZoneName: DropZoneName): ContentOffset {
    const dz = this.dropZones.get(dropZoneName);
    invariant(dz && dz.contentOffset, 'Drop zone not cached yet!');
    return dz.contentOffset;
  }

  getDragItemLayout(dragItem: DragItem): DragItemLayout {
    return this.dragItemLayouts.get(dragItem.id);
  }

  getLayout(dropZoneName: DropZoneName): Layout {
    const dz = this.dropZones.get(dropZoneName);
    invariant(dz && dz.layout, 'Drop zone not cached yet!');
    return dz.layout;
  }

  /**
   * Find the position in absolute terms for a given dragItem.
   *
   * This is used instead of gestureState.x0/y0 when setting the pan
   * offset, because those refer to the origin of the tap gesture.
   *
   * In order to prevent the drag shadow from jumping noticeably,
   * the pan offset needs to be set to the original absolute position
   * of the dragItem on the screen.
   *
   * @type TodoRecord
   */
  getDragItemOffset(dragItem: DragItem, direction: string): number {
    invariant(dragItem, 'Drag item not set!');
    invariant(direction === 'y' || direction === 'x', 'Invalid direction (must be x or y)');
    const dragItemLayout = this.getDragItemLayout(dragItem);
    const layout = dragItemLayout.layout;
    const dropZoneName = dragItemLayout.dropZoneName;
    invariant(layout, 'Must have an original layout!');
    const dropZone = this.dropZones.get(dropZoneName);
    invariant(dropZone, 'Must have a valid drop zone!');
    const offset = dropZone.layout[direction] + layout[direction] - dropZone.contentOffset[direction];
    return offset;
  }

  getDropZoneFromYOffset(y: number): ?DropZoneName {
    // Naive implementation.
    // This assumes that the drop zones are ever only
    // stacked vertically and non-overlapping.

    for (let dropZone of this.dropZones.values()) {
      const top = dropZone.layout.y;
      const bottom = top + dropZone.layout.height;
      if (y >= top && y <= bottom) {
        return dropZone.name;
      }
    }

    return null;
  }

  initDropZone(dropZoneName: DropZoneName) {
    this.dropZones.set(
      dropZoneName,
      {
        name: dropZoneName,
        layout: {x: 0, y: 0, width: 0, height: 0},
        contentOffset: {x: 0, y: 0},
      }
    );
  }

  getBaseLayout(): Layout {
    invariant(this.baseLayout, 'Base layout must be set before accessing.');
    return this.baseLayout;
  }

  setBaseLayout(layout: Layout) {
    this.baseLayout = layout;
  }

  setLayout(dropZoneName: DropZoneName, layout: Layout) {
    invariant(
      this.dropZones.has(dropZoneName),
      'Drop zone must be initialized before calling setLayout()!');

    this.dropZones.get(dropZoneName).layout = layout;
  }

  setContentOffset(dropZoneName: DropZoneName, contentOffset: ContentOffset) {
    invariant(
      this.dropZones.has(dropZoneName),
      'Drop zone must be initialized before calling setContentOffset()!');

    this.dropZones.get(dropZoneName).contentOffset = contentOffset;
  }

  setDragItemLayout(dropZoneName: DropZoneName, dragItem: DragItem, layout: Layout) {
    invariant(dragItem, 'Drag item not set!');
    invariant(layout, 'Layout not set!');
    invariant(dropZoneName, 'Drop zone name not set!');
    this.dragItemLayouts.set(
      dragItem.id,
      {
        layout,
        dropZoneName,
      }
    );
  }
}

export function createDragContext(onDrop: OnDrop): DragContext {
  return new DragContext(onDrop);
}