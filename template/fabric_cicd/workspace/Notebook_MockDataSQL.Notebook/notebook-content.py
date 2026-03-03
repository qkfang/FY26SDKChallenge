# Fabric notebook source

# METADATA ********************

# META {
# META   "kernel_info": {
# META     "name": "synapse_pyspark"
# META   },
# META   "dependencies": {
# META     "sqlDatabase": {
# META       "default_database": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
# META       "default_database_name": "fabricdb",
# META       "default_database_workspace_id": ""
# META     }
# META   }
# META }

# PARAMETERS CELL ********************

# sql_server: FQDN of the Fabric SQL Database endpoint
# (e.g. <workspace-id>.datawarehouse.fabric.microsoft.com)
sql_server   = ""
sql_database = "fabricdb"

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 1 – Connection setup
# ─────────────────────────────────────────────
import struct
import pyodbc
import notebookutils

# Auto-discover the SQL endpoint when no parameter is supplied
if not sql_server:
    import sempy.fabric as fabric
    workspace_id = fabric.get_workspace_id()
    items = fabric.list_items()
    db_row = items[items["Type"] == "SQLDatabase"].iloc[0]
    sql_server = f"{workspace_id}.datawarehouse.fabric.microsoft.com"
    sql_database = db_row["Display Name"]

token = notebookutils.credentials.getToken("https://database.windows.net/.default")
token_bytes = bytes(token, "utf-8")
token_struct = struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

conn = pyodbc.connect(
    f"Driver={{ODBC Driver 18 for SQL Server}};"
    f"Server={sql_server};"
    f"Database={sql_database};"
    f"Encrypt=yes;TrustServerCertificate=no;",
    attrs_before={1256: token_struct}
)
conn.autocommit = False
cursor = conn.cursor()
print(f"Connected to {sql_server}/{sql_database}")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 2 – SalesLT.ProductCategory
# ─────────────────────────────────────────────
cursor.execute("DELETE FROM [SalesLT].[SalesOrderDetail]")
cursor.execute("DELETE FROM [SalesLT].[SalesOrderHeader]")
cursor.execute("DELETE FROM [SalesLT].[CustomerAddress]")
cursor.execute("DELETE FROM [SalesLT].[Product]")
cursor.execute("DELETE FROM [SalesLT].[ProductCategory]")
cursor.execute("DELETE FROM [SalesLT].[ProductModel]")
cursor.execute("DELETE FROM [SalesLT].[Customer]")
cursor.execute("DELETE FROM [SalesLT].[Address]")
conn.commit()

cursor.execute("SET IDENTITY_INSERT [SalesLT].[ProductCategory] ON")
cursor.executemany(
    "INSERT INTO [SalesLT].[ProductCategory] (ProductCategoryID, ParentProductCategoryID, Name) VALUES (?,?,?)",
    [
        (1,  None, "Bikes"),
        (2,  None, "Components"),
        (3,  None, "Clothing"),
        (4,  None, "Accessories"),
        (5,  1,    "Mountain Bikes"),
        (6,  1,    "Road Bikes"),
        (7,  1,    "Touring Bikes"),
        (8,  2,    "Handlebars"),
        (9,  2,    "Bottom Brackets"),
        (10, 2,    "Brakes"),
        (11, 2,    "Derailleurs"),
        (12, 2,    "Forks"),
        (13, 2,    "Headsets"),
        (14, 3,    "Bib-Shorts"),
        (15, 3,    "Caps"),
        (16, 3,    "Gloves"),
        (17, 3,    "Jerseys"),
        (18, 3,    "Shorts"),
        (19, 3,    "Socks"),
        (20, 3,    "Tights"),
        (21, 3,    "Vests"),
        (22, 4,    "Bike Racks"),
        (23, 4,    "Bike Stands"),
        (24, 4,    "Bottles and Cages"),
        (25, 4,    "Cleaners"),
        (26, 4,    "Fenders"),
        (27, 4,    "Helmets"),
        (28, 4,    "Hydration Packs"),
        (29, 4,    "Lights"),
        (30, 4,    "Locks"),
        (31, 4,    "Panniers"),
        (32, 4,    "Pumps"),
        (33, 4,    "Tires and Tubes"),
    ]
)
cursor.execute("SET IDENTITY_INSERT [SalesLT].[ProductCategory] OFF")
conn.commit()
print("ProductCategory: 33 rows written")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 3 – SalesLT.ProductModel
# ─────────────────────────────────────────────
cursor.execute("SET IDENTITY_INSERT [SalesLT].[ProductModel] ON")
cursor.executemany(
    "INSERT INTO [SalesLT].[ProductModel] (ProductModelID, Name) VALUES (?,?)",
    [
        (6,  "HL Road Frame"),
        (19, "Mountain-200"),
        (25, "Road-150"),
        (35, "Sport-100"),
        (43, "Mountain Frame - Black"),
        (58, "AWC Logo Cap"),
        (63, "Long-Sleeve Logo Jersey"),
        (67, "Mountain Bike Socks"),
    ]
)
cursor.execute("SET IDENTITY_INSERT [SalesLT].[ProductModel] OFF")
conn.commit()
print("ProductModel: 8 rows written")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 4 – SalesLT.Product
# ─────────────────────────────────────────────
from datetime import date

cursor.execute("SET IDENTITY_INSERT [SalesLT].[Product] ON")
cursor.executemany(
    """INSERT INTO [SalesLT].[Product]
       (ProductID, Name, ProductNumber, Color, StandardCost, ListPrice,
        Size, ProductCategoryID, ProductModelID, SellStartDate)
       VALUES (?,?,?,?,?,?,?,?,?,?)""",
    [
        (680, "HL Road Frame - Black, 58",   "FR-R92B-58", "Black", 1059.31,  1431.50, "58", 6,  6,  date(2002, 6, 1)),
        (706, "HL Road Frame - Red, 58",     "FR-R92R-58", "Red",   1059.31,  1431.50, "58", 6,  6,  date(2002, 6, 1)),
        (707, "Sport-100 Helmet, Red",       "HL-U509-R",  "Red",     13.09,    34.99, None, 27, 35, date(2005, 7, 1)),
        (708, "Sport-100 Helmet, Black",     "HL-U509",    "Black",   13.09,    34.99, None, 27, 35, date(2005, 7, 1)),
        (709, "Mountain Bike Socks, M",      "SO-B909-M",  "White",    3.40,     9.50, "M",  19, 67, date(2005, 7, 1)),
        (710, "Mountain Bike Socks, L",      "SO-B909-L",  "White",    3.40,     9.50, "L",  19, 67, date(2005, 7, 1)),
        (711, "Sport-100 Helmet, Blue",      "HL-U509-B",  "Blue",    13.09,    34.99, None, 27, 35, date(2005, 7, 1)),
        (712, "AWC Logo Cap",                "CA-1098",    "Multi",    6.92,     8.99, None, 15, 58, date(2005, 7, 1)),
        (713, "Long-Sleeve Logo Jersey, S",  "LJ-0192-S",  "Multi",   38.49,    49.99, "S",  17, 63, date(2005, 9, 1)),
        (714, "Long-Sleeve Logo Jersey, L",  "LJ-0192-L",  "Multi",   38.49,    49.99, "L",  17, 63, date(2005, 9, 1)),
        (715, "Long-Sleeve Logo Jersey, XL", "LJ-0192-X",  "Multi",   38.49,    49.99, "XL", 17, 63, date(2005, 9, 1)),
        (716, "Road Frame - Red, 48",        "FR-R92R-48", "Red",    352.15,  1431.50, "48", 6,  6,  date(2005, 6, 1)),
        (717, "Road Frame - Red, 44",        "FR-R92R-44", "Red",    352.15,  1431.50, "44", 6,  6,  date(2005, 6, 1)),
        (718, "Mountain Frame - Black, 48",  "FR-M94B-48", "Black",  224.95,   539.99, "48", 5,  43, date(2005, 6, 1)),
        (722, "Mountain-200 Black, 38",      "BK-M68B-38", "Black", 1251.00,  2319.99, "38", 5,  19, date(2005, 6, 1)),
    ]
)
cursor.execute("SET IDENTITY_INSERT [SalesLT].[Product] OFF")
conn.commit()
print("Product: 15 rows written")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 5 – SalesLT.Address
# ─────────────────────────────────────────────
cursor.execute("SET IDENTITY_INSERT [SalesLT].[Address] ON")
cursor.executemany(
    """INSERT INTO [SalesLT].[Address]
       (AddressID, AddressLine1, City, StateProvince, CountryRegion, PostalCode)
       VALUES (?,?,?,?,?,?)""",
    [
        ( 1, "2251 Elliot Avenue",     "Seattle",       "Washington",    "US", "98104"),
        ( 2, "3207 S Grady Way",       "Portland",      "Oregon",        "US", "97201"),
        ( 3, "2840 Northup Way",       "San Francisco",  "California",   "US", "94107"),
        ( 4, "7700 Leetsdale Drive",   "Los Angeles",   "California",    "US", "90001"),
        ( 5, "4350 Tuweap Drive",      "Phoenix",       "Arizona",       "US", "85001"),
        ( 6, "2229 West Mountain View","Chicago",        "Illinois",     "US", "60601"),
        ( 7, "15 Rare Court",          "Houston",       "Texas",         "US", "77001"),
        ( 8, "26910 Indela Road",      "Dallas",        "Texas",         "US", "75201"),
        ( 9, "636 Vine Hill Way",      "Denver",        "Colorado",      "US", "80201"),
        (10, "3114 Notre Dame Ave",    "Boston",        "Massachusetts", "US", "02101"),
        (11, "5500 Wayzata Blvd",      "Seattle",       "Washington",    "US", "98101"),
        (12, "15255 NE 40th Street",   "Redmond",       "Washington",    "US", "98052"),
        (13, "1234 Pacific Ave",       "Tacoma",        "Washington",    "US", "98401"),
        (14, "10001 Main Street",      "Bellevue",      "Washington",    "US", "98004"),
        (15, "321 Commerce Street",    "Spokane",       "Washington",    "US", "99201"),
    ]
)
cursor.execute("SET IDENTITY_INSERT [SalesLT].[Address] OFF")
conn.commit()
print("Address: 15 rows written")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 6 – SalesLT.Customer
# ─────────────────────────────────────────────
cursor.execute("SET IDENTITY_INSERT [SalesLT].[Customer] ON")
cursor.executemany(
    """INSERT INTO [SalesLT].[Customer]
       (CustomerID, FirstName, LastName, CompanyName, EmailAddress, Phone,
        PasswordHash, PasswordSalt)
       VALUES (?,?,?,?,?,?,?,?)""",
    [
        ( 1, "Orlando",  "Gee",       "A Bike Store",              "orlando0@adventure-works.com",  "245-555-0173", "n/a", "n/a"),
        ( 2, "Keith",    "Harris",    "Bike World",                "keith0@adventure-works.com",    "170-555-0127", "n/a", "n/a"),
        ( 3, "Donna",    "Carreras",  "Connected Bikes",           "donna0@adventure-works.com",    "279-555-0130", "n/a", "n/a"),
        ( 4, "Janet",    "Gates",     "Futuristic Bikes",          "janet0@adventure-works.com",    "710-555-0173", "n/a", "n/a"),
        ( 5, "Lucy",     "Harrington","Metro Sports",              "lucy0@adventure-works.com",     "928-555-0109", "n/a", "n/a"),
        ( 6, "Rosmarie", "Carroll",   "Online Bike Catalog",       "rosmarie0@adventure-works.com", "244-555-0166", "n/a", "n/a"),
        ( 7, "Dominic",  "Gash",      "Pedal Pushers",             "dominic0@adventure-works.com",  "192-555-0175", "n/a", "n/a"),
        ( 8, "Kathleen", "Garza",     "Proxatier Inc",             "kathleen0@adventure-works.com", "150-555-0127", "n/a", "n/a"),
        ( 9, "Katherine","Harding",   "Rural Cycle Emporium",      "katherine0@adventure-works.com","926-555-0159", "n/a", "n/a"),
        (10, "Johnny",   "Caprio",    "Vigorous Exercise Company", "johnny0@adventure-works.com",   "112-555-0191", "n/a", "n/a"),
        (11, "Alice",    "Chen",      "Tailspin Traders",          "alice.chen@tailspin.com",       "206-555-0201", "n/a", "n/a"),
        (12, "Bob",      "Patel",     "Northwind Traders",         "bob.patel@northwind.com",       "425-555-0202", "n/a", "n/a"),
        (13, "Carol",    "Smith",     "Fabrikam Inc",              "carol.smith@fabrikam.com",      "253-555-0203", "n/a", "n/a"),
        (14, "David",    "Kim",       "Contoso Electronics",       "david.kim@contoso-elec.com",    "360-555-0204", "n/a", "n/a"),
        (15, "Eva",      "Johnson",   "Adventure Works",           "eva.johnson@adventure.com",     "509-555-0205", "n/a", "n/a"),
    ]
)
cursor.execute("SET IDENTITY_INSERT [SalesLT].[Customer] OFF")
conn.commit()
print("Customer: 15 rows written")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 7 – SalesLT.CustomerAddress
# ─────────────────────────────────────────────
cursor.executemany(
    """INSERT INTO [SalesLT].[CustomerAddress] (CustomerID, AddressID, AddressType)
       VALUES (?,?,?)""",
    [(i, i, "Main Office") for i in range(1, 16)]
)
conn.commit()
print("CustomerAddress: 15 rows written")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 8 – SalesLT.SalesOrderHeader (30 orders, 2024-2025)
# ─────────────────────────────────────────────
# Reset sequence so first INSERT gets SalesOrderID = 1
cursor.execute("ALTER SEQUENCE [SalesLT].[SalesOrderNumber] RESTART WITH 1")
conn.commit()

# SalesOrderID is assigned automatically via DEFAULT (NEXT VALUE FOR sequence)
orders = [
    (date(2024,  1, 15), date(2024,  1, 29),  1, 1, 1,  4803.00,  384.24,  120.08, "CARGO TRANSPORT 5", "Northwest"),
    (date(2024,  1, 22), date(2024,  2,  5),  2, 2, 2,  1431.50,  114.52,   35.79, "CARGO TRANSPORT 5", "Northwest"),
    (date(2024,  2,  1), date(2024,  2, 15),  3, 3, 3,   539.99,   43.20,   13.50, "CARGO TRANSPORT 5", "Southwest"),
    (date(2024,  2, 14), date(2024,  2, 28),  4, 4, 4,  2863.00,  229.04,   71.58, "CARGO TRANSPORT 5", "Southwest"),
    (date(2024,  2, 28), date(2024,  3, 13),  5, 5, 5,    99.98,    8.00,    2.50, "CARGO TRANSPORT 5", "Southwest"),
    (date(2024,  3,  5), date(2024,  3, 19),  6, 6, 6,  1071.98,   85.76,   26.80, "CARGO TRANSPORT 5", "Central"),
    (date(2024,  3, 18), date(2024,  4,  1),  7, 7, 7,  4295.49,  343.64,  107.39, "CARGO TRANSPORT 5", "Central"),
    (date(2024,  3, 25), date(2024,  4,  8),  8, 8, 8,   124.97,   10.00,    3.12, "CARGO TRANSPORT 5", "Central"),
    (date(2024,  4,  8), date(2024,  4, 22),  9, 9, 9,  2863.00,  229.04,   71.58, "CARGO TRANSPORT 5", "Northwest"),
    (date(2024,  4, 15), date(2024,  4, 29), 10,10,10,   539.99,   43.20,   13.50, "CARGO TRANSPORT 5", "Northeast"),
    (date(2024,  5,  3), date(2024,  5, 17), 11,11,11,  4803.00,  384.24,  120.08, "CARGO TRANSPORT 5", "Northwest"),
    (date(2024,  5, 20), date(2024,  6,  3), 12,12,12,  2863.00,  229.04,   71.58, "CARGO TRANSPORT 5", "Northwest"),
    (date(2024,  6,  1), date(2024,  6, 15), 13,13,13,  1071.98,   85.76,   26.80, "CARGO TRANSPORT 5", "Northwest"),
    (date(2024,  6, 10), date(2024,  6, 24), 14,14,14,   539.99,   43.20,   13.50, "CARGO TRANSPORT 5", "Northwest"),
    (date(2024,  6, 22), date(2024,  7,  6), 15,15,15,  4295.49,  343.64,  107.39, "CARGO TRANSPORT 5", "Northwest"),
    (date(2024,  7,  5), date(2024,  7, 19),  1, 1, 1,  1431.50,  114.52,   35.79, "CARGO TRANSPORT 5", "Northwest"),
    (date(2024,  7, 18), date(2024,  8,  1),  3, 3, 3,  2319.99,  185.60,   58.00, "CARGO TRANSPORT 5", "Southwest"),
    (date(2024,  8,  2), date(2024,  8, 16),  5, 5, 5,  1431.50,  114.52,   35.79, "CARGO TRANSPORT 5", "Southwest"),
    (date(2024,  8, 14), date(2024,  8, 28),  7, 7, 7,   539.99,   43.20,   13.50, "CARGO TRANSPORT 5", "Central"),
    (date(2024,  9,  3), date(2024,  9, 17),  9, 9, 9,  4803.00,  384.24,  120.08, "CARGO TRANSPORT 5", "Northwest"),
    (date(2024,  9, 21), date(2024, 10,  5), 11,11,11,  1071.98,   85.76,   26.80, "CARGO TRANSPORT 5", "Northwest"),
    (date(2024, 10,  7), date(2024, 10, 21), 13,13,13,  2863.00,  229.04,   71.58, "CARGO TRANSPORT 5", "Northwest"),
    (date(2024, 10, 15), date(2024, 10, 29),  2, 2, 2,   124.97,   10.00,    3.12, "CARGO TRANSPORT 5", "Northwest"),
    (date(2024, 11,  1), date(2024, 11, 15),  4, 4, 4,  4295.49,  343.64,  107.39, "CARGO TRANSPORT 5", "Southwest"),
    (date(2024, 11, 18), date(2024, 12,  2),  6, 6, 6,  1431.50,  114.52,   35.79, "CARGO TRANSPORT 5", "Central"),
    (date(2024, 12,  5), date(2024, 12, 19),  8, 8, 8,  2319.99,  185.60,   58.00, "CARGO TRANSPORT 5", "Central"),
    (date(2024, 12, 20), date(2025,  1,  3), 10,10,10,   539.99,   43.20,   13.50, "CARGO TRANSPORT 5", "Northeast"),
    (date(2025,  1,  8), date(2025,  1, 22), 12,12,12,  4803.00,  384.24,  120.08, "CARGO TRANSPORT 5", "Northwest"),
    (date(2025,  1, 22), date(2025,  2,  5), 14,14,14,  1071.98,   85.76,   26.80, "CARGO TRANSPORT 5", "Northwest"),
    (date(2025,  2, 10), date(2025,  2, 24), 15,15,15,  2863.00,  229.04,   71.58, "CARGO TRANSPORT 5", "Northwest"),
]

cursor.executemany(
    """INSERT INTO [SalesLT].[SalesOrderHeader]
       (OrderDate, DueDate, CustomerID, ShipToAddressID, BillToAddressID,
        SubTotal, TaxAmt, Freight, ShipMethod, Comment, Status, OnlineOrderFlag)
       VALUES (?,?,?,?,?,?,?,?,?,?,5,1)""",
    orders
)
conn.commit()
print("SalesOrderHeader: 30 rows written")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 9 – SalesLT.SalesOrderDetail
# ─────────────────────────────────────────────
details = [
    # OrderID 1
    ( 1,  1, 2, 722, 2319.99, 0.00),
    ( 1,  2, 3, 714,   49.99, 0.00),
    ( 1,  3, 2, 707,   34.99, 0.00),
    # OrderID 2
    ( 2,  4, 1, 716, 1431.50, 0.00),
    ( 2,  5, 2, 707,   34.99, 0.00),
    # OrderID 3
    ( 3,  6, 1, 718,  539.99, 0.00),
    # OrderID 4
    ( 4,  7, 2, 716, 1431.50, 0.00),
    ( 4,  8, 1, 708,   34.99, 0.00),
    # OrderID 5
    ( 5,  9, 5, 709,    9.50, 0.00),
    ( 5, 10, 5, 710,    9.50, 0.00),
    # OrderID 6
    ( 6, 11, 2, 714,   49.99, 0.00),
    ( 6, 12, 1, 718,  539.99, 0.05),
    # OrderID 7
    ( 7, 13, 1, 722, 2319.99, 0.00),
    ( 7, 14, 1, 706, 1431.50, 0.05),
    ( 7, 15, 2, 711,   34.99, 0.00),
    # OrderID 8
    ( 8, 16, 5, 712,    8.99, 0.05),
    ( 8, 17,10, 709,    9.50, 0.10),
    # OrderID 9
    ( 9, 18, 2, 716, 1431.50, 0.00),
    ( 9, 19, 2, 708,   34.99, 0.05),
    # OrderID 10
    (10, 20, 1, 718,  539.99, 0.00),
    # OrderID 11
    (11, 21, 2, 722, 2319.99, 0.00),
    (11, 22, 3, 715,   49.99, 0.00),
    # OrderID 12
    (12, 23, 2, 716, 1431.50, 0.00),
    (12, 24, 2, 707,   34.99, 0.00),
    # OrderID 13
    (13, 25, 2, 714,   49.99, 0.00),
    (13, 26, 1, 718,  539.99, 0.05),
    # OrderID 14
    (14, 27, 1, 718,  539.99, 0.00),
    # OrderID 15
    (15, 28, 1, 722, 2319.99, 0.00),
    (15, 29, 1, 706, 1431.50, 0.05),
    (15, 30, 2, 711,   34.99, 0.05),
    # OrderID 16
    (16, 31, 1, 716, 1431.50, 0.00),
    # OrderID 17
    (17, 32, 1, 722, 2319.99, 0.00),
    (17, 33, 1, 713,   49.99, 0.00),
    # OrderID 18
    (18, 34, 1, 716, 1431.50, 0.00),
    (18, 35, 5, 709,    9.50, 0.00),
    # OrderID 19
    (19, 36, 1, 718,  539.99, 0.00),
    # OrderID 20
    (20, 37, 2, 722, 2319.99, 0.00),
    (20, 38, 3, 714,   49.99, 0.05),
    # OrderID 21
    (21, 39, 1, 718,  539.99, 0.05),
    (21, 40, 2, 714,   49.99, 0.00),
    # OrderID 22
    (22, 41, 2, 716, 1431.50, 0.00),
    (22, 42, 1, 708,   34.99, 0.05),
    # OrderID 23
    (23, 43, 5, 709,    9.50, 0.05),
    (23, 44, 5, 710,    9.50, 0.05),
    # OrderID 24
    (24, 45, 1, 722, 2319.99, 0.00),
    (24, 46, 1, 706, 1431.50, 0.05),
    (24, 47, 2, 711,   34.99, 0.00),
    # OrderID 25
    (25, 48, 1, 716, 1431.50, 0.00),
    # OrderID 26
    (26, 49, 1, 722, 2319.99, 0.00),
    (26, 50, 1, 713,   49.99, 0.00),
    # OrderID 27
    (27, 51, 1, 718,  539.99, 0.00),
    # OrderID 28
    (28, 52, 2, 722, 2319.99, 0.00),
    (28, 53, 3, 715,   49.99, 0.05),
    # OrderID 29
    (29, 54, 1, 718,  539.99, 0.05),
    (29, 55, 2, 714,   49.99, 0.00),
    # OrderID 30
    (30, 56, 2, 716, 1431.50, 0.00),
    (30, 57, 1, 708,   34.99, 0.05),
]

rows = [
    (order_id, qty, product_id, round(price, 2), round(disc, 2))
    for order_id, _detail_id, qty, product_id, price, disc in details
]

cursor.executemany(
    """INSERT INTO [SalesLT].[SalesOrderDetail]
       (SalesOrderID, OrderQty, ProductID, UnitPrice, UnitPriceDiscount)
       VALUES (?,?,?,?,?)""",
    rows
)
conn.commit()
print(f"SalesOrderDetail: {len(rows)} rows written")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 10 – Verify row counts
# ─────────────────────────────────────────────
tables = [
    "SalesLT.ProductCategory",
    "SalesLT.ProductModel",
    "SalesLT.Product",
    "SalesLT.Address",
    "SalesLT.Customer",
    "SalesLT.CustomerAddress",
    "SalesLT.SalesOrderHeader",
    "SalesLT.SalesOrderDetail",
]
for tbl in tables:
    cursor.execute(f"SELECT COUNT(*) FROM [{tbl.split('.')[0]}].[{tbl.split('.')[1]}]")
    n = cursor.fetchone()[0]
    print(f"  {tbl}: {n} rows")

cursor.close()
conn.close()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }
