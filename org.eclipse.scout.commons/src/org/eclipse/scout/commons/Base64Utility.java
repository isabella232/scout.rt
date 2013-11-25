/*******************************************************************************
 * Copyright (c) 2010 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
package org.eclipse.scout.commons;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import org.eclipse.scout.commons.logger.IScoutLogger;
import org.eclipse.scout.commons.logger.ScoutLogManager;

public final class Base64Utility {
  private static final IScoutLogger LOG = ScoutLogManager.getLogger(Base64Utility.class);

  private Base64Utility() {
  }

  private static final String ALPHABET =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  /**
   * Base-64 encodes the supplied block of data. Line wrapping is not applied on
   * output.
   * 
   * @param bytes
   *          The block of data that is to be Base-64 encoded.
   * @return A <code>String</code> containing the encoded data.
   */
  public static String encode(byte[] bytes) {
    int length = bytes.length;
    if (length == 0) {
      return "";
    }
    StringBuffer buffer =
        new StringBuffer((int) Math.ceil(length / 3d) * 4);
    int remainder = length % 3;
    length -= remainder;
    int block;
    int i = 0;
    while (i < length) {
      block = ((bytes[i++] & 0xff) << 16) | ((bytes[i++] & 0xff) << 8) |
          (bytes[i++] & 0xff);
      buffer.append(ALPHABET.charAt(block >>> 18));
      buffer.append(ALPHABET.charAt((block >>> 12) & 0x3f));
      buffer.append(ALPHABET.charAt((block >>> 6) & 0x3f));
      buffer.append(ALPHABET.charAt(block & 0x3f));
    }
    if (remainder == 0) {
      return buffer.toString();
    }
    if (remainder == 1) {
      block = (bytes[i] & 0xff) << 4;
      buffer.append(ALPHABET.charAt(block >>> 6));
      buffer.append(ALPHABET.charAt(block & 0x3f));
      buffer.append("==");
      return buffer.toString();
    }
    block = (((bytes[i++] & 0xff) << 8) | ((bytes[i]) & 0xff)) << 2;
    buffer.append(ALPHABET.charAt(block >>> 12));
    buffer.append(ALPHABET.charAt((block >>> 6) & 0x3f));
    buffer.append(ALPHABET.charAt(block & 0x3f));
    buffer.append("=");
    return buffer.toString();
  }

  /**
   * Decodes the supplied Base-64 encoded string.
   * 
   * @param string
   *          The Base-64 encoded string that is to be decoded.
   * @return A <code>byte[]</code> containing the decoded data block.
   */
  public static byte[] decode(String string) {
    int length = string == null ? 0 : string.length();
    if (length == 0) {
      return new byte[0];
    }
    P_Base64InputStream is = new P_Base64InputStream(string);
    ByteArrayOutputStream buffer = new ByteArrayOutputStream();

    int c1, c2, c3, c4;
    try {
      c1 = is.read();
      c2 = is.read();
      c3 = is.read();
      c4 = is.read();
      while (c1 >= 0 || c2 >= 0 || c3 >= 0 || c4 >= 0) {
        int block;
        block = (ALPHABET.indexOf((char) c1) & 0xff) << 18 |
            (ALPHABET.indexOf((char) c2) & 0xff) << 12 |
            (ALPHABET.indexOf((char) c3) & 0xff) << 6 |
            (ALPHABET.indexOf((char) c4) & 0xff);
        buffer.write((byte) (block >>> 16));
        if (c3 != -1) {
          buffer.write((byte) ((block >>> 8) & 0xff));
        }
        if (c4 != -1) {
          buffer.write((byte) (block & 0xff));
        }
        c1 = is.read();
        c2 = is.read();
        c3 = is.read();
        c4 = is.read();
      }
    }
    catch (IOException e) {
      LOG.error("IOException in Base64Utility.decode()", e);
      return new byte[0];
    }
    return buffer.toByteArray();
  }

  private static class P_Base64InputStream extends InputStream {
    private final String m_buffer;
    private final int m_count;
    private int m_pos = 0;

    public P_Base64InputStream(String base64String) {
      m_buffer = base64String;
      m_count = base64String.length();
    }

    @Override
    public int read() throws IOException {
      while (m_pos < m_count) {
        char ch = m_buffer.charAt(m_pos++);
        if ((ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch == '+') || (ch == '/')) {
          return (ch & 0xFF);
        }
      }
      return -1;
    }
  }
}
