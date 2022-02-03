var $       = require( 'jquery' );
var dt      = require( 'datatables.net' )( window, $ );

class DataTablePlus {
     /*
       This class works like a wrapper around DataTable object of datatable javascript framework.
       It creates an DataTable with more functionalities, like removing and adding rows.
     */
    constructor({selector_id,
        datatable_args=null,
        row_content_template=null,
        nr_rows=0,
        delete_add_row=false,
        reset_table=false,
        buttons_options_elements={deleteButton:null, addButton:null, resetTableButton:null}
        }={}) {
        /*
            selector_id  -> html element selector of table (as used in the initialization of a DataTable object
            datatable_args -> args used in the contructor of DataTable Object
            row_content_template -> array with the length of table columns. Each array element correspond to the content
                to be added to cell of the table row to be added
            delete_add_row -> bollean parameter that works like a flag to define if add and delete row option should be
                activated
            reset_table    -> bollean argument that works as a flag to activate option to reset table
            buttons_options_elements -> object were each attributte corresponds to an html element that will trigger an
                action in the table
                    At this moment: deleteButton -> html element that will trigger delete row
                                    addButton    -> html element that will add a row
                                    resetTableButton -> html elmeent that will reset table
        */

        this.selector_id = selector_id
        this.datatable_args = datatable_args;
        this.row_content_template   = row_content_template;
        this.delete_add_row_flag = delete_add_row;
        this.reset_table_flag = reset_table;
        this.table =  $(selector_id).DataTable(this.datatable_args);
        this.delete_row_button_element = null
        this.add_row_button_element    = null
        this.#process_options_elements_args(buttons_options_elements)
        this.row_content_template      = row_content_template
        this.init_nr_rows              = nr_rows

        for(let i=1; i <= nr_rows; i++){
            this.add_row_table(this.row_content_template)
        }

        if (this.delete_add_row_flag) {
            this.#activate_add_delete_row();
        }

        if (this.reset_table_flag){
            this.#activate_reset_table();
        }

        return this
    }

    #process_options_elements_args = (options_obj) => {
        if(this.delete_add_row_flag) {
            if (options_obj.deleteButton==null) { throw new Error("Delete button element was not provided")}
            if (options_obj.addButton==null) { throw new Error("Add button element was not provided")}
            this.delete_row_button_element = options_obj.deleteButton
            this.add_row_button_element    = options_obj.addButton
        }else{
            this.delete_row_button_element = null;
            this.add_row_button_element = null;
        }
        if(this.reset_table_flag){
            if (options_obj.resetTableButton==null) { throw new Error("Reset Table button element was not provided")}
            this.reset_table_button_element = options_obj.resetTableButton
        }else{
            this.reset_table_button_element = null
        }
    }

    #activate_add_delete_row = () => {
        var self = this;
        self.add_row_button_element.on( 'click', function ()  {
                self.add_row_table(self.row_content_template)
            });


        $(self.table.table().body()).on( "keypress", "tr", function (e) {
             var key_code = e.which;
             if(key_code == 13)  // the enter key code
              {
                var new_row_id = self.add_row_table(self.row_content_template);
                // insert selector in last row
                e.preventDefault();
                //$("#".concat(new_row_id)).find('input[name="word-correct"')[0].focus()
                return false;
              }
        });
        // controls wich row is selected in table
        $(self.table.table().body()).on( 'click', 'tr', function () {
            if ( $(this).hasClass('selected') ) {
                $(this).removeClass('selected');
            }
            else {
                self.table.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
            }
        } );

        self.delete_row_button_element.click( function () {
            if (self.nr_rows_in_table() == 0) {
                return
            }
            var index_row_selected = self.table.row('.selected').index()
            if (index_row_selected != null) {
                self.delete_row_table(index_row_selected, true)
            }
        } );
    }

    #activate_reset_table = () => {
        var self = this;
        self.reset_table_button_element.click( function (){
            self.table.clear().destroy();
            self.table =  $(self.selector_id).DataTable(self.datatable_args);

            for(let i=1; i <= self.init_nr_rows; i++){
                self.add_row_table(self.row_content_template)
            }
        })
    }


    nr_rows_in_table = () => {
        return this.table.rows()[0].length
    }

    nr_cols_in_table = () => {
        return this.table.columns().count();
    }

    clear_table = (draw_table) => {
        this.table.rows().clear()
        if (draw_table) {
            this.table.draw();
        }
    }

    add_row_table = (row_content, draw_table=true) => {
        /*
            Adds a row to the table with the content "row_content".
            The "row_content" can be a node(), a string or an Array.
            see https://datatables.net/reference/api/row.add().
        */
        // row_content must be a array of strings

        if (this.nr_cols_in_table() != row_content.length) {
            throw new Error("The row content must be an array with a length equal to the nr of columns")
        }

        var new_row = this.table.row.add(row_content)
        var new_row_index = this.nr_rows_in_table()
        new_row.node().id = "row-{0}".replaceAll('{0}', new_row_index);
        if (draw_table){
            this.table.draw()
        }

        return new_row_index, new_row.node().id
    }

    change_row_content = (row_idx, row_content, draw_table = true) => {

        if (this.nr_cols_in_table() != row_content.length) {
            throw new Error("The row content must be an array with a length equal to the nr of columns")
        }
        this.table.row(row_idx).data(row_content)
        if (draw_table){
            this.table.draw()
        }
    }

    delete_row_table = (row_index=null, select_next_row=false) => {
        /*
            Deletes from "table" the row with index "row_index".
            If "select_next_row"=true, the row next to the one delete is selected.
        */

        var selected_row = this.table.row(row_index)
        selected_row.remove()
        this.table.draw()

        if (select_next_row) {
            // check if there are lines to select
            if (this.nr_rows_in_table() > 0){
                var next_row = this.table.row(row_index).node()
                $(next_row).addClass("selected")
            }
        }
    }

}

module.exports = DataTablePlus

