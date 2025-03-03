/*
 * Copyright (c) 2010-2018 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
package org.eclipse.scout.rt.shared.data.tile;

/**
 * @since 5.2
 */
public enum TileColorScheme implements ITileColorScheme {
  DEFAULT(SchemeIds.SCHEME_ID_DEFAULT, false),
  DEFAULT_INVERTED(SchemeIds.SCHEME_ID_DEFAULT, true),
  ALTERNATIVE(SchemeIds.SCHEME_ID_ALTERNATIVE, false),
  ALTERNATIVE_INVERTED(SchemeIds.SCHEME_ID_ALTERNATIVE, true),
  RAINBOW(SchemeIds.SCHEME_ID_RAINBOW, false);

  private final String m_schemeId;
  private final boolean m_inverted;

  TileColorScheme(String schemeId, boolean inverted) {
    m_schemeId = schemeId;
    m_inverted = inverted;
  }

  @Override
  public String getIdentifier() {
    return m_schemeId + (m_inverted ? "-inverted" : "");
  }

  /**
   * Utility method returning the inverted color scheme for this scheme.
   */
  public TileColorScheme invert() {
    switch (this) {
      case DEFAULT:
        return DEFAULT_INVERTED;
      case DEFAULT_INVERTED:
        return DEFAULT;
      case ALTERNATIVE:
        return ALTERNATIVE_INVERTED;
      case ALTERNATIVE_INVERTED:
        return ALTERNATIVE;
      default:
        return this; // unknown scheme cannot be inverted
    }
  }

  /**
   * Utility method returning the "opposite" color scheme for this scheme.
   */
  public TileColorScheme toggle() {
    switch (this) {
      case DEFAULT:
        return ALTERNATIVE;
      case DEFAULT_INVERTED:
        return ALTERNATIVE_INVERTED;
      case ALTERNATIVE:
        return RAINBOW;
      case ALTERNATIVE_INVERTED:
        return RAINBOW;
      case RAINBOW:
        return DEFAULT;
      default:
        return this; // unknown scheme cannot be toggled
    }
  }

  // These constants need to correspond to the IDs defined in Tile.js
  public interface SchemeIds {
    String SCHEME_ID_DEFAULT = "default";
    String SCHEME_ID_ALTERNATIVE = "alternative";
    String SCHEME_ID_RAINBOW = "rainbow";
  }
}
