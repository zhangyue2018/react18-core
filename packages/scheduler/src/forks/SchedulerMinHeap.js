
export function push(heap, node) {
    const index = heap.length;
    heap.push(node);
    siftUp(heap, node, index);
}

function siftUp(heap, node, i) {
    let index = i;
    while(index > 0) {
        const parentIndex = index - 1 >>> 1;
        const parent = heap[parentIndex];
        if(compare(parent, node) > 0) {
            heap[parentIndex] = node;
            heap[index] = parent;
            index = parentIndex;
        }
    }
}

export function peek(heap) {
    return heap.length === 0 ? null : heap[0];
}

export function pop(heap) {
    if(heap.length === 0) return null;
    const first = heap[0];
    const last = heap.pop();
    if(last !== first) {
        heap[0] = last;
        siftDown(heap, last, 0);
    }

    return first;
}

function siftDown(heap, node, i) {
    let index = i;
    const length = heap.length;
    const halfLength = length >>> 1;
    // 如果index >= halfLength，说明肯定是叶子节点了(leftChildIndex = 2*parentIndex + 1)
    while(index < halfLength) {
        const leftIndex = 2 * index + 1;
        const left = heap[leftIndex];
        const rightIndex = leftIndex + 1;
        const right = heap[rightIndex];
        if(compare(left, node) < 0) {
            // 右子节点存在并且右子节点小于左子节点
            if(rightIndex < length && compare(right, left) < 0) {
                heap[index] = right;
                heap[rightIndex] = node;
                index = rightIndex;
            } else {
                heap[index] = left;
                heap[leftIndex] = node;
                index = leftIndex;
            }
        } else if(rightIndex < length && compare(right, node) < 0) {
            heap[index] = right;
            heap[rightIndex] = node;
            index = rightIndex;
        } else {
            return;
        }
    }
}

function compare(a, b) {
    const diff = a.sortIndex - b.sortIndex;
    return diff !== 0 ? diff : a.id - b.id;
}