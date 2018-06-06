package org.eclipse.scout.rt.client.ui.tile;

import org.eclipse.scout.rt.client.ui.IStyleable;
import org.eclipse.scout.rt.client.ui.IWidget;
import org.eclipse.scout.rt.client.ui.form.fields.GridData;
import org.eclipse.scout.rt.platform.IOrdered;
import org.eclipse.scout.rt.platform.classid.ITypeWithClassId;
import org.eclipse.scout.rt.shared.data.tile.ITileColorScheme;
import org.eclipse.scout.rt.shared.extension.IExtensibleObject;

/**
 * @since 8.0
 */
public interface ITile extends IWidget, IOrdered, IStyleable, IExtensibleObject, ITypeWithClassId {
  String PROP_ORDER = "order";
  String PROP_COLOR_SCHEME = "colorScheme";
  String PROP_GRID_DATA_HINTS = "gridDataHints";
  String PROP_LOADING = "loading";

  ITileColorScheme getColorScheme();

  void setColorScheme(ITileColorScheme colorScheme);

  /**
   * @return the grid data hints used by the logical grids to create the final grid data
   */
  GridData getGridDataHints();

  void setGridDataHints(GridData data);

  ITileGrid<? extends ITile> getContainer();

  void setContainer(ITileGrid<? extends ITile> container);

  void setFilterAccepted(boolean filterAccepted);

  boolean isFilterAccepted();

  void ensureDataLoaded();

  void loadData();

  void onLoadDataCancel();

  void setLoading(boolean loading);

  boolean isLoading();
}