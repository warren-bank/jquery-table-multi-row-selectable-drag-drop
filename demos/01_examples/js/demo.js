jQuery(document).ready(function($){

	$('table#demo_01').table_multi_row_selectable_drag_drop();

	$('table#demo_02').table_multi_row_selectable_drag_drop({
		"element_selectors"		: {
			"table_cells"			: {
				"select_handle"			: "td.select_handle",
				"drag_handle"			: "td:not(.select_handle)"
			}
		}
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
		}
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
		}
	});

});
