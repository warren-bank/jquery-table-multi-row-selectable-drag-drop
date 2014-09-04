/*
 * --------------------------------------------------------
 * script
 *     name:    jquery.table_multi_row_selectable_drag_drop.js
 *     summary: jQuery plugin that can be used to enhance HTML <table> elements.
 *                - multiple rows may be selected.
 *                - selected rows may be dragged.
 *                - when multiple non-adjacent rows are dragged as a single unit:
 *                  * the absolute position of each row within the table is changed
 *                  * the order of the selected rows, and their position relative to one another, remains unchanged
 *     url:     https://github.com/warren-bank/jquery-table-multi-row-selectable-drag-drop
 * author
 *     name:    Warren R Bank
 *     email:   warren.r.bank@gmail.com
 *     url:     https://github.com/warren-bank
 * copyright
 *     notice:  Copyright (c) 2014, Warren Bank
 * license
 *     name:    GPLv2
 *     url:     http://www.gnu.org/licenses/gpl-2.0.txt
 * --------------------------------------------------------
 */

(function($, window, document, undefined){
	var hasTouch, startEvent, moveEvent, endEvent, default_options, static_configs, static_methods, $tables;

	hasTouch			= 'ontouchstart' in document.documentElement;
	startEvent			= hasTouch ? 'touchstart' : 'mousedown';
	moveEvent			= hasTouch ? 'touchmove'  : 'mousemove';
	endEvent			= hasTouch ? 'touchend'   : 'mouseup';

	if (hasTouch){
		$.each([startEvent, moveEvent, endEvent], function(i, name) {
			$.event.fixHooks[name] = $.event.mouseHooks;
		});
	}

	default_options		= {
		"element_selectors"		: {
			"table_rows"			: {
				// whitelist
				"selectable"			: "tr",
				"draggable"				: "tr",
				"droppable"				: "tr",
				// blacklist
				"not_selectable"		: "tr.noselect",
				"not_draggable"			: "tr.nodrag",
				"not_droppable"			: "tr.nodrop"
			},
			"table_cells"			: {
				"drag_handle"			: "td.drag_handle",
				"select_handle"			: "td:not(.drag_handle)"
			}
		},
		"dynamic_css_classes"	: {
			"table"					: {
				"has_focus"				: "focused"
			},
			"table_rows"			: {
				"is_selected"			: "selected",
				"is_dragging"			: "dragging"
			}
		},
		"behavior"				: {
			"drag_sensitivity"			: 10,		// throttle: minimum number of pixels the drag_handle must be dragged (vertically) for the script to respond
			"autoscroll_gutter"			: 10,		// while dragging: minimum distance from the top or bottom of the visible viewport that the mouse can be before automatic scrolling occurs. The automatic scrolling will create this distance.
			"enable_unselected_drag"	: false		// while no rows are selected, allow the user to drag one (unselected) row using its drag handle(s)?
		},
		"event_handlers"		: {
			"enter_key"					: function($selected_rows, $table, options){},
			"double_click"				: function($selected_row,  $table, options){ if (typeof options.event_handlers.enter_key !== 'function'){return;} options.event_handlers.enter_key($selected_row, $table, options); },
			"drag_complete"				: function($selected_rows, $table, options){}
		}
	};

	static_configs		= {
		"table_state_data_key"	: "table-multi-row-selectable-drag-drop-state"
	};

	static_methods		= {
		"get_table_row_selectors"	: function(options, is_pre_event_binding){
			var row_selectors, get_filter_selector;
			row_selectors		= {};
			get_filter_selector	= function(key){
				var match, no_match, match_value, no_match_value, value;
				match			= options.element_selectors.table_rows[key];
				no_match		= options.element_selectors.table_rows['not_' + key];
				match_value		= (! $.isArray(match)) ? match
								: is_pre_event_binding ? match[0]
								: match.join(',')
				;
				no_match_value	= (! $.isArray(no_match)) ? no_match
								: is_pre_event_binding ? no_match[0]
								: no_match.join(',')
				;
				value			= match_value + ':not(' + no_match_value + ')';
				return value;
			};
			$.each([
				'selectable',
				'draggable',
				'droppable'
			], function(i, key){
				var filter_key, filter_selector;
				filter_key						= 'is_' + key;
				filter_selector					= get_filter_selector(key);
				row_selectors[filter_key]		= filter_selector;
			});
			if (! is_pre_event_binding){
				$.each(options.dynamic_css_classes.table_rows, function(filter_key, css_class){
					var filter_selector			= 'tr.' + css_class;
					row_selectors[filter_key]	= filter_selector;
				});
			}
			return row_selectors;
		},
		"get_initial_table_state"	: function(options){
			var table_state		= {
				"select"			: {
					"range_anchor"		: false,
					"range_endpoint"	: false
				},
				"drag_drop"			: {
				},
				"options"			: options,
				"row_selectors"		: static_methods.get_table_row_selectors(options, true)
			};
			return table_state;
		},
		"get_runtime_table_state"	: function(table_state){
			if (! table_state){return;}
			table_state.row_selectors	= static_methods.get_table_row_selectors(table_state.options, false);
		},
		"get_table_state"			: function($table){
			var table_state		= $table.data(static_configs.table_state_data_key);
			return table_state;
		},
		"get_all_rows"				: function($table){
			var $all_rows;
			$all_rows			= $( $table[0].rows );
			return $all_rows;
		},
		"get_filtered_rows"			: function($subject, filter_selector, range){
			var $all_rows, $filtered_rows;
			if (
				($subject.length === 1) &&
				($subject.is('table'))
			){
				$all_rows		= static_methods.get_all_rows($subject);
			}
			else if (
				($subject.length > 0) &&
				($subject.is('tr'))
			){
				$all_rows		= $subject.filter('tr');
			}
			else {
				return $();
			}
			if (range){
				// array: [start index, end index]
				$all_rows		= $all_rows.slice( range[0], range[1] );
			}
			$filtered_rows		= $all_rows.filter( filter_selector );
			return $filtered_rows;
		},
		"filter_rows"				: function($table, filter_key, table_state, range, callback){
			var filter_selector, $filtered_rows;
			if (! table_state){
				table_state		= static_methods.get_table_state($table);
			}
			filter_selector		= table_state.row_selectors[filter_key];
			if (filter_selector){
				$filtered_rows	= static_methods.get_filtered_rows($table, filter_selector, range);
			}
			else {
				$filtered_rows	= $();
			}
			if (typeof callback === 'function'){
				callback( $filtered_rows, table_state );
			}
			return $filtered_rows;
		},
		// ---------------------- convenience methods
		"get_selected_rows"			: function($table, table_state, range, callback){
			var filter_key		= 'is_selected';
			return static_methods.filter_rows($table, filter_key, table_state, range, callback);
		},
		"get_selectable_rows"		: function($table, table_state, range, callback){
			var filter_key		= 'is_selectable';
			return static_methods.filter_rows($table, filter_key, table_state, range, callback);
		},
		"get_draggable_rows"		: function($table, table_state, range, callback){
			var filter_key		= 'is_draggable';
			return static_methods.filter_rows($table, filter_key, table_state, range, callback);
		},
		"get_selected_draggable_rows"	: function($table, table_state, range, callback){
			var $selected_rows, $draggable_rows;
			if (! table_state){
				table_state		= static_methods.get_table_state($table);
			}
			$selected_rows		= static_methods.get_selected_rows($table, table_state, range, false);
			$draggable_rows		= static_methods.get_draggable_rows($selected_rows, table_state, false, callback);
			return $draggable_rows;
		},
		"get_droppable_rows"		: function($table, table_state, range, callback){
			var filter_key		= 'is_droppable';
			return static_methods.filter_rows($table, filter_key, table_state, range, callback);
		},
		// --------------------- /convenience methods
		"unselect_all_rows"			: function($table, table_state, range){
			var callback		= function($filtered_rows, table_state){
				$filtered_rows.removeClass( table_state.options.dynamic_css_classes.table_rows.is_selected );
			};
			static_methods.get_selected_rows($table, table_state, range, callback);
		},
		"select_all_rows"			: function($table, table_state, range){
			var callback		= function($filtered_rows, table_state){
				$filtered_rows.addClass( table_state.options.dynamic_css_classes.table_rows.is_selected );
			};
			static_methods.get_selectable_rows($table, table_state, range, callback);
		},
		"group_adjacent_rows"		: function($rows){
			var row_groups		= [];
			var group_index;
			$rows.each(function(i){
				if (
					(i===0) ||
					(! $rows.eq(i-1).next('tr').is( $rows.eq(i) ))
				){
					// start a new group
					group_index	= row_groups.length;
					row_groups.push( $() );
				}
				row_groups[group_index]	= ( row_groups[group_index] ).add( $rows.eq(i) );
			});
			return row_groups;
		},
		"get_row_index"				: function($row, $all_rows){
			return ($all_rows)? $all_rows.index($row) : $row.index();
		},
		"process_drag_drop"			: function($table, offset, table_state, selected_draggable_row_groups){
			// sanity check
			if (! offset){return 1;}

			if (! table_state){
				table_state		= static_methods.get_table_state($table);
			}

			if (table_state.drag_drop.is_busy){return 2;}
			else {table_state.drag_drop.is_busy	= true;}
			var end			= function(return_value){
				table_state.drag_drop.is_busy	= false;
				return return_value;
			};

			if (! selected_draggable_row_groups){
				(function(){
					var $selected_draggable_rows	= static_methods.get_selected_draggable_rows($table, table_state);
					selected_draggable_row_groups	= static_methods.group_adjacent_rows($selected_draggable_rows);
				})();
			}

			var $all_rows, drop_rows, get_drop_row_index, i, $drag_row, drop_row_index, $drop_row;

			$all_rows					= static_methods.get_all_rows($table);
			drop_rows					= [];
			get_drop_row_index	= function($drag_row){
				var drag_row_index, drop_row_index;
				drag_row_index	= static_methods.get_row_index($drag_row, $all_rows);
				drop_row_index	= drag_row_index + offset;
				return drop_row_index;
			};

			if (offset < 0){
				// each selected row will move upward by $offset.
				// adjacent rows are grouped together.
				// iterate row groups beginning with the first.
				// this will require 2 passes:
				//   - 1st to confirm that all drop targets are valid, otherwise: abort operation
				//   - 2nd to perform the actual DOM update
				for (i=0; i<selected_draggable_row_groups.length; i++){
					$drag_row		= ( selected_draggable_row_groups[i] ).first();
					drop_row_index	= get_drop_row_index($drag_row);
					if (drop_row_index < 0){return end(3);}
					$drop_row		= $all_rows.eq( drop_row_index );
					if (! $drop_row.is( table_state.row_selectors.is_droppable )){return end(4);}
					drop_rows[i]	= $drop_row;
				}

				// still here: proceed with pass #2
				for (i=0; i<selected_draggable_row_groups.length; i++){
					$drag_row		= selected_draggable_row_groups[i];
					$drop_row		= drop_rows[i];

					$drag_row.insertBefore($drop_row);
				}
			}
			else {
				// each selected row will move downward by $offset.
				// iterate row groups beginning with the last.
				for (i=(selected_draggable_row_groups.length - 1); i>=0; i--){
					$drag_row		= ( selected_draggable_row_groups[i] ).last();
					drop_row_index	= get_drop_row_index($drag_row);
					if (drop_row_index >= $all_rows.length){return end(3);}
					$drop_row		= $all_rows.eq( drop_row_index );
					if (! $drop_row.is( table_state.row_selectors.is_droppable )){return end(4);}
					drop_rows[i]	= $drop_row;
				}

				// still here: proceed with pass #2
				for (i=(selected_draggable_row_groups.length - 1); i>=0; i--){
					$drag_row		= selected_draggable_row_groups[i];
					$drop_row		= drop_rows[i];

					$drag_row.insertAfter($drop_row);
				}
			}
			return end(false);
		},
		"process_row_selection"		: function($table, $row, shiftKey, ctrlKey, table_state){
			var row_index, prev_range_endpoint, range;
			if (! table_state){
				table_state		= static_methods.get_table_state($table);
			}

			// sanity check
			if (! $row.is( table_state.row_selectors.is_selectable )){return;}

			row_index			= static_methods.get_row_index($row);
			prev_range_endpoint	= table_state.select.range_endpoint;
			table_state.select.range_endpoint	= row_index;

			if (
					(! shiftKey)
				||	(typeof table_state.select.range_anchor !== 'number')
			){
				table_state.select.range_anchor	= row_index;
			}

			if (shiftKey){
				if (! ctrlKey){
					// unselect current selection
					static_methods.unselect_all_rows($table, table_state);
				}
				else {
					// unselect range: range_anchor -> prev_range_endpoint
					range		= [
									Math.min(table_state.select.range_anchor, prev_range_endpoint),
									Math.max(table_state.select.range_anchor, prev_range_endpoint) + 1
					];
					static_methods.unselect_all_rows($table, table_state, range);
				}
				// select range: range_anchor -> range_endpoint
				range			= [
									Math.min(table_state.select.range_anchor, table_state.select.range_endpoint),
									Math.max(table_state.select.range_anchor, table_state.select.range_endpoint) + 1
				];
				static_methods.select_all_rows($table, table_state, range);
			}
			else if (ctrlKey){
				$row.toggleClass( table_state.options.dynamic_css_classes.table_rows.is_selected );

				// if no-longer selected, then reset the range points
				if (! $row.hasClass( table_state.options.dynamic_css_classes.table_rows.is_selected )){
					(function(){
						var row_selector, $nearest_row, row_index;
						row_selector		= table_state.row_selectors.is_selected + ':first';
						$nearest_row		= $row.prevAll(row_selector);
						if ($nearest_row.length !== 1){
							$nearest_row	= $row.nextAll(row_selector);
						}
						row_index			= ($nearest_row.length !== 1)? false : static_methods.get_row_index($nearest_row);
						table_state.select.range_anchor		= row_index;
						table_state.select.range_endpoint	= row_index;
					})();
				}
			}
			else {
				// unselect current selection
				static_methods.unselect_all_rows($table, table_state);

				$row.addClass( table_state.options.dynamic_css_classes.table_rows.is_selected );
			}
		},
		"process_arrow_key"			: function($table, direction, shiftKey, ctrlKey, table_state){
			var as_drag, as_select;
			var $selected_draggable_rows, selected_draggable_row_groups;
			if (! table_state){
				table_state		= static_methods.get_table_state($table);
			}
			as_drag				= ( (! shiftKey) && (! ctrlKey) );
			if (as_drag){
				// are there any selected rows to drag?
				$selected_draggable_rows			= static_methods.get_selected_draggable_rows($table, table_state);
				if ($selected_draggable_rows.length){
					selected_draggable_row_groups	= static_methods.group_adjacent_rows($selected_draggable_rows);
				}
				else {as_drag = false;}
			}
			as_select			= (! as_drag);
			if (as_select){
				// is there a "range_endpoint" to advance?
				if (typeof table_state.select.range_endpoint !== 'number'){as_select = false;}
			}
			if (as_select && shiftKey){
				// just to be on the safe side, make sure there's a "range_anchor"
				if (typeof table_state.select.range_anchor !== 'number'){
					table_state.select.range_anchor = table_state.select.range_endpoint;
				}
			}
			if (as_drag){
				var offset		= (direction === 'up')? -1 : 1;
				var error		= static_methods.process_drag_drop($table, offset, table_state, selected_draggable_row_groups);

				if (! error){
					table_state.options.event_handlers.drag_complete($selected_draggable_rows, $table, table_state.options);
				}
			}
			if (as_select){
				var $row		= (function(){
					var row_selector, $current_row, $next_row;
					row_selector	= table_state.row_selectors.is_selectable + ':first';
					$current_row	= $( $table[0].rows[ table_state.select.range_endpoint ] );
					$next_row		= (direction === 'up')? $current_row.prevAll(row_selector) : $current_row.nextAll(row_selector);
					return $next_row;
				})();
				if ($row.length === 1){
					// if either Shift or Ctrl are pressed with the arrow key,
					// then treat the row selection the same as though the user clicked on the adjacent row with BOTH keys pressed.
					// this retains all currently selected rows, while selecting rows within the range: range_anchor -> $row
					static_methods.process_row_selection($table, $row, (shiftKey || ctrlKey), (shiftKey || ctrlKey), table_state);
				}
			}
		},
		"bind_table_focus"			: function($table, table_state){
			if (! table_state){
				table_state		= static_methods.get_table_state($table);
			}
			$table.bind('focus', function() {
				$tables.removeClass( table_state.options.dynamic_css_classes.table.has_focus );
				$table.addClass( table_state.options.dynamic_css_classes.table.has_focus );
			});
			$table.bind('blur', function() {
				$table.removeClass( table_state.options.dynamic_css_classes.table.has_focus );
			});
		},
		"bind_keystrokes"			: function($table, table_state){
			$table.bind('keydown', function(event){

				switch(event.keyCode) {
					case 16:
						// "shift"
						break;

					case 13:
						// "enter"
						(function(){
							if (! table_state){
								table_state			= static_methods.get_table_state($table);
							}
							if (typeof table_state.options.event_handlers.enter_key === 'function'){
								var $selected_rows	= static_methods.get_selected_rows($table, table_state);
								if ($selected_rows.length){
									event.preventDefault();
									table_state.options.event_handlers.enter_key($selected_rows, $table, table_state.options);
								}
							}
						})();
						break;

					case 38:
						// "up" arrow
						event.preventDefault();
						static_methods.process_arrow_key($table, 'up', event.shiftKey, event.ctrlKey, table_state);
						break;

					case 40:
						// "down" arrow
						event.preventDefault();
						static_methods.process_arrow_key($table, 'down', event.shiftKey, event.ctrlKey, table_state);
						break;
				}

			});
		},
		"bind_select_handle"			: function($table, table_state){
			var $selectable_rows;
			if (! table_state){
				table_state		= static_methods.get_table_state($table);
			}

			$selectable_rows	= static_methods.get_selectable_rows($table, table_state);

			$selectable_rows.bind('dblclick dbltap', function(event){
				if (typeof table_state.options.event_handlers.double_click === 'function'){
					var $selected_row	= $(this);
					table_state.options.event_handlers.double_click($selected_row, $table, table_state.options);
				}
			});

			$selectable_rows.find( table_state.options.element_selectors.table_cells.select_handle ).bind('click', function(event){
				event.preventDefault();
				var $select_handle, $row;
				$select_handle	= $(this);
				$row			= $select_handle.closest( table_state.row_selectors.is_selectable );
				if ($row.length === 1){
					static_methods.process_row_selection($table, $row, event.shiftKey, event.ctrlKey, table_state);
				}
			});
		},
		"bind_drag_handle"			: function($table, table_state){
			var $draggable_rows;
			if (! table_state){
				table_state		= static_methods.get_table_state($table);
			}

			$draggable_rows		= static_methods.get_selectable_rows($table, table_state);
			$draggable_rows		= $draggable_rows.filter( table_state.row_selectors.is_draggable );

			$draggable_rows.find( table_state.options.element_selectors.table_cells.drag_handle ).bind(startEvent, function(event){
				event.preventDefault();
				var $drag_handle, $drag_row, $selected_draggable_rows, selected_draggable_row_groups;
				$drag_handle	= $(this);
				$drag_row		= $drag_handle.closest( table_state.row_selectors.is_selectable );
				if ($drag_row.length === 1){
					$selected_draggable_rows		= static_methods.get_selected_draggable_rows($table, table_state);
					selected_draggable_row_groups	= static_methods.group_adjacent_rows($selected_draggable_rows);

					if (
						($selected_draggable_rows.length === 0) &&
						(table_state.options.behavior.enable_unselected_drag)
					){
						$selected_draggable_rows	= $drag_row;
						selected_draggable_row_groups.push( $drag_row );
					}

					static_methods.initialize_drag($table, $drag_row, $selected_draggable_rows, selected_draggable_row_groups, event.pageX, event.pageY, table_state);
				}
			});
		},
		"initialize_drag"			: function($table, $drag_row, $selected_draggable_rows, selected_draggable_row_groups, pageX, pageY, table_state){
			if (! table_state){
				table_state		= static_methods.get_table_state($table);
			}

			$selected_draggable_rows.addClass( table_state.options.dynamic_css_classes.table_rows.is_dragging );

			table_state.drag_drop					= {};
			table_state.drag_drop.coordsX			= pageX;
			table_state.drag_drop.coordsY			= pageY;
			table_state.drag_drop.drag_row_index	= static_methods.get_row_index($drag_row);
			table_state.drag_drop.initial			= {
				"coordsY"							: table_state.drag_drop.coordsY,
				"drag_row_index"					: table_state.drag_drop.drag_row_index
			};

			var $document, movement_event_handler, end_movement_event_handler;
			$document								= $(document);
			movement_event_handler					= function(event){
				var error =
				static_methods.process_movement_event($table, $drag_row, $selected_draggable_rows, selected_draggable_row_groups, event.pageY, table_state);

				if (error){
					end_movement_event_handler(event);
				}
			};
			end_movement_event_handler				= function(event){
				static_methods.process_movement_event($table, $drag_row, $selected_draggable_rows, selected_draggable_row_groups, event.pageY, table_state);

				static_methods.finalize_movement_event($table, $drag_row, $selected_draggable_rows, selected_draggable_row_groups, event.pageY, table_state);

				$document.unbind(moveEvent, movement_event_handler);
				$document.unbind(endEvent,  end_movement_event_handler);
			};

			$document.bind(moveEvent, movement_event_handler);
			$document.bind(endEvent,  end_movement_event_handler);
		},
		"process_movement_event"	: function($table, $drag_row, $selected_draggable_rows, selected_draggable_row_groups, pageY, table_state){
			var $document, $drop_row, drop_row_index, offset, error;
			if (! table_state){
				table_state		= static_methods.get_table_state($table);
			}

			// sanity check, return an error that will unbind movement event handlers
			if (
				(! table_state.drag_drop) || (typeof table_state.drag_drop.coordsX !== 'number') || (typeof table_state.drag_drop.coordsY !== 'number') || (typeof table_state.drag_drop.drag_row_index !== 'number')
			){return 1;}

			// enforce a gutter between the mouse pointer and the visible viewport
			static_methods.autoscroll_table($table, pageY, table_state);

			// is movement too small to process?
			if (
				(table_state.options.behavior.drag_sensitivity) &&
				(Math.abs( table_state.drag_drop.coordsY - pageY ) < table_state.options.behavior.drag_sensitivity)
			){return;}

			table_state.drag_drop.coordsY	= pageY;

			// find the row (drop target) associated with the y-coordinate: pageY
			// helpful:
			//   * http://www.zehnet.de/2010/11/19/document-elementfrompoint-a-jquery-solution/
			$document			= $(document);
			$drop_row			= document.elementFromPoint(
				( table_state.drag_drop.coordsX - $document.scrollLeft() ),
				( pageY - $document.scrollTop() )
			);
			$drop_row			= $( $drop_row ).closest('tr', $table);

			// sanity check
			if ($drop_row.length !== 1){return;}
			//console.log( $drop_row[0] );

			// same row: do nothing
			if ($drop_row.is( $drag_row )){return;}

			// not "droppable"
			if (! $drop_row.is( table_state.row_selectors.is_droppable )){return;}

			drop_row_index		= static_methods.get_row_index($drop_row);
			offset				= drop_row_index - table_state.drag_drop.drag_row_index;
			error				= static_methods.process_drag_drop($table, offset, table_state, selected_draggable_row_groups);

			if (! error){
				table_state.drag_drop.drag_row_index = drop_row_index;
			}
		},
		"scroll_window_if_necessary"	: function(mouseY, gutter_height){
			var windowY_top, window_height, windowY_bottom, scroll_distance;

			windowY_top			= (! document.all) ? window.pageYOffset
								: (document.compatMode === 'BackCompat')? document.body.scrollTop
								: document.documentElement.scrollTop;

			window_height		= window.innerHeight ? window.innerHeight
								: document.documentElement.clientHeight ? document.documentElement.clientHeight
								: document.body.clientHeight;

			windowY_bottom		= windowY_top + window_height;

			if (mouseY - windowY_top < gutter_height){
				// scroll up
				scroll_distance	= gutter_height - (mouseY - windowY_top);
				window.scrollBy(0, - scroll_distance);
			}
			else if (windowY_bottom - mouseY < gutter_height){
				// scroll down
				scroll_distance	= gutter_height - (windowY_bottom - mouseY);
				window.scrollBy(0, scroll_distance);
			}
		},
		"get_element_boundaries"	: function($element){
			var elementY_top, element_height, elementY_bottom, element_boundaries;

			elementY_top		= ( $element.offset() ).top;
			element_height		= $element.height();
			elementY_bottom		= elementY_top + element_height;
			element_boundaries	= {"top":elementY_top, "bottom":elementY_bottom};
			return element_boundaries;
		},
		"autoscroll_table"			: function($table, mouseY, table_state){
			var gutter_height, table_boundaries;
			if (! table_state){
				table_state		= static_methods.get_table_state($table);
			}
			gutter_height		= table_state.options.behavior.autoscroll_gutter;
			table_boundaries	= static_methods.get_element_boundaries($table);

			// constrain autoscroll to within the (vertical) boundaries of the table element
			if (mouseY < table_boundaries.top){
				mouseY			= table_boundaries.top;
			}
			else if (mouseY > table_boundaries.bottom){
				mouseY			= table_boundaries.bottom;
			}

			static_methods.scroll_window_if_necessary(mouseY, gutter_height);
		},
		"finalize_movement_event"	: function($table, $drag_row, $selected_draggable_rows, selected_draggable_row_groups, pageY, table_state){
			if (! table_state){
				table_state			= static_methods.get_table_state($table);
			}
			var drag_occurred		= (table_state.drag_drop.drag_row_index !== table_state.drag_drop.initial.drag_row_index);
			table_state.drag_drop	= {};
			$selected_draggable_rows.removeClass( table_state.options.dynamic_css_classes.table_rows.is_dragging );
			if (drag_occurred){
				table_state.options.event_handlers.drag_complete($selected_draggable_rows, $table, table_state.options);
			}
		}
	};

	$tables				= $();

	$.fn.table_multi_row_selectable_drag_drop = function(user_options){
		this.each(function(){
			var $table, options, table_state;

			$table				= $(this);
			$tables				= $tables.add( $table );
			options				= $.extend(true, {}, default_options, (user_options || {}));
			table_state			= static_methods.get_initial_table_state( options );

			$table.attr('tabindex', $tables.length);
			$table.data(static_configs.table_state_data_key, table_state);

			static_methods.bind_table_focus($table, table_state);
			static_methods.bind_keystrokes($table, table_state);
			static_methods.bind_select_handle($table, table_state);
			static_methods.bind_drag_handle($table, table_state);

			static_methods.get_runtime_table_state(table_state);
		});

		// continue chaining
		return this;
	};

})(window.jQuery, window, window.document);
