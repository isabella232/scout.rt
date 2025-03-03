/*
 * Copyright (c) 2014-2017 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
import {arrays, DateFormat, dates, Device, events, graphics, HtmlComponent, objects, scout, Widget} from '../index';
import $ from 'jquery';

export default class DatePicker extends Widget {

  constructor() {
    super();

    // Preselected date can only be set if selectedDate is null. The preselected date is rendered differently, but
    // has no function otherwise. (It is used to indicate the day that will be selected when the user presses
    // the UP or DOWN key while no date is selected.)
    this.preselectedDate = null;
    this.selectedDate = null;
    this.dateFormat = null;
    this.viewDate = null;
    this.allowedDates = null;
    this.currentMonth = null;
    this.$scrollable = null;
    // Contains the months to be rendered.
    // Only the this.currentMonth is visible, the others are needed for the swipe animation.
    // The month is an object with the properties viewDate, rendered and $container
    this.months = [];
    this.touch = Device.get().supportsOnlyTouch();
  }

  _init(options) {
    super._init(options);
    this._setDateFormat(this.dateFormat);
  }

  _render() {
    this.$container = this.$parent
      .appendDiv('date-picker')
      .toggleClass('touch', this.touch);
    this.htmlComp = HtmlComponent.install(this.$container, this.session);

    this._$header = this._append$Header();
    this._$header
      .find('.date-picker-left-y, .date-picker-left-m, .date-picker-right-m, .date-picker-right-y')
      .mousedown(this._onNavigationMouseDown.bind(this));

    this.$container.appendDiv('date-picker-separator');
    this.$scrollable = this.$container.appendDiv('date-picker-scrollable');
    this._registerSwipeHandlers();
  }

  _setDateFormat(dateFormat) {
    if (!dateFormat) {
      dateFormat = this.session.locale.dateFormatPatternDefault;
    }
    dateFormat = DateFormat.ensure(this.session.locale, dateFormat);
    this._setProperty('dateFormat', dateFormat);
  }

  prependMonth(month) {
    var months = this.months.slice();
    arrays.insert(months, month, 0);
    this.setMonths(months);
  }

  appendMonth(month) {
    var months = this.months.slice();
    months.push(month);
    this.setMonths(months);
  }

  /**
   * Resets the month boxes. Always render 3 months to make swiping more smooth (especially on mobile devices).
   */
  resetMonths(viewDate) {
    viewDate = viewDate || this.viewDate;
    var prevDate = dates.shift(viewDate, 0, -1, 0);
    var nextDate = dates.shift(viewDate, 0, 1, 0);
    this.setMonths([prevDate, viewDate, nextDate]);
  }

  setMonths(months) {
    months = arrays.ensure(months);
    months = months.map(function(month) {
      var viewDate = month;
      if (!(month instanceof Date)) {
        viewDate = month.viewDate;
      }
      // Use existing month object (so that $container won't be removed, see below)
      var existingMonth = this._findMonthByViewDate(viewDate);
      if (existingMonth) {
        return existingMonth;
      }
      return {
        rendered: false,
        viewDate: viewDate,
        $container: undefined
      };
    }, this);

    // Remove the obsolete months
    if (this.rendered) {
      this.months.forEach(function(month) {
        if (months.indexOf(month) < 0 && month.rendered) {
          month.$container.remove();
        }
      }, this);
    }
    this.setProperty('months', months);
  }

  _renderMonths() {
    // Render the months if needed
    this.months.forEach(function(month) {
      if (!month.rendered) {
        this._renderMonth(month);

        // move month to correct position in DOM.
        // Current month must not be moved, otherwise click event gets lost.
        if (this.currentMonth && dates.compare(month.viewDate, this.currentMonth.viewDate) < 0) {
          month.$container.insertBefore(this.currentMonth.$container);
        }
      }
    }, this);

    // Adjust size and position of the scrollable
    var scrollableWidth = this.months.length * this._boxWidth;
    this.$scrollable.width(scrollableWidth);
    if (this.currentMonth) {
      this.$scrollable.cssLeft(this._scrollableLeftForMonth(this.currentMonth));
    }
  }

  _findMonthByViewDate(viewDate) {
    return arrays.find(this.months, function(month) {
      return dates.compareMonths(month.viewDate, viewDate) === 0;
    });
  }

  /**
   * @returns {number} the x coordinate of the scrollable if the given month should be displayed
   */
  _scrollableLeftForMonth(month) {
    var scrollableInsets = graphics.insets(this.$scrollable);
    var monthMargins = graphics.margins(month.$container);
    return -1 * (month.$container.position().left - monthMargins.left - scrollableInsets.left);
  }

  _renderMonth(month) {
    if (month.rendered) {
      return;
    }

    var $box = this.$parent.makeDiv('date-picker-month-box');
    this._build$DateBox(month.viewDate).appendTo($box);
    $box.on('DOMMouseScroll mousewheel', this._onMouseWheel.bind(this))
      .appendTo(this.$scrollable);

    // Fix the size of the box
    if (!this._boxWidth) {
      this._boxWidth = $box.width();
    }
    $box.width(this._boxWidth);

    month.$container = $box;
    month.rendered = true;
  }

  /**
   * @internal, use showDate, selectDate, shiftViewDate, etc. to change the view date
   */
  setViewDate(viewDate, animated) {
    if (objects.equals(this.viewDate, viewDate)) {
      return;
    }
    this._setProperty('viewDate', viewDate);
    if (this.rendered) {
      this._renderViewDate(animated);
    }
  }

  _renderViewDate(animated) {
    var month = this._findMonthByViewDate(this.viewDate);
    var newLeft = this._scrollableLeftForMonth(month);
    if (!this.currentMonth) {
      // The first time a month is rendered, revalidate the layout.
      // Reason: When the popup opens, the datepicker is not rendered yet, thus the preferred size cannot be determined
      this.revalidateLayoutTree();
    }
    this.currentMonth = month;
    this._updateHeader(this.viewDate);

    animated = scout.nvl(animated, true);
    if (!animated) {
      this.$scrollable.cssLeft(newLeft);
      this.resetMonths();
    } else {
      // Animate
      // At first: stop existing animation when shifting multiple dates in a row (e.g. with mouse wheel)
      this.$scrollable
        .stop(true)
        .animate({
          left: newLeft
        }, 300, function() {
          this.resetMonths();
        }.bind(this));
    }
  }

  preselectDate(date, animated) {
    this.showDate(date, animated);
    if (date) {
      // Clear selection when a date is preselected
      this.setSelectedDate(null);
    }
    this.setPreselectedDate(date);
  }

  /**
   * @internal, use preselectDate to preselect a date
   */
  setPreselectedDate(preselectedDate) {
    this.setProperty('preselectedDate', preselectedDate);
  }

  _renderPreselectedDate() {
    if (!this.currentMonth) {
      return;
    }
    var $box = this.currentMonth.$container;
    $box.find('.date-picker-day').each(function(i, elem) {
      var $day = $(elem);
      $day.removeClass('preselected');
      if (dates.isSameDay(this.preselectedDate, $day.data('date'))) {
        $day.addClass('preselected');
      }
    }.bind(this));
  }

  selectDate(date, animated) {
    this.showDate(date, animated);
    if (date) {
      // Clear preselection when a date is selected
      this.setPreselectedDate(null);
    }
    this.setSelectedDate(date);
  }

  /**
   * @internal, use selectDate to select a date
   */
  setSelectedDate(selectedDate) {
    this.setProperty('selectedDate', selectedDate);
  }

  _renderSelectedDate() {
    if (!this.currentMonth) {
      return;
    }
    var $box = this.currentMonth.$container;
    $box.find('.date-picker-day').each(function(i, elem) {
      var $day = $(elem);
      $day.removeClass('selected');
      if (dates.isSameDay(this.selectedDate, $day.data('date'))) {
        $day.addClass('selected');
      }
    }.bind(this));
  }

  /**
   * Shows the month which contains the given date.
   * @param {Date} date
   * @param {boolean} [animated] - Default is true
   */
  showDate(viewDate, animated) {
    var viewDateDiff = 0;
    if (this.viewDate) {
      viewDateDiff = dates.compareMonths(viewDate, this.viewDate);
    }

    if (this.currentMonth && viewDateDiff) {
      if (viewDateDiff < 0) {
        this.prependMonth(viewDate);
      } else {
        this.appendMonth(viewDate);
      }
    } else {
      if (!this.currentMonth) {
        // Initially (when the popup is opened), don't reset, just display one month.
        // Reason: _renderMonths may not determine the proper scroll left yet
        this.setMonths([viewDate]);
      } else {
        this.resetMonths(viewDate);
      }
    }
    this.setViewDate(viewDate, animated);
  }

  shiftViewDate(years, months, days) {
    var date = this.viewDate;
    date = dates.shift(date, years, months, days);
    this.showDate(date);
  }

  shiftSelectedDate(years, months, days) {
    var date = this.preselectedDate;

    if (this.selectedDate) {
      if (this.allowedDates) {
        date = this._findNextAllowedDate(years, months, days);
      } else {
        date = dates.shift(this.selectedDate, years, months, days);
      }
    }

    if (!date) {
      return; // do nothing when no date was found
    }

    this.selectDate(date, true);
  }

  _findNextAllowedDate(years, months, days) {
    var i, date,
      sum = years + months + days,
      dir = sum > 0 ? 1 : -1,
      now = this.selectedDate || dates.trunc(new Date());

    // if we shift by year or month, shift the 'now' date and then use that date as starting point
    // to find the next allowed date.
    if (years !== 0) {
      now = dates.shift(now, years, 0, 0);
    } else if (months !== 0) {
      now = dates.shift(now, 0, months, 0);
    }

    if (dir === 1) { // find next allowed date, starting from currently selected date
      for (i = 0; i < this.allowedDates.length; i++) {
        date = this.allowedDates[i];
        if (dates.compare(now, date) < 0) {
          return date;
        }
      }
    } else if (dir === -1) { // find previous allowed date, starting from currently selected date
      for (i = this.allowedDates.length - 1; i >= 0; i--) {
        date = this.allowedDates[i];
        if (dates.compare(now, date) > 0) {
          return date;
        }
      }
    }

    return null;
  }

  _isDateAllowed(date) {
    // when allowedDates is empty or not set, any date is allowed
    if (!this.allowedDates || this.allowedDates.length === 0) {
      return true;
    }
    // when allowedDates is set, only dates contained in this array are allowed
    var allowedDateAsTimestamp,
      dateAsTimestamp = date.getTime();
    return this.allowedDates.some(function(allowedDate) {
      allowedDateAsTimestamp = allowedDate.getTime();
      return allowedDateAsTimestamp === dateAsTimestamp;
    });
  }

  _build$DateBox(viewDate) {
    var cl, i, day, dayEnabled, dayInMonth, $day,
      now = new Date(),
      start = new Date(viewDate),
      weekdays = this.dateFormat.symbols.weekdaysShortOrdered;

    var $box = this.$container
      .makeDiv('date-picker-month')
      .data('viewDate', viewDate);

    // Create weekday header
    var $weekdays = $box.appendDiv('date-picker-weekdays');
    weekdays.forEach(function(weekday) {
      $weekdays.appendDiv('date-picker-weekday', weekday);
    });

    // Find start date (-1)
    var $week;
    for (var offset = 0; offset < 42; offset++) {
      start.setDate(start.getDate() - 1);
      var diff = new Date(start.getYear(), viewDate.getMonth(), 0).getDate() - start.getDate();
      if ((start.getDay() === 0) && (start.getMonth() !== viewDate.getMonth()) && (diff > 1)) {
        break;
      }
    }

    // Create days
    for (i = 0; i < 42; i++) {
      if (i % 7 === 0) {
        $week = $box.appendDiv('date-picker-week');
      }

      start.setDate(start.getDate() + 1);
      dayInMonth = start.getDate();

      if ((start.getDay() === 6) || (start.getDay() === 0)) {
        cl = (start.getMonth() !== viewDate.getMonth() ? ' date-picker-out-weekend' : ' date-picker-weekend');
      } else {
        cl = (start.getMonth() !== viewDate.getMonth() ? ' date-picker-out' : '');
      }

      if (dates.isSameDay(start, now)) {
        cl += ' date-picker-now';
      }

      if (dates.isSameDay(this.selectedDate, start)) {
        cl += ' selected';
      }

      if (dates.isSameDay(this.preselectedDate, start)) {
        cl += ' preselected';
      }

      // helps to center days between 10 and 19 nicer (especially when website is zoomed > 100%)
      if (dayInMonth > 9 && dayInMonth < 20) {
        cl += ' ten';
      }

      dayEnabled = this._isDateAllowed(start);
      if (!dayEnabled) {
        cl += ' disabled';
      }

      day = (dayInMonth <= 9 ? '0' + dayInMonth : dayInMonth);
      $day = $week
        .appendDiv('date-picker-day' + cl)
        .data('dayInMonth', dayInMonth)
        .data('date', new Date(start));
      $day.appendSpan('text', day);

      if (dayEnabled) {
        $day.on('click', this._onDayClick.bind(this));
      }
    }

    return $box;
  }

  _append$Header() {
    var headerHtml =
      '<div class="date-picker-header">' +
      '  <div class="date-picker-left-y" data-shift="-12"></div>' +
      '  <div class="date-picker-left-m" data-shift="-1"></div>' +
      '  <div class="date-picker-right-y" data-shift="12"></div>' +
      '  <div class="date-picker-right-m" data-shift="1"></div>' +
      '  <div class="date-picker-header-month"></div>' +
      '</div>';
    return this.$container
      .appendElement(headerHtml)
      .toggleClass('touch', this.touch);
  }

  _updateHeader(viewDate) {
    this._$header.find('.date-picker-header-month').text(this._createHeaderText(viewDate));
  }

  _createHeaderText(viewDate) {
    var months = this.dateFormat.symbols.months;
    return months[viewDate.getMonth()] + ' ' + viewDate.getFullYear();
  }

  _registerSwipeHandlers() {
    var $window = this.$scrollable.window();

    this.$scrollable.on('touchmove', function(event) {
      // prevent scrolling the background when swiping the date picker (iOS)
      event.preventDefault();
    });

    this.$scrollable.on('remove', function(event) {
      $window.off('.datepickerDrag');
    });

    this.$scrollable.on(events.touchdown(this.touch), function(event) {
      var origPageX = events.pageX(event);
      var moveX = 0;

      // stop pending animations, otherwise the months may be removed by the animation stop handler before touchend is executed
      this.$scrollable.stop(true);

      // Prepare months. On the first swipe the 3 boxes are already rendered, so nothing happens when setMonths is called.
      // But on a subsequent swipe (while the pane is still moving) the next month needs to be rendered.
      var prevDate = dates.shift(this.viewDate, 0, -1, 0);
      var nextDate = dates.shift(this.viewDate, 0, 1, 0);
      this.setMonths([prevDate, this.viewDate, nextDate]);
      var scrollableLeft = this.$scrollable.position().left;

      this.swiped = false;
      var started = true;

      $window.on(events.touchmove(this.touch, 'datepickerDrag'), function(event) {
        var pageX = events.pageX(event);
        moveX = pageX - origPageX;
        var newScrollableLeft = scrollableLeft + moveX;
        var minX = this.$container.width() - this.$scrollable.outerWidth();

        // limit the drag range
        newScrollableLeft = Math.max(Math.min(newScrollableLeft, 0), minX);

        // set the new position
        if (newScrollableLeft !== scrollableLeft) {
          this.$scrollable.cssLeft(newScrollableLeft);
        }
      }.bind(this));

      $window.on(events.touchendcancel(this.touch, 'datepickerDrag'), function(event) {
        $window.off('.datepickerDrag');
        if (!started) {
          // On iOS touchcancel and touchend are fired right after each other when swiping twice very fast -> Ignore the second event
          return;
        }
        started = false;

        // If the movement is less than this value (in px), the swipe won't happen. Instead, the value is selected.
        var minMove = 5;
        var viewDate = this.viewDate;

        // Detect in which direction the swipe happened
        if (moveX < -minMove) {
          // dragged left -> use next month
          viewDate = nextDate;
        } else if (moveX > minMove) {
          // dragged right -> use previous month
          viewDate = prevDate;
        }

        if (this.viewDate !== viewDate) {
          this.swiped = true;
          this.setViewDate(viewDate);
        }
      }.bind(this));
    }.bind(this));
  }

  _onNavigationMouseDown(event) {
    var $target = $(event.currentTarget);
    var diff = $target.data('shift');
    this.shiftViewDate(0, diff, 0);
  }

  _onDayClick(event) {
    if (this.swiped) {
      // Don't handle on a swipe action
      return;
    }
    var $target = $(event.currentTarget);
    var date = $target.data('date');
    this.selectDate(date);
    this.trigger('dateSelect', {
      date: date
    });
  }

  _onMouseWheel(event) {
    event = event.originalEvent || this.$container.window(true).event.originalEvent;
    var wheelData = event.wheelDelta ? event.wheelDelta / 10 : -event.detail * 3;
    var diff = (wheelData >= 0 ? -1 : 1);
    this.shiftViewDate(0, diff, 0);
    event.preventDefault();
  }
}
