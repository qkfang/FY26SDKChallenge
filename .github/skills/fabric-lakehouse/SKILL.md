---
name: fabric-lakehouse
description: "Create and manage Microsoft Fabric Lakehouses with Delta tables, OneLake shortcuts, and schema definitions. Covers lakehouse.metadata.json, shortcuts.metadata.json, .platform config, and table schemas. USE FOR: create Fabric lakehouse, Delta Lake tables, OneLake shortcuts, lakehouse schema, lakehouse metadata, table columns, Fabric storage, lakehouse CI/CD, dbo schema, shortcut config. DO NOT USE FOR: deploying lakehouses (use fabric-deployment), querying data (use fabric-notebook), semantic models on lakehouse (use fabric-semantic-model)."
---

# Fabric Lakehouse Skill

> Authoritative guidance for authoring Microsoft Fabric Lakehouse definitions stored in Git-integrated workspaces.

## Triggers

- User asks to create or modify a Fabric Lakehouse
- User asks about Delta table schemas in Fabric
- User asks about OneLake shortcuts
- User asks about lakehouse.metadata.json or shortcuts.metadata.json

## Rules

1. **File structure** — Each lakehouse lives in a folder named `<DisplayName>.Lakehouse/` containing:
   - `.platform` — JSON metadata with `type: "Lakehouse"`, `displayName`, and `config.logicalId`
   - `lakehouse.metadata.json` — Table schema definitions
   - `shortcuts.metadata.json` — OneLake shortcut configurations

2. **`.platform` schema** — Must reference the Fabric Git integration schema:
   ```json
   {
     "$schema": "https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json",
     "metadata": {
       "type": "Lakehouse",
       "displayName": "<name>"
     },
     "config": {
       "version": "2.0",
       "logicalId": "<unique-guid>"
     }
   }
   ```

3. **Table schema format** — `lakehouse.metadata.json` defines tables with columns, data types, and nullability:
   ```json
   {
     "defaultSchema": "dbo",
     "tables": [
       {
         "name": "Customer",
         "schema": "dbo",
         "columns": [
           { "name": "CustomerID", "dataType": "int", "isNullable": false },
           { "name": "FirstName",  "dataType": "string", "isNullable": false },
           { "name": "Email",      "dataType": "string", "isNullable": true }
         ]
       }
     ]
   }
   ```

4. **Supported data types** — Use these data types in column definitions:
   - `int` — Integer values
   - `long` — 64-bit integers
   - `string` — Text values
   - `decimal(p,s)` — Decimal with precision and scale (e.g., `decimal(10,4)`)
   - `date` — Date values
   - `datetime` — Date and time values
   - `boolean` — True/false values

5. **Shortcuts format** — `shortcuts.metadata.json` is an array of shortcut definitions:
   ```json
   [
     {
       "name": "publicholidays",
       "path": "/Tables/dbo",
       "target": {
         "type": "OneLake",
         "oneLake": {
           "path": "Tables/dbo/publicholidays",
           "itemId": "<lakehouse-guid>",
           "workspaceId": "<workspace-guid>",
           "artifactType": "Lakehouse"
         }
       }
     }
   ]
   ```

6. **Shortcut paths** — Shortcuts can target:
   - `/Tables/dbo` — For table-level shortcuts (Delta tables)
   - `/Files` — For file-level shortcuts (unstructured data)

7. **Cross-workspace references** — Shortcuts reference items by `workspaceId` and `itemId` GUIDs. These values are parameterized via `config/parameter.yml` for multi-environment deployments.

8. **Deployment order** — Lakehouses must be deployed before Notebooks, SemanticModels, and Reports that depend on them. The `fabric-cicd` library handles this ordering via the `item_type_in_scope` list: `["Lakehouse", "Notebook", "SemanticModel", "Report"]`.

## Table Design Guidelines

| Guideline | Description |
|-----------|-------------|
| Primary keys | Use `int` or `long` with `isNullable: false` for ID columns |
| Foreign keys | Match the data type of the referenced primary key column |
| Naming | Use PascalCase for table and column names |
| Schema | Default to `dbo` schema |
| Decimals | Use `decimal(10,2)` for currency, `decimal(10,4)` for costs/rates |

## Output

- `<Name>.Lakehouse/.platform` — Platform metadata JSON
- `<Name>.Lakehouse/lakehouse.metadata.json` — Table schemas
- `<Name>.Lakehouse/shortcuts.metadata.json` — OneLake shortcuts (optional)
