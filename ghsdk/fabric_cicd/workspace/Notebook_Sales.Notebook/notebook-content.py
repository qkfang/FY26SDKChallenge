# Fabric notebook source

# METADATA ********************

# META {
# META   "kernel_info": {
# META     "name": "synapse_pyspark"
# META   },
# META   "dependencies": {}
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 1 – Connect to Fabric SQL using AAD token
# ─────────────────────────────────────────────
import os
import struct

import pandas as pd
import pyodbc
from IPython.display import display
from notebookutils import mssparkutils

# Fabric SQL endpoint — update these to match your workspace
FABRIC_SERVER   = os.environ.get("FABRIC_SQL_SERVER",   "zylcdhpgv7uezc6dy7d3ngcwyi-kmmmko2hhaeunmdplvelcbfeyu.database.fabric.microsoft.com")
FABRIC_DATABASE = os.environ.get("FABRIC_SQL_DATABASE", "FSI_DB_01-0dbbbcd5-5c8b-4667-94d4-915037183d73")

# Acquire an AAD token scoped to Azure SQL / Fabric SQL
token       = mssparkutils.credentials.getToken("https://database.windows.net/")
token_bytes = token.encode("UTF-16-LE")
token_struct = struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

conn = pyodbc.connect(
    f"Driver={{ODBC Driver 18 for SQL Server}};"
    f"Server={FABRIC_SERVER};"
    f"Database={FABRIC_DATABASE};",
    attrs_before={1256: token_struct},
)
cursor = conn.cursor()
print(f"Connected to {FABRIC_DATABASE} on {FABRIC_SERVER} ✓")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 2 – Seed test data for Top Customers query
# Inserts 10 customers + matching sales orders so the
# revenue query returns meaningful results.
# Run the cleanup cell at the end to remove this data.
# ─────────────────────────────────────────────

test_customers = [
    ("Alice",  "Chen",     "Tailspin Traders",     "alice.chen@tailspin.com",       "206-555-0201"),
    ("Bob",    "Patel",    "Northwind Traders",    "bob.patel@northwind.com",        "425-555-0202"),
    ("Carol",  "Smith",    "Fabrikam Inc",         "carol.smith@fabrikam.com",       "253-555-0203"),
    ("David",  "Kim",      "Contoso Electronics",  "david.kim@contoso-elec.com",     "360-555-0204"),
    ("Eva",    "Johnson",  "Adventure Works",      "eva.johnson@adventure.com",      "509-555-0205"),
    ("Frank",  "Lopez",    "Fourth Coffee",        "frank.lopez@fourthcoffee.com",   "206-555-0206"),
    ("Grace",  "Williams", "Proseware Inc",        "grace.williams@proseware.com",   "425-555-0207"),
    ("Henry",  "Brown",    "Woodgrove Bank",       "henry.brown@woodgrove.com",      "253-555-0208"),
    ("Iris",   "Davis",    "Lucerne Publishing",   "iris.davis@lucerne.com",         "360-555-0209"),
    ("James",  "Wilson",   "Graphic Design Inst",  "james.wilson@graphicdesign.com", "509-555-0210"),
]

# Revenue profile per customer: list of SubTotal values (one entry = one order)
orders_per_customer = [
    [48500.00, 32000.00, 21000.00],  # Alice  → ~$101 500
    [44000.00, 28000.00],            # Bob    → ~$ 72 000
    [39000.00, 25000.00, 18000.00],  # Carol  → ~$ 82 000
    [35000.00, 22000.00],            # David  → ~$ 57 000
    [30000.00, 19000.00, 12000.00],  # Eva    → ~$ 61 000
    [27000.00, 15000.00],            # Frank  → ~$ 42 000
    [24000.00, 14000.00,  9500.00],  # Grace  → ~$ 47 500
    [21000.00, 11000.00],            # Henry  → ~$ 32 000
    [18500.00,  9000.00,  6000.00],  # Iris   → ~$ 33 500
    [16000.00,  8000.00],            # James  → ~$ 24 000
]

seed_customer_ids = []
for first, last, company, email, phone in test_customers:
    cursor.execute(
        """
        INSERT INTO SalesLT.Customer
            (NameStyle, FirstName, LastName, CompanyName,
             EmailAddress, Phone, PasswordHash, PasswordSalt)
        OUTPUT INSERTED.CustomerID
        VALUES (0, ?, ?, ?, ?, ?, 'AL5GmDvR4s4=', 'HFEdB5A=')
        """,
        first, last, company, email, phone,
    )
    seed_customer_ids.append(int(cursor.fetchone()[0]))
conn.commit()
print(f"Inserted {len(seed_customer_ids)} test customers → IDs: {seed_customer_ids}")

seed_order_ids = []
for cust_id, subtotals in zip(seed_customer_ids, orders_per_customer):
    for subtotal in subtotals:
        tax     = round(subtotal * 0.08, 2)
        freight = round(subtotal * 0.02, 2)
        cursor.execute(
            """
            INSERT INTO SalesLT.SalesOrderHeader
                (DueDate, CustomerID, ShipMethod, SubTotal, TaxAmt, Freight)
            OUTPUT INSERTED.SalesOrderID
            VALUES
                (DATEADD(DAY, 14, GETDATE()), ?, 'CARGO TRANSPORT 5', ?, ?, ?)
            """,
            cust_id, subtotal, tax, freight,
        )
        seed_order_ids.append(int(cursor.fetchone()[0]))
conn.commit()
print(f"Inserted {len(seed_order_ids)} test sales orders → IDs: {seed_order_ids}")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 3 – Top 10 Customers by Total Revenue
# ─────────────────────────────────────────────
sql_top_customers = """
SELECT TOP 10
    c.CustomerID,
    c.FirstName + ' ' + c.LastName  AS CustomerName,
    c.CompanyName,
    COUNT(DISTINCT soh.SalesOrderID)        AS TotalOrders,
    ROUND(SUM(soh.SubTotal), 2)             AS TotalRevenue
FROM SalesLT.Customer            c
JOIN SalesLT.SalesOrderHeader    soh ON c.CustomerID = soh.CustomerID
GROUP BY c.CustomerID, c.FirstName, c.LastName, c.CompanyName
ORDER BY TotalRevenue DESC;
"""

df_top_customers = pd.read_sql(sql_top_customers, conn)
print("=== Top 10 Customers by Revenue ===")
display(df_top_customers)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 4 – Monthly Sales Trend (current year)
# ─────────────────────────────────────────────
sql_monthly_sales = """
SELECT
    YEAR(OrderDate)  AS OrderYear,
    MONTH(OrderDate) AS OrderMonth,
    COUNT(*)                         AS TotalOrders,
    ROUND(SUM(SubTotal), 2)          AS SubTotal,
    ROUND(SUM(TaxAmt),   2)          AS TaxAmount,
    ROUND(SUM(SubTotal), 2)          AS TotalRevenue
FROM SalesLT.SalesOrderHeader
GROUP BY YEAR(OrderDate), MONTH(OrderDate)
ORDER BY OrderYear, OrderMonth;
"""

df_monthly = pd.read_sql(sql_monthly_sales, conn)
print("=== Monthly Sales Trend ===")
display(df_monthly)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 5 – Revenue by Product Category
# ─────────────────────────────────────────────
sql_category_revenue = """
SELECT
    pc.Name                             AS Category,
    COUNT(DISTINCT sod.SalesOrderID)    AS TotalOrders,
    SUM(sod.OrderQty)                   AS UnitsSold,
    ROUND(SUM(sod.UnitPrice), 2)        AS CategoryRevenue
FROM SalesLT.ProductCategory     pc
JOIN SalesLT.Product             p   ON pc.ProductCategoryID = p.ProductCategoryID
JOIN SalesLT.SalesOrderDetail    sod ON p.ProductID          = sod.ProductID
GROUP BY pc.Name
ORDER BY CategoryRevenue DESC;
"""

df_categories = pd.read_sql(sql_category_revenue, conn)
print("=== Revenue by Product Category ===")
display(df_categories)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 6 – Top 10 Best-Selling Products
# ─────────────────────────────────────────────
sql_best_sellers = """
SELECT TOP 10
    p.ProductID,
    p.Name                          AS ProductName,
    p.ProductNumber,
    p.Color,
    p.ListPrice,
    SUM(sod.OrderQty)               AS TotalUnitsSold,
    ROUND(SUM(sod.LineTotal), 2)    AS TotalRevenue
FROM SalesLT.Product             p
JOIN SalesLT.SalesOrderDetail    sod ON p.ProductID = sod.ProductID
GROUP BY p.ProductID, p.Name, p.ProductNumber, p.Color, p.ListPrice
ORDER BY TotalUnitsSold DESC;
"""

df_best_sellers = pd.read_sql(sql_best_sellers, conn)
print("=== Top 10 Best-Selling Products ===")
display(df_best_sellers)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 7 – Average Order Value by Customer Segment
# ─────────────────────────────────────────────
sql_aov = """
SELECT
    CASE
        WHEN SUM(TotalDue) >= 50000 THEN 'High Value'
        WHEN SUM(TotalDue) >= 10000 THEN 'Mid Value'
        ELSE 'Entry Level'
    END                             AS CustomerSegment,
    COUNT(DISTINCT CustomerID)      AS CustomerCount,
    ROUND(AVG(TotalDue), 2)         AS AvgOrderValue,
    ROUND(SUM(TotalDue), 2)         AS SegmentRevenue
FROM SalesLT.SalesOrderHeader
GROUP BY CustomerID
ORDER BY SegmentRevenue DESC;
"""

df_aov = pd.read_sql(sql_aov, conn)
# Re-aggregate at segment level
df_segment = (
    df_aov.groupby("CustomerSegment")
    .agg(CustomerCount=("CustomerCount", "sum"),
         AvgOrderValue=("AvgOrderValue", "mean"),
         SegmentRevenue=("SegmentRevenue", "sum"))
    .reset_index()
)
print("=== Customer Segment Summary ===")
display(df_segment)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 8 – INSERT: Add a new customer
# ─────────────────────────────────────────────
sql_insert_customer = """
INSERT INTO SalesLT.Customer
    (NameStyle, FirstName, LastName, CompanyName,
     EmailAddress, Phone, PasswordHash, PasswordSalt)
VALUES
    (0, 'Jane', 'Demo', 'Contoso Ltd',
     'jane.demo@contoso.com', '425-555-0199',
     'AL5GmDvR4s4=', 'HFEdB5A=');
"""

cursor.execute(sql_insert_customer)
conn.commit()

# Retrieve the new record to confirm
cursor.execute(
    "SELECT CustomerID, FirstName, LastName, CompanyName, EmailAddress "
    "FROM SalesLT.Customer WHERE EmailAddress = 'jane.demo@contoso.com'"
)
row = cursor.fetchone()
print("=== Inserted Customer ===")
print(f"CustomerID={row.CustomerID}  Name={row.FirstName} {row.LastName}  Company={row.CompanyName}")
new_customer_id = row.CustomerID

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 9 – UPDATE: Change the new customer's phone
# ─────────────────────────────────────────────
sql_update_customer = """
UPDATE SalesLT.Customer
SET    Phone = '206-555-0101',
       ModifiedDate = GETDATE()
WHERE  CustomerID = ?;
"""

cursor.execute(sql_update_customer, new_customer_id)
conn.commit()
print(f"Updated CustomerID {new_customer_id} – Phone changed to 206-555-0101")

# Verify change
cursor.execute(
    "SELECT CustomerID, Phone FROM SalesLT.Customer WHERE CustomerID = ?",
    new_customer_id
)
row = cursor.fetchone()
print(f"Verified Phone: {row.Phone}")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 10 – DELETE: Remove the demo customer
# ─────────────────────────────────────────────
sql_delete_customer = "DELETE FROM SalesLT.Customer WHERE CustomerID = ?;"

cursor.execute(sql_delete_customer, new_customer_id)
conn.commit()
print(f"Deleted demo CustomerID {new_customer_id} – cleanup complete")

# Confirm deletion
cursor.execute(
    "SELECT COUNT(*) FROM SalesLT.Customer WHERE CustomerID = ?",
    new_customer_id
)
count = cursor.fetchone()[0]
print(f"Rows remaining for CustomerID {new_customer_id}: {count}")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 11 – Products with Low Stock / No Recent Orders
# ─────────────────────────────────────────────
sql_no_recent_orders = """
SELECT
    p.ProductID,
    p.Name          AS ProductName,
    p.ProductNumber,
    p.ListPrice,
    p.SellStartDate,
    p.SellEndDate,
    ISNULL(CONVERT(VARCHAR(20), latest.LastOrderDate, 23), 'Never') AS LastOrderDate
FROM SalesLT.Product p
LEFT JOIN (
    SELECT
        sod.ProductID,
        MAX(soh.OrderDate) AS LastOrderDate
    FROM SalesLT.SalesOrderDetail sod
    JOIN SalesLT.SalesOrderHeader soh ON sod.SalesOrderID = soh.SalesOrderID
    GROUP BY sod.ProductID
) latest ON p.ProductID = latest.ProductID
WHERE latest.LastOrderDate IS NULL
   OR latest.LastOrderDate < DATEADD(YEAR, -1, GETDATE())
ORDER BY p.ListPrice DESC;
"""

df_stale = pd.read_sql(sql_no_recent_orders, conn)
print(f"=== Products with No Orders in Last 12 Months ({len(df_stale)} rows) ===")
display(df_stale.head(20))

# Close connection
cursor.close()
conn.close()
print("\nConnection closed.")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 12 – Cleanup: Remove seed test data
# Deletes the orders and customers inserted in Cell 2.
# Run this cell after verifying the Top Customers query.
# ─────────────────────────────────────────────

# Re-open connection for cleanup (Cell 11 closes it)
token2        = mssparkutils.credentials.getToken("https://database.windows.net/")
token2_bytes  = token2.encode("UTF-16-LE")
token2_struct = struct.pack(f"<I{len(token2_bytes)}s", len(token2_bytes), token2_bytes)

conn2   = pyodbc.connect(
    f"Driver={{ODBC Driver 18 for SQL Server}};"
    f"Server={FABRIC_SERVER};"
    f"Database={FABRIC_DATABASE};",
    attrs_before={1256: token2_struct},
)
cursor2 = conn2.cursor()

# Delete seeded orders first (FK constraint)
if seed_order_ids:
    placeholders = ",".join(["?"] * len(seed_order_ids))
    cursor2.execute(
        f"DELETE FROM SalesLT.SalesOrderHeader WHERE SalesOrderID IN ({placeholders})",
        *seed_order_ids,
    )
    print(f"Deleted {cursor2.rowcount} seeded sales orders.")

# Delete seeded customers
if seed_customer_ids:
    placeholders = ",".join(["?"] * len(seed_customer_ids))
    cursor2.execute(
        f"DELETE FROM SalesLT.Customer WHERE CustomerID IN ({placeholders})",
        *seed_customer_ids,
    )
    print(f"Deleted {cursor2.rowcount} seeded customers.")

conn2.commit()
cursor2.close()
conn2.close()
print("Seed data cleanup complete.")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }
