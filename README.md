### [jquery.table_multi_row_selectable_drag_drop.js](https://github.com/warren-bank/jquery-table-multi-row-selectable-drag-drop)

### Summary

  * jQuery plugin that can be used to enhance HTML `table` elements.
  * multiple rows may be selected.
  * selected rows may be dragged.
  * when multiple non-adjacent rows are dragged as a single unit:
    * the absolute position of each row within the table is changed
    * the order of the selected rows, and their position relative to one another, remains unchanged

### Example

  * [demo.html](http://warren-bank.github.io/jquery-table-multi-row-selectable-drag-drop/demo.html)

### Options <sub>(with default values)</sub>

```javascript
{
    "element_selectors"     : {
        "table_rows"            : {
            // whitelist
            "selectable"            : "tr",
            "draggable"             : "tr",
            "droppable"             : "tr",
            // blacklist
            "not_selectable"        : "tr.noselect",
            "not_draggable"         : "tr.nodrag",
            "not_droppable"         : "tr.nodrop"
        },
        "table_cells"           : {
            "drag_handle"           : "td.drag_handle",
            "select_handle"         : "td:not(.drag_handle)"
        }
    },
    "dynamic_css_classes"   : {
        "table"                 : {
            "has_focus"             : "focused"
        },
        "table_rows"            : {
            "is_selected"           : "selected",
            "is_dragging"           : "dragging"
        }
    },
    "behavior"              : {
        "drag_sensitivity"          : 10,
        "autoscroll_gutter"         : 10,
        "enable_unselected_drag"    : false
    },
    "event_handlers"        : {
        "enter_key"                 : function($selected_rows, $table, options){},
        "double_click"              : function($selected_row,  $table, options){ if (typeof options.event_handlers.enter_key !== 'function'){return;} options.event_handlers.enter_key($selected_row, $table, options); },
        "drag_complete"             : function($selected_rows, $table, options){}
    }
}
```

  * `options.element_selectors.table_rows`
    * sizzle selectors to filter `$( table.rows )`
    * used to enable/disable functionality
    * value may be:
      - _string_
      - _array of string(s)_
        * these selectors are generally used in 2 scenarios:
          1. during initial event binding to `td` handles.
             * for each type of `td` handle:
               * rows are filtered
               * matching cells are bound to an event handler
          2. at runtime, when these bound event handlers are triggered.
        * if, for some reason, there's a use-case in which runtime selectors
          need to be a superset of those selectors used during initialization,
          then the _array of string(s)_ format can be used.
        * the first array element is the only selector used during initialization
        * all strings are used at runtime
        * possible reasons this may be desirable:
          * to blacklist rows based on some condition that may change while the page is in use:<br>
            `["tr.nodrag","tr:focus","tr:first","tr:even","tr:has(.some.dynamic.content)"]`
          * truthfully, I can't think of a good reason to use this;<br>
            however, there's no harm in offering the ability (via an obscure syntax that's easy to parse).

  * `options.element_selectors.table_cells`
    * sizzle selectors to find matching table cells within groups of table rows
      * `select_handle`:<br>
        `td` elements that a user may click to select the entire row
      * `drag_handle`:<br>
        `td` elements that a user may drag to reposition all selected rows within the `table`

        > a row can only be dragged (via a `drag_handle`) when it is unselected __if__ the following option is enabled:
        >   `options.behavior.enable_unselected_drag`

        > for an example, refer to [demo #04](http://warren-bank.github.io/jquery-table-multi-row-selectable-drag-drop/demo.html#demo_04)

  * `options.dynamic_css_classes`
    * css classes that will be dynamically added to (and removed from) DOM elements in response to activity by the user.

  * `options.behavior`
    * values that can be used to modify the behavior of various aspects of the script:
      * `drag_sensitivity`:<br>
        minimum distance (in pixels) an active `drag_handle` must be dragged (vertically) for the script to respond.
        serves as a throttle to improve performance.
      * `autoscroll_gutter`:<br>
        minimum distance (in pixels) an active `drag_handle` can be (vertically) from the top/bottom border of the visible viewport
        before automatic scrolling occurs.
      * `enable_unselected_drag`:<br>
        while no rows are selected, should the user be allowed to drag one (unselected but `draggable`) row using its `drag_handle`(s)?

  * `options.event_handlers`
    * callback functions that allow custom code to run after particular user activities:
      * `enter_key`:<br>
         when one or more rows are selected in a table that has `:focus`
         and the user presses the `Enter` key on the keyboard,
         this function is called and the `$selected_rows` are passed as a parameter.
      * `double_click`:<br>
         when the user double clicks on a table row,
         this function is called and the `$selected_row` is passed as a parameter.
      * `drag_complete`:<br>
         when the user has sucessfully repositioned one or more rows within the table via drag/drop,
         this function is called and the `$selected_rows` are passed as a parameter.<br>
         <sub>note: when `options.behavior.enable_unselected_drag` is enabled and in use, `$selected_rows` will match the unselected row.</sub>

### Notes

###### Usage of the `Shift` and/or `Ctrl` key(s) with pointer/touch events

  * clicking on a `selectable` row's `select_handle`, without any modifier key(s):<br>
    * deselects all rows
    * selects the clicked row,<br>
      which will now serve as the `range_anchor`

  * clicking on a `selectable` row's `select_handle`, while pressing the `Ctrl` key:<br>
    * retains the selected state of all rows that are not the clicked row
    * toggles the selected state of the clicked row on/off
    * if the clicked row becomes selected,
      then it will now serve as the `range_anchor`.<br>
      otherwise, the closest `.prev()` selected row will serve as the `range_anchor`.<br>
      otherwise, the closest `.next()` selected row will serve as the `range_anchor`.<br>
      otherwise, there is no active `range_anchor`.

  * clicking on a `selectable` row's `select_handle`, while pressing the `Shift` key:<br>
    * deselects all rows
    * selects the range between the `range_anchor` and the clicked row,<br>
      which will now serve as the `range_endpoint`

  * clicking on a `selectable` row's `select_handle`, while pressing the `Shift` and `Ctrl` keys:<br>
    * retains the selected state of all rows that are not in the range between the `range_anchor` and the `range_endpoint`
    * deselects all rows in the range between the `range_anchor` and the `range_endpoint`
    * selects the range between the `range_anchor` and the clicked row,<br>
      which will now serve as the `range_endpoint`

###### Usage of the `up arrow` &#8593; or `down arrow` &#8595; key, optionally with `Shift` and/or `Ctrl` modifier key(s)

  * pressing an arrow key, without any modifier key(s):<br>
    * within the table that has `:focus`, if:
      * one or more rows are selected that are also `draggable`
      * foreach of these rows:<br>
        the adjacent row in the direction of the arrow key is `droppable`<br>
        <sub>(ie: `up arrow` => row above, `down arrow` => row below)</sub>
    * then:
      * a drag/drop occurs, repositioning each of the selected/`draggable` rows by a unit of one row&hellip;
        in the vertical direction indicated by the arrow key.

  * pressing an arrow key, with any combination of the `Shift` and/or `Ctrl` keys:<br>
    * within the table that has `:focus`, if:
      * the `table` has an active `range_anchor`
    * then:
      * the event is processed as though the user had clicked on the adjacent row with __both__ the `Shift` and `Ctrl` keys pressed.

### FAQs

###### Why such a long, hard to remember name?

  * This isn't the kind of plugin that gets called frequently,
    so I opted for verbose and descriptive.

  * If for some reason a user __really__ wants it to be shorter,
    then simply create an alias for it:

    ```javascript
    (function($, new_jq_plugin_alias){
        $.fn[new_jq_plugin_alias] = $.fn.table_multi_row_selectable_drag_drop;
    })(jQuery, "tblDnD");

    jQuery(document).ready(function($){
        $('table#foo').tblDnD();
    });
    ```

### License

  > [GPLv2](http://www.gnu.org/licenses/gpl-2.0.txt)
  > Copyright (c) 2014, Warren Bank
