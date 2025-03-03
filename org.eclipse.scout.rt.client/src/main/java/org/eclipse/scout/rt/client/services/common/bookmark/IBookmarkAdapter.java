/*
 * Copyright (c) 2010-2015 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
package org.eclipse.scout.rt.client.services.common.bookmark;

import org.eclipse.scout.rt.client.services.common.bookmark.internal.BookmarkUtility;
import org.eclipse.scout.rt.client.ui.desktop.outline.pages.IPage;
import org.eclipse.scout.rt.shared.services.common.bookmark.Bookmark;

/**
 * Adapter for {@link IPage}. The {@link BookmarkUtility} asks the {@link IPage} for this type of adapter when creating
 * a {@link Bookmark}.
 */
public interface IBookmarkAdapter {

  String getIdentifier();

  String getTitle();

  String getText();

  String getIconId();

  String getOutlineClassName();

  String getOutlineTitle();

}
