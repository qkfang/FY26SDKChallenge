import json, pathlib

report = {
  "config": json.dumps({
    "version":"5.59",
    "themeCollection":{"baseTheme":{"name":"CY24SU10","version":"5.61","type":2}},
    "activeSectionIndex":0,
    "defaultDrillFilterOtherVisuals":True,
    "linguisticSchemaSyncVersion":2,
    "settings":{
      "useNewFilterPaneExperience":True,
      "allowChangeFilterTypes":True,
      "useStylableVisualContainerHeader":True,
      "queryLimitOption":6,
      "useEnhancedTooltips":True,
      "exportDataMode":1,
      "useDefaultAggregateDisplayName":True
    },
    "objects":{"section":[{"properties":{"verticalAlignment":{"expr":{"Literal":{"Value":"'Top'"}}}}}]}
  }, separators=(',',':')),
  "layoutOptimization": 0,
  "resourcePackages": [{"resourcePackage":{"disabled":False,"items":[{"name":"CY24SU10","path":"BaseThemes/CY24SU10.json","type":202}],"name":"SharedResources","type":2}}],
  "sections": [
    {
      "config": "{}",
      "displayName": "Sales Orders",
      "displayOption": 1,
      "filters": "[]",
      "height": 720.0,
      "name": "a1b2c3d4e5f6a7b8c9d0",
      "ordinal": 0,
      "visualContainers": [
        {
          "config": json.dumps({
            "name":"b2c3d4e5f6a7b8c9d0e1",
            "layouts":[{"id":0,"position":{"x":20,"y":80,"z":0,"width":500,"height":300,"tabOrder":0}}],
            "singleVisual":{
              "visualType":"tableEx",
              "projections":{"Values":[{"queryRef":"SalesOrderHeader.SalesOrderID"},{"queryRef":"SalesOrderHeader.OrderDate"},{"queryRef":"SalesOrderHeader.CustomerID"},{"queryRef":"SalesOrderHeader.SubTotal"}]},
              "prototypeQuery":{"Version":2,"From":[{"Name":"s","Entity":"SalesOrderHeader","Type":0}],"Select":[
                {"Column":{"Expression":{"SourceRef":{"Source":"s"}},"Property":"SalesOrderID"},"Name":"SalesOrderHeader.SalesOrderID","NativeReferenceName":"SalesOrderID"},
                {"Column":{"Expression":{"SourceRef":{"Source":"s"}},"Property":"OrderDate"},"Name":"SalesOrderHeader.OrderDate","NativeReferenceName":"OrderDate"},
                {"Column":{"Expression":{"SourceRef":{"Source":"s"}},"Property":"CustomerID"},"Name":"SalesOrderHeader.CustomerID","NativeReferenceName":"CustomerID"},
                {"Column":{"Expression":{"SourceRef":{"Source":"s"}},"Property":"SubTotal"},"Name":"SalesOrderHeader.SubTotal","NativeReferenceName":"SubTotal"}
              ]},
              "drillFilterOtherVisuals":True
            }
          }, separators=(',',':')),
          "filters":"[]","height":300.0,"width":500.0,"x":20.0,"y":80.0,"z":0.0
        }
      ],
      "width": 1280.0
    },
    {
      "config": "{}",
      "displayName": "Product Revenue",
      "displayOption": 1,
      "filters": "[]",
      "height": 720.0,
      "name": "c3d4e5f6a7b8c9d0e1f2",
      "ordinal": 1,
      "visualContainers": [
        {
          "config": json.dumps({
            "name":"d4e5f6a7b8c9d0e1f2a3",
            "layouts":[{"id":0,"position":{"x":20,"y":80,"z":0,"width":500,"height":300,"tabOrder":0}}],
            "singleVisual":{
              "visualType":"tableEx",
              "projections":{"Values":[{"queryRef":"Product.Name"},{"queryRef":"Product.Color"},{"queryRef":"Product.ListPrice"}]},
              "prototypeQuery":{"Version":2,"From":[{"Name":"p","Entity":"Product","Type":0}],"Select":[
                {"Column":{"Expression":{"SourceRef":{"Source":"p"}},"Property":"Name"},"Name":"Product.Name","NativeReferenceName":"Name"},
                {"Column":{"Expression":{"SourceRef":{"Source":"p"}},"Property":"Color"},"Name":"Product.Color","NativeReferenceName":"Color"},
                {"Column":{"Expression":{"SourceRef":{"Source":"p"}},"Property":"ListPrice"},"Name":"Product.ListPrice","NativeReferenceName":"ListPrice"}
              ]},
              "drillFilterOtherVisuals":True
            }
          }, separators=(',',':')),
          "filters":"[]","height":300.0,"width":500.0,"x":20.0,"y":80.0,"z":0.0
        }
      ],
      "width": 1280.0
    }
  ]
}

out = pathlib.Path(r'c:\repo\FY26SDKChallenge\template\fabric_cicd\workspace\SalesReport.Report\report.json')
out.write_text(json.dumps(report, indent=2), encoding='utf-8')
print('written', out)
