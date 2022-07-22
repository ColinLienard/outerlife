import { describe, expect, it } from 'vitest';
import { Box } from '../types';
import { QuadTree } from './quadtree';

class Item implements Box {
  x: number;

  y: number;

  width: number;

  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

describe('quadtree', () => {
  const tree = new QuadTree(0, 0, 600, 400) as any;

  it('add an item', () => {
    tree.add(new Item(0, 0, 50, 50));

    expect(tree.items.length).toBe(1);
  });

  it('add an item out of the boundaries', () => {
    tree.add(new Item(600, 0, 50, 50));
    tree.add(new Item(0, 400, 50, 50));

    expect(tree.items.length).toBe(1);
  });

  it('split the tree', () => {
    tree.add(new Item(100, 0, 50, 50));
    tree.add(new Item(100, 300, 50, 50));
    tree.add(new Item(200, 150, 100, 100));
    tree.add(new Item(550, 350, 50, 50));

    expect(tree.items).toBeNull();
    expect(tree.nodes.length).toBe(4);
  });

  it('get items', () => {
    expect(tree.get(0, 0, 100, 100).length).toBe(3);
    expect(tree.get(0, 150, 100, 100).length).toBe(4);
    expect(tree.get(100, 350, 100, 100).length).toBe(2);
    expect(tree.get(400, 100, 10, 200).length).toBe(1);
  });

  it('clear the tree', () => {
    tree.clear();

    expect(tree.items.length).toBe(0);
    expect(tree.nodes).toBeNull();
  });
});