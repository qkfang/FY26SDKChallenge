---
name: fabric-report
description: "Create and manage Microsoft Fabric Power BI Reports in PBIR format. Covers report.json, page layouts, visual definitions, themes, and .platform config. USE FOR: create Fabric report, Power BI report, PBIR format, report.json, page layout, visual definition, report theme, report pages, Fabric report CI/CD, chart visual, table visual, card visual. DO NOT USE FOR: deploying reports (use fabric-deployment), semantic model definitions (use fabric-semantic-model), lakehouse schemas (use fabric-lakehouse)."
---

# Fabric Report Skill

> Authoritative guidance for authoring Microsoft Fabric Power BI Reports in PBIR format stored in Git-integrated workspaces.

## Triggers

- User asks to create or modify a Fabric Report
- User asks about Power BI report definition format (PBIR)
- User asks about report pages, visuals, or themes
- User asks about report.json, pages.json, or visual.json

## Rules

1. **File structure** — Each report lives in a folder named `<DisplayName>.Report/` containing:
   - `.platform` — JSON metadata with `type: "Report"`, `displayName`, and `config.logicalId`
   - `definition.pbir` — Report definition reference linking to a semantic model
   - `definition/` — Report definition directory:
     - `report.json` — Report-level settings
     - `version.json` — Schema version
     - `pages/pages.json` — Page listing
     - `pages/<pageId>/page.json` — Individual page definitions
     - `pages/<pageId>/visuals/<visualId>/visual.json` — Visual definitions
   - `StaticResources/SharedResources/BaseThemes/<theme>.json` — Report themes

2. **`.platform` schema**:
   ```json
   {
     "$schema": "https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json",
     "metadata": {
       "type": "Report",
       "displayName": "<name>"
     },
     "config": {
       "version": "2.0",
       "logicalId": "<unique-guid>"
     }
   }
   ```

3. **definition.pbir format** — Links the report to its semantic model:
   ```json
   {
     "version": "4.0",
     "datasetReference": {
       "byPath": null,
       "byConnection": {
         "connectionString": null,
         "pbiServiceModelId": null,
         "pbiModelVirtualServerName": "sobe_wowvirtualserver",
         "pbiModelDatabaseName": "<semantic-model-guid>",
         "name": "EntityDataSource",
         "connectionType": "pbiServiceXmlaStyleLive"
       }
     }
   }
   ```

4. **version.json** — Declares the report schema version:
   ```json
   {
     "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/version/1.0.0/schema.json",
     "version": "4.0"
   }
   ```

5. **Page structure** — Pages are defined by:
   - `pages/pages.json` — Array of page references with `id` (hex string) and `displayName`
   - `pages/<pageId>/page.json` — Page configuration with width, height, display options
   - `pages/<pageId>/visuals/<visualId>/visual.json` — Individual visual configs

6. **pages.json format**:
   ```json
   {
     "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pages/1.0.0/schema.json",
     "pages": [
       {
         "id": "<20-char-hex-string>",
         "displayName": "Sales Overview"
       }
     ]
   }
   ```

7. **Page ID** — Use a 20-character lowercase hex string (e.g., `863c9c5f403b402c5740`).

8. **Visual ID** — Use a 20-character lowercase hex string (e.g., `81ccad520580c297ada4`).

9. **Report themes** — Custom themes are stored in `StaticResources/SharedResources/BaseThemes/` as JSON files following the Power BI theme schema.

10. **Force-republish** — When the underlying semantic model changes storage mode, reports must be deleted and re-created alongside the model. The deployment script handles this via the `FORCE_REPUBLISH` flag.

11. **Deployment order** — Reports depend on SemanticModels, which depend on Lakehouses. Deploy in order: Lakehouse → Notebook → SemanticModel → Report.

## Visual Types

| Visual Type | Use Case |
|-------------|----------|
| `barChart` | Compare categories |
| `columnChart` | Compare categories vertically |
| `lineChart` | Show trends over time |
| `pieChart` | Show proportions |
| `card` | Display single KPI value |
| `multiRowCard` | Display multiple KPI values |
| `table` | Show tabular data |
| `matrix` | Pivot table with row/column groups |
| `slicer` | Filter control |
| `map` | Geographic data visualization |

## Output

- `<Name>.Report/.platform` — Platform metadata JSON
- `<Name>.Report/definition.pbir` — Semantic model reference
- `<Name>.Report/definition/report.json` — Report settings
- `<Name>.Report/definition/version.json` — Schema version
- `<Name>.Report/definition/pages/pages.json` — Page listing
- `<Name>.Report/definition/pages/<id>/page.json` — Page config
- `<Name>.Report/definition/pages/<id>/visuals/<id>/visual.json` — Visual configs
- `<Name>.Report/StaticResources/SharedResources/BaseThemes/<theme>.json` — Theme
