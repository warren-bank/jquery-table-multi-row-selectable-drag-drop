jQuery(document).ready(function($){

	$('#results_display_console .close').click(function(){
		$(this).closest('#results_display_console').hide();
	});

	var results_display_console = {
		"get_table_rows"				: function($table){
			return $( $table[0].rows );
		},
		"get_text_from_table_cell"		: function($row, column_index, encode){
			var text		= $row.children('td').eq(column_index).text();
			return encode? encodeURIComponent(text) : text;
		},
		"get_server_request_uri"		: function(array_data, base_url, qs_array_name){
			var qs_array_value, request_uri;

			// leveraging the demo:
			//		http://isocra.com/2008/02/table-drag-and-drop-jquery-plugin/#3.1
			// reusing the same back-end script:
			//		http://isocra.com/articles/ajaxTest_php.html
			//		http://isocra.com/articles/ajaxTest.php?table-3[]=
			base_url		= base_url		? base_url		: 'http://isocra.com/articles/ajaxTest.php?';
			qs_array_name	= qs_array_name	? qs_array_name	: 'table-3';

			qs_array_value	= qs_array_name + '[]=';
			qs_array_value	= qs_array_value + array_data.join('&' + qs_array_value);

			request_uri		= base_url + qs_array_value;
			return request_uri;
		},
		"send_data_to_server"	: function(request_uri, heading){
			$('#results_display_console .content')
				.empty()
				.append(
					$('<h2 />').html(heading)
				)
				.append(
					$('<iframe />').attr('src', request_uri)
				)
			;
		},
		"get_event_handlers"	: function(column_index, heading_prefix){
			var process_table	= function($table, heading_suffix){
				// short-circuit if closed:
				if ( $('#results_display_console:visible').length !== 1 ){return;}

				var $rows		= results_display_console.get_table_rows($table);
				var array_data	= [];
				$rows.each(function(){
					var $row	= $(this);
					var data	= results_display_console.get_text_from_table_cell($row, column_index, true);
					array_data.push(data);
				});
				var request_uri	= results_display_console.get_server_request_uri(array_data);
				results_display_console.send_data_to_server(request_uri, heading_prefix + heading_suffix);
			};

			var event_handlers	= {
				"enter_key"				: function($selected_rows, $table, options){ process_table($table, 'Enter key pressed.<br /><br />Updating server&hellip;<br />'); },
				"double_click"			: function($selected_rows, $table, options){ process_table($table, 'Double click detected.<br /><br />Updating server&hellip;<br />'); },
				"drag_complete"			: function($selected_rows, $table, options){ process_table($table, 'Drag/Drop operation completed.<br /><br />Updating server&hellip;<br />'); }
			};
			return event_handlers;
		}
	};

	$('table#demo_01').table_multi_row_selectable_drag_drop({
		"event_handlers"		: results_display_console.get_event_handlers(0, 'Demo #01: ')
	});

	$('table#demo_02').table_multi_row_selectable_drag_drop({
		"element_selectors"		: {
			"table_cells"			: {
				"select_handle"			: "td.select_handle",
				"drag_handle"			: "td:not(.select_handle)"
			}
		},
		"event_handlers"		: results_display_console.get_event_handlers(1, 'Demo #02: ')
	});

	$('table#demo_03').table_multi_row_selectable_drag_drop({
		"element_selectors"		: {
			"table_rows"			: {
				"not_draggable"			: ["tr.nodrag","tr.selected"]
			},
			"table_cells"			: {
				"select_handle"			: "td",
				"drag_handle"			: ""
			}
		},
		"event_handlers"		: results_display_console.get_event_handlers(0, 'Demo #03: ')
	});

	$('table#demo_04').table_multi_row_selectable_drag_drop({
		"element_selectors"		: {
			"table_cells"			: {
				"select_handle"			: "",
				"drag_handle"			: "td"
			}
		},
		"behavior"				: {
			"enable_unselected_drag"	: true
		},
		"event_handlers"		: results_display_console.get_event_handlers(0, 'Demo #04: ')
	});

});
