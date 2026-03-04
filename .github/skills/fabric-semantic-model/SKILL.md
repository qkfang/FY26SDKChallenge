---
name: fabric-semantic-model
description: "Create and manage Microsoft Fabric Semantic Models using TMDL (Tabular Model Definition Language). Covers Direct Lake mode, table definitions, relationships, expressions, measures, and .platform config. USE FOR: create semantic model, TMDL files, Direct Lake, model.tmdl, database.tmdl, relationships.tmdl, expressions.tmdl, table definitions, measures, DAX, Power BI dataset, Fabric semantic model CI/CD. DO NOT USE FOR: deploying models (use fabric-deployment), lakehouse schemas (use fabric-lakehouse), report visuals (use fabric-report)."
---

# Fabric Semantic Model Skill

> Authoritative guidance for authoring Microsoft Fabric Semantic Models in TMDL format stored in Git-integrated workspaces.

## Triggers

- User asks to create or modify a Fabric Semantic Model
- User asks about TMDL (Tabular Model Definition Language)
- User asks about Direct Lake mode or storage mode
- User asks about measures, relationships, or table definitions in a model
- User asks about model.tmdl, database.tmdl, expressions.tmdl, or relationships.tmdl

## Rules

1. **File structure** — Each semantic model lives in a folder named `<DisplayName>.SemanticModel/` containing:
   - `.platform` — JSON metadata with `type: "SemanticModel"`, `displayName`, and `config.logicalId`
   - `definition.pbism` — Power BI Semantic Model definition reference
   - `definition/` — TMDL files directory:
     - `model.tmdl` — Top-level model definition with table references
     - `database.tmdl` — Database compatibility settings
     - `expressions.tmdl` — Data source expressions (OneLake connection)
     - `relationships.tmdl` — Table relationships
     - `tables/<TableName>.tmdl` — Individual table definitions

2. **`.platform` schema**:
   ```json
   {
     "$schema": "https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json",
     "metadata": {
       "type": "SemanticModel",
       "displayName": "<name>"
     },
     "config": {
       "version": "2.0",
       "logicalId": "<unique-guid>"
     }
   }
   ```

3. **model.tmdl format** — Declares the model, culture, and references all tables:
   ```
   model Model
       culture: en-US
       defaultPowerBIDataSourceVersion: powerBI_V3
       sourceQueryCulture: en-US
       dataAccessOptions
           legacyRedirects
           returnErrorValuesAsNull

       annotation PBI_QueryOrder = ["DirectLake - <LakehouseName>"]
       annotation __PBI_TimeIntelligenceEnabled = 1
       annotation PBI_ProTooling = ["DirectLakeOnOneLakeInWeb"]

       ref table <TableName>
   ```

4. **expressions.tmdl format** — Defines the Direct Lake data source connection:
   ```
   expression 'DirectLake - <LakehouseName>' =
       let
           Source = AzureStorage.DataLake("https://onelake.dfs.fabric.microsoft.com/<workspaceId>/<lakehouseId>", [HierarchicalNavigation=true])
       in
           Source
       lineageTag: <guid>
       annotation PBI_IncludeFutureArtifacts = False
   ```

5. **Table TMDL format** — Each table file defines columns with data types and lineage:
   ```
   table Customer
       lineageTag: <guid>
       sourceLineageTag: [dbo].[customer]

       column CustomerID
           dataType: int64
           formatString: 0
           lineageTag: <guid>
           sourceLineageTag: CustomerID
           summarizeBy: count
           sourceColumn: CustomerID
           annotation SummarizationSetBy = Automatic

       column FirstName
           dataType: string
           lineageTag: <guid>
           sourceLineageTag: FirstName
           summarizeBy: none
           sourceColumn: FirstName
           annotation SummarizationSetBy = Automatic
   ```

6. **Relationships format** — Define foreign key relationships between tables:
   ```
   relationship <Name>
       fromColumn: <Table>.<Column>
       toColumn: <Table>.<Column>
   ```

7. **Data types in TMDL** — Map lakehouse types to TMDL types:
   | Lakehouse Type | TMDL Type | Format String |
   |----------------|-----------|---------------|
   | `int` | `int64` | `0` |
   | `long` | `int64` | `0` |
   | `string` | `string` | — |
   | `decimal(p,s)` | `decimal` | `\$#,0.00;(\$#,0.00);\$#,0.00` (currency) or `0.00` |
   | `date` | `dateTime` | date format |
   | `datetime` | `dateTime` | datetime format |
   | `boolean` | `boolean` | — |

8. **summarizeBy** — Set based on column role:
   - `count` — For ID/key columns
   - `sum` — For numeric measure columns (amounts, quantities)
   - `none` — For descriptive text columns

9. **Measures** — Add DAX measures to table definitions:
   ```
   table SalesOrderHeader
       measure 'Total Revenue' = SUM(SalesOrderDetail[LineTotal])
           formatString: \$#,0.00
           lineageTag: <guid>
   ```

10. **Force-republish** — When migrating storage modes (e.g., to Direct Lake), existing SemanticModels must be deleted and re-created. The deployment script handles this via the `FORCE_REPUBLISH` flag.

11. **Parameterization** — OneLake workspace/item GUIDs in `expressions.tmdl` must be parameterized via `config/parameter.yml` for multi-environment deployments.

## Output

- `<Name>.SemanticModel/.platform` — Platform metadata JSON
- `<Name>.SemanticModel/definition.pbism` — PBISM reference file
- `<Name>.SemanticModel/definition/model.tmdl` — Model definition
- `<Name>.SemanticModel/definition/database.tmdl` — Database settings
- `<Name>.SemanticModel/definition/expressions.tmdl` — Data source expressions
- `<Name>.SemanticModel/definition/relationships.tmdl` — Relationships
- `<Name>.SemanticModel/definition/tables/<Table>.tmdl` — Table definitions
