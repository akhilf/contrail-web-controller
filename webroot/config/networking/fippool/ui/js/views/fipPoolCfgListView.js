/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-list-model',
    'contrail-view'
], function (_, ContrailListModel, ContrailView) {
    var fipCfgListView = ContrailView.extend({
        el: $(contentContainer),

        render: function () {
            var self = this, viewConfig = this.attributes.viewConfig;
            console.log("viewConfig",viewConfig);
            var listModelConfig = {
                remote: {
                    ajaxConfig: {
                        url: '/api/tenants/config/get-config-details',
                        type: 'POST',
                        data: JSON.stringify({
                                'data': [
                                {type: 'floating-ip-pools',
                                fields: ['project_back_refs']}]
                                })
                    },
                    dataParser: ctwp.fipCfgPoolDataParser
                }
            };
            var contrailListModel = new ContrailListModel(listModelConfig);
            this.renderView4Config(this.$el, contrailListModel, getFipCfgListViewConfig(viewConfig));
        }
    });

    var getFipCfgListViewConfig = function (viewConfig) {
        return {
            elementId:
                cowu.formatElementId([ctwc.CONFIG_FIP_POOL_FORMAT_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId:
                                    ctwc.CONFIG_FIP_POOL_LIST_VIEW_ID,
                                title: ctwl.CONFIG_FIP_POOL_TITLE,
                                view: "fipPoolCfgGridView",
                                viewPathPrefix:
                                    "config/networking/fippool/ui/js/views/",
                                app: cowc.APP_CONTRAIL_CONTROLLER,
                                viewConfig: {
                                    parentType: 'project',
                                    pagerOptions: {
                                      options: {
                                         pageSize: 50,
                                         pageSizeSelect: [10, 50, 100, 500]
                                         }
                                    },
                                    selectedProjectId : viewConfig.selectedProjectId
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };

    return fipCfgListView;
});
