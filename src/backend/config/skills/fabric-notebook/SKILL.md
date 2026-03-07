---
name: fabric-notebook
description: "Create and manage Microsoft Fabric Notebooks (PySpark). Covers notebook structure, .platform metadata, cell layout, Spark session config, SQL connectivity via AAD tokens, and data seeding patterns. USE FOR: create Fabric notebook, PySpark notebook, notebook-content.py, Fabric Spark, notebook cells, notebook metadata, seed data notebook, SQL from notebook, mssparkutils, notebookutils, Fabric notebook CI/CD. DO NOT USE FOR: deploying notebooks (use fabric-deployment), lakehouse schemas (use fabric-lakehouse), semantic models (use fabric-semantic-model)."
---

# Fabric Notebook Skill

> Authoritative guidance for authoring Microsoft Fabric Notebooks stored in Git-integrated workspaces.

## Triggers

- User asks to create or modify a Fabric Notebook
- User asks about PySpark patterns in Fabric
- User asks how to connect to Fabric SQL from a notebook
- User asks about notebook-content.py structure or `.platform` metadata
- User asks about data seeding or ETL in Fabric notebooks

## Rules

1. **File structure** — Each notebook lives in a folder named `<DisplayName>.Notebook/` containing:
   - `.platform` — JSON metadata with `type: "Notebook"`, `displayName`, and `config.logicalId`
   - `notebook-content.py` — The notebook source code

2. **`.platform` schema** — Must reference `https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json`:
   ```json
   {
     "$schema": "https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json",
     "metadata": {
       "type": "Notebook",
       "displayName": "<name>"
     },
     "config": {
       "version": "2.0",
       "logicalId": "<unique-guid>"
     }
   }
   ```

3. **Notebook content format** — Uses special comment markers for metadata and cells:
   ```python
   # Fabric notebook source

   # METADATA ********************
   # META {
   # META   "kernel_info": { "name": "synapse_pyspark" },
   # META   "dependencies": {}
   # META }

   # CELL ********************
   <python code here>

   # METADATA ********************
   # META {
   # META   "language": "python",
   # META   "language_group": "synapse_pyspark"
   # META }
   ```

4. **Cell separation** — Each code block is preceded by `# CELL ********************` and followed by a `# METADATA ********************` block declaring language and language group.

5. **SQL connectivity** — Use AAD token authentication via `mssparkutils.credentials.getToken()`:
   ```python
   from notebookutils import mssparkutils
   import pyodbc, struct

   token = mssparkutils.credentials.getToken("https://database.windows.net/")
   token_bytes = token.encode("UTF-16-LE")
   token_struct = struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

   conn = pyodbc.connect(
       f"Driver={{ODBC Driver 18 for SQL Server}};"
       f"Server={server};Database={database};",
       attrs_before={1256: token_struct},
   )
   ```

6. **Environment variables** — Use `os.environ.get()` for configurable values like SQL server endpoints and database names to support parameterization across environments.

7. **Parameterization** — Notebook content supports find-replace via `config/parameter.yml` for environment-specific values (workspace IDs, SQL endpoints). Use placeholder values that match parameter.yml entries.

8. **Post-deploy execution** — Notebooks can be triggered after deployment via the Fabric REST API:
   - `POST /workspaces/{id}/items/{notebookId}/jobs/instances?jobType=RunNotebook`
   - Poll `GET /workspaces/{id}/items/{notebookId}/jobs/instances/{jobId}` until status is `Completed` or `Failed`

## Common Patterns

| Pattern | Description |
|---------|-------------|
| Data seeding | INSERT test data into Fabric SQL tables with AAD auth |
| Spark read | `spark.read.format("delta").load("Tables/dbo/<table>")` |
| Display results | `from IPython.display import display; display(df)` |
| Cross-workspace | Reference OneLake paths using workspace/item GUIDs |

## Output

- `<Name>.Notebook/.platform` — Platform metadata JSON
- `<Name>.Notebook/notebook-content.py` — Notebook Python source
