(function($, new_jq_plugin_alias){
	$.fn[new_jq_plugin_alias] = $.fn.table_multi_row_selectable_drag_drop;
})(jQuery, "tblDnD");

jQuery(document).ready(function($){

	$('table#demo_01').tblDnD();

	$('table#demo_02').tblDnD({
		"element_selectors"		: {
			"table_cells"			: {
				"select_handle"			: "td.select_handle",
				"drag_handle"			: "td:not(.select_handle)"
			}
		}
	});

	$('table#demo_03').tblDnD({
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

	$('table#demo_04').tblDnD({
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
