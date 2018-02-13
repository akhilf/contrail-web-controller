/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'backbone',
    'config/networking/fippool/ui/js/models/fipPoolCfgModel',
    'config/networking/fippool/ui/js/views/fipPoolCfgEditView',
    'config/networking/fippool/ui/js/views/fipPoolFormatters',
    'contrail-view'
], function (_, Backbone, FipPoolCfgModel, FipPoolCfgEditView,
        FipPoolFormatters, ContrailView) {
    var fipPoolCfgEditView = new FipPoolCfgEditView(),
        fipPoolFormatters = new FipPoolFormatters(),
        gridElId = "#" + ctwc.FIP_POOL_GRID_ID;

    var fipPoolGridView = ContrailView.extend({
        el: $(contentContainer),

        render: function () {
            var self = this,
                viewConfig = this.attributes.viewConfig,
                pagerOptions = viewConfig['pagerOptions'];
            fipPoolCfgEditView.selectedProjectId = viewConfig.selectedProjectId;
            self.renderView4Config(self.$el, self.model,
                    getFipPoolGridViewConfig(viewConfig));
        }
    });

    var getFipPoolGridViewConfig = function (viewConfig) {
        return {
            elementId: cowu.formatElementId
                            ([ctwc.CONFIG_FIP_POOL_LIST_VIEW_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: ctwc.FIP_POOL_GRID_ID,
                                title: ctwl.CONFIG_FIP_POOLS_TITLE,
                                view: "GridView",
                                viewConfig: {
                                   elementConfig: getConfiguration(viewConfig)
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };
    function getRowActionConfig(dc) {
        var rowActionConfig = [],
            associatedVN = getValueByJsonPath(dc,
                    'virtual_network_refs;0;to;2', '');
        rowActionConfig.push(ctwgc.getEditConfig('Edit', function(rowIndex) {
            var dataItem =
                $(gridElId).data('contrailGrid')._dataView.getItem(rowIndex);

            var fipPoolCfgModel = new FipPoolCfgModel(dataItem);
            fipPoolCfgEditView.model = fipPoolCfgModel;
            fipPoolCfgEditView.renderFipPoolPopup({
                                  "title": ctwl.EDIT,
                                  mode: ctwl.EDIT_ACTION,
                                  callback: function () {
                var dataView =
                    $("#" + ctwc.FIP_POOL_GRID_ID).data("contrailGrid")._dataView;
                dataView.refreshData();
            }});
        }));
            rowActionConfig.push(
            ctwgc.getDeleteConfig('Delete', function(rowIndex) {
                var rowNum = this.rowIdentifier;
                var dataItem =
                    $(gridElId).data('contrailGrid')._dataView.getItem(rowIndex);
                var fipPoolCfgModel = new FipPoolCfgModel(dataItem);
                fipPoolCfgEditView.model = fipPoolCfgModel;
                fipPoolCfgEditView.renderDeleteFloatingIPPools({
                                      "title": ctwl.TITLE_PORT_DETETE,
                                      selectedGridData: [dataItem],
                                      //selectedProjectId: viewConfig.selectedProjectId,
                                      callback: function() {
                    var dataView =
                        $(gridElId).data("contrailGrid")._dataView;
                    dataView.refreshData();
                }});
            }));
        return rowActionConfig;
    }
    var getConfiguration = function (viewConfig) {
    	var uuid = getHashUuid();
        var gridElementConfig = {
            header: {
                title: {
                    text: ctwl.CONFIG_FIP_POOLS_TITLE
                },
                advanceControls : getHeaderActionConfig(
                                     "#" + ctwc.FIP_POOL_GRID_ID, viewConfig)
            },
            body: {
                options: {
                    autoRefresh: false,
                    checkboxSelectable: {
                        onNothingChecked: function(e){
                            $('.deletePortClass').parent().addClass(
                                                         'disabled-link');
                        },
                        onSomethingChecked: function(e){
                            $('.deletePortClass').parent().removeClass(
                                                         'disabled-link');
                        }
                    },
                    actionCell: getRowActionConfig.bind(viewConfig),
                    detail: {
                        template: cowu.generateDetailTemplateHTML(
                                            getPortDetailsTemplateConfig(),
                                            cowc.APP_CONTRAIL_CONTROLLER)
                    }
                },
                dataSource: {
                },
                statusMessages: {
                    loading: {
                        text: 'Loading Ports.',
                    },
                    empty: {
                        text: 'No Ports Found.'
                    }
                }
            },
            columnHeader: {
                columns: getfipPoolColumns()
            },
            footer: {
                pager: contrail.handleIfNull
                                    (viewConfig.pagerOptions,
                                        { options:
                                          { pageSize: 5,
                                            pageSizeSelect: [5, 10, 50, 100]
                                          }
                                        }
                                    )
            }
        };
        if(uuid != undefined){
        	gridElementConfig.onInitFilter = uuid;
        }
        return gridElementConfig;
    };

    function getfipPoolColumns () {
        var fipPoolColumns = [
            {
                id:"network",
                field:"network",
                name:"Network",
                minWidth : 180,
                sortable: {
                   sortBy: 'formattedValue'
                },
                formatter: fipPoolFormatters.networkFormater
            },
            {
                id:"name",
                field:"name",
                name:"Name",
                sortable: {
                   sortBy: 'formattedValue'
                },
                minWidth : 100
            },
            {
                field:"description",
                name:"Description",
                sortable: {
                   sortBy: 'formattedValue'
                },
                formatter: fipPoolFormatters.networkDescriptionFormater,
                minWidth : 100
            }];
        return fipPoolColumns;
    }

    
    function getHashUuid(){
        var url = decodeURIComponent(location.hash).split('&'), uuid;
        for(var i = 0; i < url.length; i++){
            if(url[i].search('uuid') !== -1){
                var spliturl = url[i].split('=').reverse();
                uuid = spliturl[0];
                break;
            }
        }
        return uuid;
    };
    
    function getHeaderActionConfig(gridElId, viewConfig) {
        var dropdownActions;
        var project = contrail.getCookie(cowc.COOKIE_PROJECT);
        if(project === ctwc.DEFAULT_PROJECT) {
            return [];
        }
        dropdownActions = [
            {
                "title" : ctwl.TITLE_DELETE_CONFIG,
                "iconClass" : "deletePortClass",
                "onClick" : function() {
                    var checkedRows =
                        $(gridElId).data("contrailGrid").
                        getCheckedRows();
                    if(checkedRows.length > 0 ) {
                        var fipPoolCfgModel = new FipPoolCfgModel();
                        fipPoolCfgEditView.model = fipPoolCfgModel;
                        fipPoolCfgEditView.renderDeleteFloatingIPPools(
                            {"title": ctwl.TITLE_DELETE_CONFIG,
                                selectedGridData: checkedRows,
                                //selectedProjectId: viewConfig.selectedProjectId,
                                callback: function () {
                                    var dataView =
                                        $(gridElId).data("contrailGrid")._dataView;
                                    dataView.refreshData();
                                }
                            }
                        );
                    }
                }

            },
            {
                "title" : ctwl.TITLE_PORT_DETETE_ALL,
                "onClick" : function() {
                    var fipPoolCfgModel = new FipPoolCfgModel();
                    fipPoolCfgEditView.model = fipPoolCfgModel;
                    fipPoolCfgEditView.renderDeleteAllPort(
                        {"title": ctwl.TITLE_PORT_DETETE,
                            selectedProjectId: viewConfig.selectedProjectId,
                            callback: function () {
                                var dataView =
                                    $(gridElId).
                                    data("contrailGrid")._dataView;
                                dataView.is_sec_grp = true;
                                dataView.refreshData();
                            }
                        }
                    );
                }
            }
        ];
        var headerActionConfig =
        [
            {
                "type" : "link",
                "title" : ctwl.TITLE_DELETE_CONFIG,
                "iconClass": 'fa fa-trash',
                "linkElementId": 'btnDeleteAppPolicy',
                "onClick" : function() {
                    var checkedRows =
                        $(gridElId).data("contrailGrid").
                        getCheckedRows();
                    if(checkedRows.length > 0 ) {
                        var fipPoolCfgModel = new FipPoolCfgModel();
                        fipPoolCfgEditView.model = fipPoolCfgModel;
                        fipPoolCfgEditView.renderDeleteFloatingIPPools(
                            {"title": ctwl.TITLE_DELETE_CONFIG,
                                selectedGridData: checkedRows,
                                //selectedProjectId: viewConfig.selectedProjectId,
                                callback: function () {
                                    var dataView =
                                        $(gridElId).data("contrailGrid")._dataView;
                                    dataView.refreshData();
                                }
                            }
                        );
                    }
                }

            },
            {
                "type": "link",
                "title": "Add Floating IP Pools",
                "iconClass": "fa fa-plus",
                "onClick": function () {
                    var dataItem = {};
                    dataItem.securityGroupValue = fipPoolFormatters.getProjectFqn()+":default";
                    //dataItem.is_sec_grp = true;
                    var fipPoolCfgModel = new FipPoolCfgModel(dataItem);
                    fipPoolCfgEditView.model = fipPoolCfgModel;
                    fipPoolCfgEditView.renderFipPoolPopup({
                                     "title": ctwl.CREATE,
                                     mode : ctwl.CREATE_ACTION,
                                     selectedProjectId: viewConfig.selectedProjectId,
                                     callback: function () {
                                    //if($(gridElId).data("contrailGrid")._dataView){
                                        var dataView =
                                            $("#" + ctwc.FIP_POOL_GRID_ID).data("contrailGrid")._dataView;
                                        dataView.refreshData();
                                    //}
                    }});
                }
            }
        ];
        return headerActionConfig;
    };
    function getBlockListTemplateGeneratorCfg() {
        var blockList = [{
            keyClass:'col-xs-3',
            valueClass:'col-xs-9',
            key: 'network',
            name: 'network',
            label:'Network',
            templateGenerator: 'TextGenerator',
            templateGeneratorConfig:{
                formatter: "networkFormater"
            }
        },
        {
            keyClass:'col-xs-3',
            valueClass:'col-xs-9',
            key: 'uuid',
            name:"uuid",
            label:"uuid",
            templateGenerator: 'TextGenerator'
        },
        {
            keyClass:'col-xs-3',
            valueClass:'col-xs-9',
            key: 'name',
            name:"name",
            label:"Pool Name",
            templateGenerator: 'TextGenerator'
        },
        {
            keyClass:'col-xs-3',
            valueClass:'col-xs-9',
            key: 'description',
            name:"description",
            label:"Pool Description",
            templateGenerator: 'TextGenerator',
            templateGeneratorConfig:{
                formatter: "networkDescriptionFormater"
            }
        }]
        console.log(blockList);
        return blockList;
    };
    function getPortDetailsTemplateConfig() {
        return {
            templateGenerator: 'RowSectionTemplateGenerator',
            templateGeneratorConfig: {
                rows: [
                    {
                        templateGenerator: 'ColumnSectionTemplateGenerator',
                        templateGeneratorConfig: {
                            columns: [
                                {
                                    class: 'col-xs-8',
                                    rows: [
                                        {
                                            title: ctwl.CFG_FIP_TITLE_DETAILS,
                                            templateGenerator: 'BlockListTemplateGenerator',
                                            templateGeneratorConfig: [
                                                {
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9',
                                                    key: 'fq_name',
                                                    name: 'network',
                                                    label:'Network',
                                                    templateGenerator: 'TextGenerator',
                                                    templateGeneratorConfig:{
                                                        formatter: "networkFormater"
                                                    }
                                                },
                                                {
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9',
                                                    key: 'uuid',
                                                    name:"uuid",
                                                    label:"uuid",
                                                    templateGenerator: 'TextGenerator'
                                                },
                                                {
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9',
                                                    key: 'name',
                                                    name:"name",
                                                    label:"Pool Name",
                                                    templateGenerator: 'TextGenerator'
                                                },
                                                {
                                                    keyClass:'col-xs-3',
                                                    valueClass:'col-xs-9',
                                                    key: 'id_perms',
                                                    name:"description",
                                                    label:"Pool Description",
                                                    templateGenerator: 'TextGenerator',
                                                    templateGeneratorConfig:{
                                                        formatter: "networkDescriptionFormater"
                                                    }
                                                }
                                            ]
                                        },
                                        //permissions
                                        ctwu.getRBACPermissionExpandDetails()
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        };
    };
    this.networkFormater = function (v, dc) {
        return fipPoolFormatters.networkFormater("", "", v, "", dc);
    };
    this.networkDescriptionFormater = function (v, dc) {
        return fipPoolFormatters.networkDescriptionFormater("", "", v, "", dc);
    };
    return fipPoolGridView;
});
