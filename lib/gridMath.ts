export type WidgetType =
  | "number"
  | "sparkline"
  | "bar"
  | "line"
  | "scatter"
  | "barList"
  | "table"
  | "text";

export type DeviceMode = "desktop" | "tablet" | "mobile";

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  gridPosition: { col: number; row: number };
  gridSpan: { cols: number; rows: number };
  desktopSpan?: { cols: number; rows: number };
  config: {
    title?: string;
    dataKey?: string;
    comparisonLabel?: string;
    [key: string]: unknown;
  };
}

export const TOTAL_COLUMNS = 12;

export const DEVICE_COLUMNS: Record<DeviceMode, number> = {
  desktop: 12,
  tablet: 6,
  mobile: 1,
};

export function getColumnsForDevice(mode: DeviceMode | string): number {
  if (mode === "tablet") return 6;
  if (mode === "mobile") return 1;
  return 12;
}

/**
 * Checks whether two rectangular grid bounding boxes overlap.
 */
export function doesOverlap(
  posA: { col: number; row: number },
  spanA: { cols: number; rows: number },
  posB: { col: number; row: number },
  spanB: { cols: number; rows: number }
): boolean {
  return (
    posA.col < posB.col + spanB.cols &&
    posA.col + spanA.cols > posB.col &&
    posA.row < posB.row + spanB.rows &&
    posA.row + spanA.rows > posB.row
  );
}

/**
 * Checks if a specific cell position and span fits in bounds and doesn't overlap existing widgets.
 */
export function isCellAvailable(
  widgets: WidgetInstance[],
  pos: { col: number; row: number },
  span: { cols: number; rows: number },
  excludeId?: string,
  totalCols: number = TOTAL_COLUMNS
): boolean {
  if (pos.col < 1 || pos.col + span.cols - 1 > totalCols || pos.row < 1) {
    return false;
  }
  return !widgets.some(
    (w) => w.id !== excludeId && doesOverlap(pos, span, w.gridPosition, w.gridSpan)
  );
}

/**
 * Computes the nearest free grid cell for a given widget span, prioritizing proximity
 * to a preferred starting position.
 */
export function findNearestFreeCell(
  widgets: WidgetInstance[],
  span: { cols: number; rows: number },
  preferred: { col: number; row: number } = { col: 1, row: 1 },
  excludeId?: string,
  totalCols: number = TOTAL_COLUMNS
): { col: number; row: number } {
  const maxSearchRows =
    Math.max(12, ...widgets.map((w) => w.gridPosition.row + w.gridSpan.rows)) + 3;

  let bestCell: { col: number; row: number } | null = null;
  let minDistance = Infinity;

  for (let r = 1; r <= maxSearchRows; r++) {
    for (let c = 1; c <= totalCols - span.cols + 1; c++) {
      const candidate = { col: c, row: r };
      if (isCellAvailable(widgets, candidate, span, excludeId, totalCols)) {
        // Manhattan distance weighted towards row order
        const dCol = Math.abs(c - preferred.col);
        const dRow = Math.abs(r - preferred.row) * 1.5;
        const dist = dCol + dRow;

        if (dist < minDistance) {
          minDistance = dist;
          bestCell = candidate;
          if (dist === 0) return bestCell;
        }
      }
    }
  }

  if (bestCell) return bestCell;

  // Fallback to appending on a new row below all existing widgets
  const nextRow = widgets.reduce(
    (acc, w) => Math.max(acc, w.gridPosition.row + w.gridSpan.rows),
    1
  );
  return { col: 1, row: nextRow };
}

/**
 * Calculates grid col & row from pixel coordinates relative to the canvas bounding rect.
 */
export function calculateGridPositionFromPixels(
  x: number,
  y: number,
  containerRect: { left: number; top: number; width: number; height: number },
  totalCols: number = TOTAL_COLUMNS,
  approxRowHeight: number = 88
): { col: number; row: number } {
  const relX = Math.max(0, x - containerRect.left);
  const relY = Math.max(0, y - containerRect.top);
  const colWidth = containerRect.width / totalCols;

  const col = Math.min(totalCols, Math.max(1, Math.floor(relX / colWidth) + 1));
  const row = Math.max(1, Math.floor(relY / approxRowHeight) + 1);

  return { col, row };
}

export interface GridSpanLimits {
  minCols?: number;
  maxCols?: number;
  minRows?: number;
  maxRows?: number;
}

export const DEFAULT_GRID_SPAN_LIMITS: GridSpanLimits = {
  minCols: 2,
  maxCols: TOTAL_COLUMNS,
  minRows: 2,
  maxRows: 8,
};

/**
 * Converts a pixel delta (dx, dy) into a new { cols, rows } grid span.
 * Respects min span (default 2 cols × 2 rows), max columns (12 cols max),
 * and optionally clamps to remaining available columns based on startCol.
 */
export function calculateGridSpanFromPixelDelta(
  initialSpan: { cols: number; rows: number },
  pixelDelta: { dx: number; dy: number },
  colWidth: number,
  rowHeight: number = 100,
  limits: GridSpanLimits = DEFAULT_GRID_SPAN_LIMITS,
  startCol?: number,
  totalCols: number = TOTAL_COLUMNS
): { cols: number; rows: number } {
  const minCols = Math.max(1, limits.minCols ?? 1);
  const maxAvailableCols = startCol ? Math.max(1, totalCols - startCol + 1) : totalCols;
  const maxCols = Math.min(limits.maxCols ?? totalCols, maxAvailableCols);

  const minRows = Math.max(1, limits.minRows ?? 2);
  const maxRows = Math.max(minRows, limits.maxRows ?? 8);

  const safeColWidth = Math.max(20, colWidth);
  const safeRowHeight = Math.max(20, rowHeight);

  const deltaCols = Math.round(pixelDelta.dx / safeColWidth);
  const deltaRows = Math.round(pixelDelta.dy / safeRowHeight);

  const targetCols = initialSpan.cols + deltaCols;
  const targetRows = initialSpan.rows + deltaRows;

  const clampedCols = Math.max(Math.min(minCols, maxCols), Math.min(maxCols, targetCols));
  const clampedRows = Math.max(minRows, Math.min(maxRows, targetRows));

  return { cols: clampedCols, rows: clampedRows };
}

/**
 * Computes estimated column width and row height from a container element or fallback.
 */
export function getGridCellDimensions(
  containerRect?: { width: number; height: number } | null,
  totalCols: number = TOTAL_COLUMNS,
  fallbackRowHeight: number = 100,
  containerPaddingX: number = 16
): { colWidth: number; rowHeight: number } {
  if (!containerRect || containerRect.width <= 0) {
    return { colWidth: 100, rowHeight: fallbackRowHeight };
  }
  const availableWidth = Math.max(100, containerRect.width - containerPaddingX);
  const colWidth = availableWidth / totalCols;
  return { colWidth, rowHeight: fallbackRowHeight };
}

/**
 * Parses grid cell ID format "cell-{col}-{row}" into { col, row }
 */
export function parseGridCellId(id: string): { col: number; row: number } | null {
  const match = id.match(/^cell-(\d+)-(\d+)$/);
  if (!match) return null;
  return {
    col: parseInt(match[1], 10),
    row: parseInt(match[2], 10),
  };
}

/**
 * Swaps two existing widgets' positions directly.
 */
export function swapWidgetPositions(
  widgets: WidgetInstance[],
  activeId: string,
  overId: string,
  totalCols: number = TOTAL_COLUMNS
): WidgetInstance[] {
  const activeWidget = widgets.find((w) => w.id === activeId);
  const overWidget = widgets.find((w) => w.id === overId);
  if (!activeWidget || !overWidget || activeId === overId) return widgets;

  const activePos = { ...activeWidget.gridPosition };
  const overPos = { ...overWidget.gridPosition };

  return widgets.map((w) => {
    if (w.id === activeId) {
      return {
        ...w,
        gridPosition: {
          col: Math.max(1, Math.min(totalCols - w.gridSpan.cols + 1, overPos.col)),
          row: overPos.row,
        },
      };
    }
    if (w.id === overId) {
      return {
        ...w,
        gridPosition: {
          col: Math.max(1, Math.min(totalCols - w.gridSpan.cols + 1, activePos.col)),
          row: activePos.row,
        },
      };
    }
    return w;
  });
}

/**
 * Collision rule for this MVP:
 * If a widget is dropped onto an occupied cell, swap the two widgets' positions
 * rather than pushing/reflowing others. Keep this rule isolated in one function
 * (lib/gridMath.ts) so it's easy to change later.
 */
export function handleCollisionRule(
  widgets: WidgetInstance[],
  droppedWidget: WidgetInstance,
  targetPosition: { col: number; row: number },
  totalCols: number = TOTAL_COLUMNS
): WidgetInstance[] {
  // Ensure target column keeps widget within grid boundary
  const clampedCol = Math.max(
    1,
    Math.min(totalCols - droppedWidget.gridSpan.cols + 1, targetPosition.col)
  );
  const clampedRow = Math.max(1, targetPosition.row);
  const clampedPos = { col: clampedCol, row: clampedRow };

  // Check if any existing widget collides with this placement
  const collidingWidget = widgets.find(
    (w) =>
      w.id !== droppedWidget.id &&
      doesOverlap(clampedPos, droppedWidget.gridSpan, w.gridPosition, w.gridSpan)
  );

  const isExistingWidget = widgets.some((w) => w.id === droppedWidget.id);

  if (collidingWidget) {
    if (isExistingWidget) {
      // SWAP: Existing active widget drops onto an occupied widget -> swap their positions
      const existingActive = widgets.find((w) => w.id === droppedWidget.id)!;
      const originalPos = { ...existingActive.gridPosition };
      const targetPos = { ...collidingWidget.gridPosition };

      return widgets.map((w) => {
        if (w.id === droppedWidget.id) {
          return {
            ...w,
            gridPosition: {
              col: Math.max(1, Math.min(totalCols - w.gridSpan.cols + 1, targetPos.col)),
              row: targetPos.row,
            },
          };
        }
        if (w.id === collidingWidget.id) {
          return {
            ...w,
            gridPosition: {
              col: Math.max(1, Math.min(totalCols - w.gridSpan.cols + 1, originalPos.col)),
              row: originalPos.row,
            },
          };
        }
        return w;
      });
    } else {
      // SWAP with newly added widget from palette:
      // The new widget takes the colliding widget's position.
      // The colliding widget moves to the nearest free cell.
      const targetPos = { ...collidingWidget.gridPosition };
      const tempWithoutColliding = widgets.filter((w) => w.id !== collidingWidget.id);

      const placedNewWidget: WidgetInstance = {
        ...droppedWidget,
        gridPosition: {
          col: Math.max(1, Math.min(totalCols - droppedWidget.gridSpan.cols + 1, targetPos.col)),
          row: targetPos.row,
        },
      };

      const nearestFreeForColliding = findNearestFreeCell(
        [...tempWithoutColliding, placedNewWidget],
        collidingWidget.gridSpan,
        targetPos,
        collidingWidget.id,
        totalCols
      );

      const updatedColliding: WidgetInstance = {
        ...collidingWidget,
        gridPosition: nearestFreeForColliding,
      };

      return [...tempWithoutColliding, placedNewWidget, updatedColliding];
    }
  }

  // No collision: clean placement
  if (isExistingWidget) {
    return widgets.map((w) =>
      w.id === droppedWidget.id ? { ...w, gridPosition: clampedPos } : w
    );
  } else {
    return [...widgets, { ...droppedWidget, gridPosition: clampedPos }];
  }
}

/**
 * Finds the earliest available cell for a widget span in a given column count,
 * scanning row-by-row, column-by-column.
 */
export function findFirstAvailableCell(
  widgets: WidgetInstance[],
  span: { cols: number; rows: number },
  totalCols: number
): { col: number; row: number } {
  const maxRow =
    widgets.reduce(
      (max, w) => Math.max(max, w.gridPosition.row + w.gridSpan.rows),
      1
    ) + 12;

  for (let r = 1; r <= maxRow; r++) {
    for (let c = 1; c <= totalCols - span.cols + 1; c++) {
      const candidate = { col: c, row: r };
      if (isCellAvailable(widgets, candidate, span, undefined, totalCols)) {
        return candidate;
      }
    }
  }

  const nextRow = widgets.reduce(
    (acc, w) => Math.max(acc, w.gridPosition.row + w.gridSpan.rows),
    1
  );
  return { col: 1, row: nextRow };
}

/**
 * Recomputes widget column spans proportionally and reflows positions
 * when toggling between device modes (e.g. 12 columns desktop <-> 6 columns tablet).
 */
export function reflowWidgetsForColumns(
  widgets: WidgetInstance[],
  targetCols: number,
  sourceCols: number = 12
): WidgetInstance[] {
  // Sort widgets in reading order (row asc, then col asc)
  const sorted = [...widgets].sort(
    (a, b) =>
      a.gridPosition.row - b.gridPosition.row ||
      a.gridPosition.col - b.gridPosition.col
  );

  const placed: WidgetInstance[] = [];

  for (const widget of sorted) {
    let newCols: number;

    // If restoring back to 12 desktop columns and desktopSpan is preserved, restore exact span
    if (targetCols === 12 && widget.desktopSpan?.cols) {
      newCols = widget.desktopSpan.cols;
    } else {
      const ratio = targetCols / sourceCols;
      newCols = Math.max(
        1,
        Math.min(targetCols, Math.round(widget.gridSpan.cols * ratio))
      );
    }

    const newRows =
      targetCols === 12 && widget.desktopSpan?.rows
        ? widget.desktopSpan.rows
        : widget.gridSpan.rows;

    const targetSpan = { cols: newCols, rows: newRows };
    const targetPos = findFirstAvailableCell(placed, targetSpan, targetCols);

    placed.push({
      ...widget,
      desktopSpan:
        sourceCols === 12
          ? widget.desktopSpan || { ...widget.gridSpan }
          : widget.desktopSpan,
      gridSpan: targetSpan,
      gridPosition: targetPos,
    });
  }

  return placed;
}


