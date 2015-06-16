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
package org.eclipse.scout.rt.ui.html.json;

import java.text.DateFormat;
import java.text.DateFormatSymbols;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Locale;

import org.eclipse.scout.commons.logger.IScoutLogger;
import org.eclipse.scout.commons.logger.ScoutLogManager;
import org.json.JSONArray;
import org.json.JSONObject;

public class JsonLocale implements IJsonObject {
  private static final IScoutLogger LOG = ScoutLogManager.getLogger(JsonLocale.class);

  private final Locale m_locale;

  public JsonLocale(Locale locale) {
    m_locale = locale;
  }

  public Locale getLocale() {
    return m_locale;
  }

  @Override
  public JSONObject toJson() {
    return localeToJson(m_locale);
  }

  protected JSONObject decimalFormatSymbolsToJson(DecimalFormatSymbols symbols) {
    JSONObject json = JsonObjectUtility.newOrderedJSONObject();
    json.put("decimalSeparator", String.valueOf(symbols.getDecimalSeparator()));
    json.put("groupingSeparator", String.valueOf(symbols.getGroupingSeparator()));
    json.put("minusSign", String.valueOf(symbols.getMinusSign()));
    return json;
  }

  protected JSONObject dateFormatSymbolsToJson(DateFormatSymbols symbols) {
    JSONObject json = JsonObjectUtility.newOrderedJSONObject();
    json.put("months", new JSONArray(symbols.getMonths()));
    json.put("monthsShort", new JSONArray(symbols.getShortMonths()));
    json.put("weekdays", new JSONArray(Arrays.copyOfRange(symbols.getWeekdays(), 1, 8)));
    json.put("weekdaysShort", new JSONArray(Arrays.copyOfRange(symbols.getShortWeekdays(), 1, 8)));
    json.put("am", symbols.getAmPmStrings()[Calendar.AM]);
    json.put("pm", symbols.getAmPmStrings()[Calendar.PM]);
    return json;
  }

  protected JSONObject localeToJson(Locale locale) {
    JSONObject json = JsonObjectUtility.newOrderedJSONObject();
    DecimalFormat defaultDecimalFormat = getDefaultDecimalFormat(locale);
    SimpleDateFormat defaultDateFormat = getDefaultSimpleDateFormat(locale);
    json.put("languageTag", locale.toLanguageTag());
    json.put("decimalFormatPatternDefault", defaultDecimalFormat.toPattern());
    json.put("dateFormatPatternDefault", defaultDateFormat.toPattern());
    json.put("decimalFormatSymbols", decimalFormatSymbolsToJson(defaultDecimalFormat.getDecimalFormatSymbols()));
    json.put("dateFormatSymbols", dateFormatSymbolsToJson(defaultDateFormat.getDateFormatSymbols()));
    return json;
  }

  protected static DecimalFormat getDefaultDecimalFormat(Locale locale) {
    NumberFormat numberFormat = NumberFormat.getNumberInstance(locale);
    if (numberFormat instanceof DecimalFormat) {
      return (DecimalFormat) numberFormat;
    }
    LOG.info("No locale specific decimal format available, using default locale");
    return new DecimalFormat();
  }

  protected static SimpleDateFormat getDefaultSimpleDateFormat(Locale locale) {
    DateFormat format = DateFormat.getDateInstance(DateFormat.DEFAULT, locale);
    if (format instanceof SimpleDateFormat) {
      return (SimpleDateFormat) format;
    }
    LOG.info("No locale specific date format available, using default locale");
    return new SimpleDateFormat();
  }

  public static JSONObject toJson(Locale locale) {
    return locale == null ? null : new JsonLocale(locale).toJson();
  }
}
