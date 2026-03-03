# Fabric notebook source

# METADATA ********************

# META {
# META   "kernel_info": {
# META     "name": "synapse_pyspark"
# META   },
# META   "dependencies": {
# META     "lakehouse": {
# META       "default_lakehouse": "49f3e9cc-39cc-49b9-8807-0d33674b04b5",
# META       "default_lakehouse_name": "SalesLakehouse",
# META       "default_lakehouse_workspace_id": "334687d9-c5a3-4af6-a9b1-9c02bad79934"
# META     }
# META   }
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 1 – Schema: ProductCategory
# ─────────────────────────────────────────────
from pyspark.sql.types import IntegerType, StringType, StructField, StructType

schema_category = StructType([
    StructField("ProductCategoryID", IntegerType(), False),
    StructField("Name",              StringType(),  False),
])

rows_category = [
    (1, "Bikes"),
    (2, "Components"),
    (3, "Clothing"),
    (4, "Accessories"),
]

df_category = spark.createDataFrame(rows_category, schema_category)
df_category.write.format("delta").mode("overwrite").saveAsTable("productcategory")
print(f"ProductCategory: {df_category.count()} rows written")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 2 – Schema: Product (15 products, 4 categories)
# ─────────────────────────────────────────────
from decimal import Decimal
from pyspark.sql.types import DecimalType

schema_product = StructType([
    StructField("ProductID",         IntegerType(),       False),
    StructField("Name",              StringType(),        False),
    StructField("ProductNumber",     StringType(),        False),
    StructField("Color",             StringType(),        True),
    StructField("StandardCost",      DecimalType(10, 4),  False),
    StructField("ListPrice",         DecimalType(10, 2),  False),
    StructField("ProductCategoryID", IntegerType(),        False),
])

rows_product = [
    (680, "HL Road Frame - Black, 58",    "FR-R92B-58", "Black",  Decimal("1059.3100"), Decimal("1431.50"), 2),
    (706, "HL Road Frame - Red, 58",      "FR-R92R-58", "Red",    Decimal("1059.3100"), Decimal("1431.50"), 2),
    (707, "Sport-100 Helmet, Red",        "HL-U509-R",  "Red",    Decimal(  "13.0863"), Decimal(  "34.99"), 4),
    (708, "Sport-100 Helmet, Black",      "HL-U509",    "Black",  Decimal(  "13.0863"), Decimal(  "34.99"), 4),
    (709, "Mountain Bike Socks, M",       "SO-B909-M",  "White",  Decimal(   "3.3963"), Decimal(   "9.50"), 3),
    (710, "Mountain Bike Socks, L",       "SO-B909-L",  "White",  Decimal(   "3.3963"), Decimal(   "9.50"), 3),
    (711, "Sport-100 Helmet, Blue",       "HL-U509-B",  "Blue",   Decimal(  "13.0863"), Decimal(  "34.99"), 4),
    (712, "AWC Logo Cap",                 "CA-1098",    "Multi",  Decimal(   "6.9223"), Decimal(   "8.99"), 3),
    (713, "Long-Sleeve Logo Jersey, S",   "LJ-0192-S",  "Multi",  Decimal(  "38.4923"), Decimal(  "49.99"), 3),
    (714, "Long-Sleeve Logo Jersey, L",   "LJ-0192-L",  "Multi",  Decimal(  "38.4923"), Decimal(  "49.99"), 3),
    (715, "Long-Sleeve Logo Jersey, XL",  "LJ-0192-X",  "Multi",  Decimal(  "38.4923"), Decimal(  "49.99"), 3),
    (716, "Road Frame - Red, 48",         "FR-R92R-48", "Red",    Decimal( "352.1544"), Decimal("1431.50"), 2),
    (717, "Road Frame - Red, 44",         "FR-R92R-44", "Red",    Decimal( "352.1544"), Decimal("1431.50"), 2),
    (718, "Mountain Frame - Black, 48",   "FR-M94B-48", "Black",  Decimal( "224.9501"), Decimal( "539.99"), 1),
    (722, "Mountain-200 Black, 38",       "BK-M68B-38", "Black",  Decimal("1251.0000"), Decimal("2319.99"), 1),
]

df_product = spark.createDataFrame(rows_product, schema_product)
df_product.write.format("delta").mode("overwrite").saveAsTable("product")
print(f"Product: {df_product.count()} rows written")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 3 – Schema: Customer (15 customers)
# ─────────────────────────────────────────────
schema_customer = StructType([
    StructField("CustomerID",    IntegerType(), False),
    StructField("FirstName",     StringType(),  False),
    StructField("LastName",      StringType(),  False),
    StructField("CompanyName",   StringType(),  True),
    StructField("EmailAddress",  StringType(),  True),
    StructField("Phone",         StringType(),  True),
    StructField("City",          StringType(),  True),
    StructField("StateProvince", StringType(),  True),
    StructField("CountryRegion", StringType(),  True),
])

rows_customer = [
    ( 1, "Orlando",  "Gee",       "A Bike Store",              "orlando0@adventure-works.com",  "245-555-0173", "Seattle",       "WA", "US"),
    ( 2, "Keith",    "Harris",    "Bike World",                "keith0@adventure-works.com",    "170-555-0127", "Portland",      "OR", "US"),
    ( 3, "Donna",    "Carreras",  "Connected Bikes",           "donna0@adventure-works.com",    "279-555-0130", "San Francisco", "CA", "US"),
    ( 4, "Janet",    "Gates",     "Futuristic Bikes",          "janet0@adventure-works.com",    "710-555-0173", "Los Angeles",   "CA", "US"),
    ( 5, "Lucy",     "Harrington","Metro Sports",              "lucy0@adventure-works.com",     "928-555-0109", "Phoenix",       "AZ", "US"),
    ( 6, "Rosmarie", "Carroll",   "Online Bike Catalog",       "rosmarie0@adventure-works.com", "244-555-0166", "Chicago",       "IL", "US"),
    ( 7, "Dominic",  "Gash",      "Pedal Pushers",             "dominic0@adventure-works.com",  "192-555-0175", "Houston",       "TX", "US"),
    ( 8, "Kathleen", "Garza",     "Proxatier Inc",             "kathleen0@adventure-works.com", "150-555-0127", "Dallas",        "TX", "US"),
    ( 9, "Katherine","Harding",   "Rural Cycle Emporium",      "katherine0@adventure-works.com","926-555-0159", "Denver",        "CO", "US"),
    (10, "Johnny",   "Caprio",    "Vigorous Exercise Company", "johnny0@adventure-works.com",   "112-555-0191", "Boston",        "MA", "US"),
    (11, "Alice",    "Chen",      "Tailspin Traders",          "alice.chen@tailspin.com",       "206-555-0201", "Seattle",       "WA", "US"),
    (12, "Bob",      "Patel",     "Northwind Traders",         "bob.patel@northwind.com",       "425-555-0202", "Redmond",       "WA", "US"),
    (13, "Carol",    "Smith",     "Fabrikam Inc",              "carol.smith@fabrikam.com",      "253-555-0203", "Tacoma",        "WA", "US"),
    (14, "David",    "Kim",       "Contoso Electronics",       "david.kim@contoso-elec.com",    "360-555-0204", "Bellevue",      "WA", "US"),
    (15, "Eva",      "Johnson",   "Adventure Works",           "eva.johnson@adventure.com",     "509-555-0205", "Spokane",       "WA", "US"),
]

df_customer = spark.createDataFrame(rows_customer, schema_customer)
df_customer.write.format("delta").mode("overwrite").saveAsTable("customer")
print(f"Customer: {df_customer.count()} rows written")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 4 – Schema: SalesOrderHeader (30 orders, 2024-2025)
# Columns: SalesOrderID, OrderDate, DueDate, CustomerID,
#          SubTotal, TaxAmt, Freight, TotalDue, Status, SalesTerritory
# ─────────────────────────────────────────────
from pyspark.sql.types import DateType

schema_header = StructType([
    StructField("SalesOrderID",    IntegerType(),      False),
    StructField("OrderDate",       DateType(),         False),
    StructField("DueDate",         DateType(),         False),
    StructField("CustomerID",      IntegerType(),      False),
    StructField("SubTotal",        DecimalType(10, 2), False),
    StructField("TaxAmt",          DecimalType(10, 2), False),
    StructField("Freight",         DecimalType(10, 2), False),
    StructField("TotalDue",        DecimalType(10, 2), False),
    StructField("Status",          IntegerType(),      False),
    StructField("SalesTerritory",  StringType(),       True),
])

from datetime import date

rows_header = [
    ( 1, date(2024,  1, 15), date(2024,  1, 29),  1, Decimal(" 4803.00"), Decimal(" 384.24"), Decimal(" 120.08"), Decimal(" 5307.32"), 5, "Northwest"),
    ( 2, date(2024,  1, 22), date(2024,  2,  5),  2, Decimal(" 1431.50"), Decimal(" 114.52"), Decimal("  35.79"), Decimal(" 1581.81"), 5, "Northwest"),
    ( 3, date(2024,  2,  1), date(2024,  2, 15),  3, Decimal("  539.99"), Decimal("  43.20"), Decimal("  13.50"), Decimal("  596.69"), 5, "Southwest"),
    ( 4, date(2024,  2, 14), date(2024,  2, 28),  4, Decimal(" 2863.00"), Decimal(" 229.04"), Decimal("  71.58"), Decimal(" 3163.62"), 5, "Southwest"),
    ( 5, date(2024,  2, 28), date(2024,  3, 13),  5, Decimal("   99.98"), Decimal("   8.00"), Decimal("   2.50"), Decimal("  110.48"), 5, "Southwest"),
    ( 6, date(2024,  3,  5), date(2024,  3, 19),  6, Decimal(" 1071.98"), Decimal("  85.76"), Decimal("  26.80"), Decimal(" 1184.54"), 5, "Central"),
    ( 7, date(2024,  3, 18), date(2024,  4,  1),  7, Decimal(" 4295.49"), Decimal(" 343.64"), Decimal(" 107.39"), Decimal(" 4746.52"), 5, "Central"),
    ( 8, date(2024,  3, 25), date(2024,  4,  8),  8, Decimal("  124.97"), Decimal("  10.00"), Decimal("   3.12"), Decimal("  138.09"), 5, "Central"),
    ( 9, date(2024,  4,  8), date(2024,  4, 22),  9, Decimal(" 2863.00"), Decimal(" 229.04"), Decimal("  71.58"), Decimal(" 3163.62"), 5, "Northwest"),
    (10, date(2024,  4, 15), date(2024,  4, 29), 10, Decimal("  539.99"), Decimal("  43.20"), Decimal("  13.50"), Decimal("  596.69"), 5, "Northeast"),
    (11, date(2024,  5,  3), date(2024,  5, 17), 11, Decimal(" 4803.00"), Decimal(" 384.24"), Decimal(" 120.08"), Decimal(" 5307.32"), 5, "Northwest"),
    (12, date(2024,  5, 20), date(2024,  6,  3), 12, Decimal(" 2863.00"), Decimal(" 229.04"), Decimal("  71.58"), Decimal(" 3163.62"), 5, "Northwest"),
    (13, date(2024,  6,  1), date(2024,  6, 15), 13, Decimal(" 1071.98"), Decimal("  85.76"), Decimal("  26.80"), Decimal(" 1184.54"), 5, "Northwest"),
    (14, date(2024,  6, 10), date(2024,  6, 24), 14, Decimal("  539.99"), Decimal("  43.20"), Decimal("  13.50"), Decimal("  596.69"), 5, "Northwest"),
    (15, date(2024,  6, 22), date(2024,  7,  6), 15, Decimal(" 4295.49"), Decimal(" 343.64"), Decimal(" 107.39"), Decimal(" 4746.52"), 5, "Northwest"),
    (16, date(2024,  7,  5), date(2024,  7, 19),  1, Decimal(" 1431.50"), Decimal(" 114.52"), Decimal("  35.79"), Decimal(" 1581.81"), 5, "Northwest"),
    (17, date(2024,  7, 18), date(2024,  8,  1),  3, Decimal(" 2319.99"), Decimal(" 185.60"), Decimal("  58.00"), Decimal(" 2563.59"), 5, "Southwest"),
    (18, date(2024,  8,  2), date(2024,  8, 16),  5, Decimal(" 1431.50"), Decimal(" 114.52"), Decimal("  35.79"), Decimal(" 1581.81"), 5, "Southwest"),
    (19, date(2024,  8, 14), date(2024,  8, 28),  7, Decimal("  539.99"), Decimal("  43.20"), Decimal("  13.50"), Decimal("  596.69"), 5, "Central"),
    (20, date(2024,  9,  3), date(2024,  9, 17),  9, Decimal(" 4803.00"), Decimal(" 384.24"), Decimal(" 120.08"), Decimal(" 5307.32"), 5, "Northwest"),
    (21, date(2024,  9, 21), date(2024, 10,  5), 11, Decimal(" 1071.98"), Decimal("  85.76"), Decimal("  26.80"), Decimal(" 1184.54"), 5, "Northwest"),
    (22, date(2024, 10,  7), date(2024, 10, 21), 13, Decimal(" 2863.00"), Decimal(" 229.04"), Decimal("  71.58"), Decimal(" 3163.62"), 5, "Northwest"),
    (23, date(2024, 10, 15), date(2024, 10, 29),  2, Decimal("  124.97"), Decimal("  10.00"), Decimal("   3.12"), Decimal("  138.09"), 5, "Northwest"),
    (24, date(2024, 11,  1), date(2024, 11, 15),  4, Decimal(" 4295.49"), Decimal(" 343.64"), Decimal(" 107.39"), Decimal(" 4746.52"), 5, "Southwest"),
    (25, date(2024, 11, 18), date(2024, 12,  2),  6, Decimal(" 1431.50"), Decimal(" 114.52"), Decimal("  35.79"), Decimal(" 1581.81"), 5, "Central"),
    (26, date(2024, 12,  5), date(2024, 12, 19),  8, Decimal(" 2319.99"), Decimal(" 185.60"), Decimal("  58.00"), Decimal(" 2563.59"), 5, "Central"),
    (27, date(2024, 12, 20), date(2025,  1,  3), 10, Decimal("  539.99"), Decimal("  43.20"), Decimal("  13.50"), Decimal("  596.69"), 5, "Northeast"),
    (28, date(2025,  1,  8), date(2025,  1, 22), 12, Decimal(" 4803.00"), Decimal(" 384.24"), Decimal(" 120.08"), Decimal(" 5307.32"), 5, "Northwest"),
    (29, date(2025,  1, 22), date(2025,  2,  5), 14, Decimal(" 1071.98"), Decimal("  85.76"), Decimal("  26.80"), Decimal(" 1184.54"), 5, "Northwest"),
    (30, date(2025,  2, 10), date(2025,  2, 24), 15, Decimal(" 2863.00"), Decimal(" 229.04"), Decimal("  71.58"), Decimal(" 3163.62"), 5, "Northwest"),
]

df_header = spark.createDataFrame(rows_header, schema_header)
df_header.write.format("delta").mode("overwrite").saveAsTable("salesorderheader")
print(f"SalesOrderHeader: {df_header.count()} rows written")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 5 – Schema: SalesOrderDetail (63 line items)
# Columns: SalesOrderID, SalesOrderDetailID, ProductID,
#          OrderQty, UnitPrice, UnitPriceDiscount, LineTotal
# ─────────────────────────────────────────────
schema_detail = StructType([
    StructField("SalesOrderID",       IntegerType(),      False),
    StructField("SalesOrderDetailID", IntegerType(),      False),
    StructField("ProductID",          IntegerType(),      False),
    StructField("OrderQty",           IntegerType(),      False),
    StructField("UnitPrice",          DecimalType(10, 2), False),
    StructField("UnitPriceDiscount",  DecimalType(4,  2), False),
    StructField("LineTotal",          DecimalType(12, 2), False),
])

def lt(qty, price, disc):
    return Decimal(str(round(qty * float(price) * (1 - float(disc)), 2)))

rows_detail = [
    # OrderID 1
    ( 1,  1, 722, 2, Decimal("2319.99"), Decimal("0.00"), lt(2, "2319.99", "0.00")),
    ( 1,  2, 714, 3, Decimal(  "49.99"), Decimal("0.00"), lt(3,   "49.99", "0.00")),
    ( 1,  3, 707, 2, Decimal(  "34.99"), Decimal("0.00"), lt(2,   "34.99", "0.00")),
    # OrderID 2
    ( 2,  4, 716, 1, Decimal("1431.50"), Decimal("0.00"), lt(1, "1431.50", "0.00")),
    ( 2,  5, 707, 2, Decimal(  "34.99"), Decimal("0.00"), lt(2,   "34.99", "0.00")),
    # OrderID 3
    ( 3,  6, 718, 1, Decimal( "539.99"), Decimal("0.00"), lt(1,  "539.99", "0.00")),
    # OrderID 4
    ( 4,  7, 716, 2, Decimal("1431.50"), Decimal("0.00"), lt(2, "1431.50", "0.00")),
    ( 4,  8, 708, 1, Decimal(  "34.99"), Decimal("0.00"), lt(1,   "34.99", "0.00")),
    # OrderID 5
    ( 5,  9, 709, 5, Decimal(   "9.50"), Decimal("0.00"), lt(5,    "9.50", "0.00")),
    ( 5, 10, 710, 5, Decimal(   "9.50"), Decimal("0.00"), lt(5,    "9.50", "0.00")),
    # OrderID 6
    ( 6, 11, 714, 2, Decimal(  "49.99"), Decimal("0.00"), lt(2,   "49.99", "0.00")),
    ( 6, 12, 718, 1, Decimal( "539.99"), Decimal("0.05"), lt(1,  "539.99", "0.05")),
    # OrderID 7
    ( 7, 13, 722, 1, Decimal("2319.99"), Decimal("0.00"), lt(1, "2319.99", "0.00")),
    ( 7, 14, 706, 1, Decimal("1431.50"), Decimal("0.05"), lt(1, "1431.50", "0.05")),
    ( 7, 15, 711, 2, Decimal(  "34.99"), Decimal("0.00"), lt(2,   "34.99", "0.00")),
    # OrderID 8
    ( 8, 16, 712, 5, Decimal(   "8.99"), Decimal("0.05"), lt(5,    "8.99", "0.05")),
    ( 8, 17, 709,10, Decimal(   "9.50"), Decimal("0.10"), lt(10,   "9.50", "0.10")),
    # OrderID 9
    ( 9, 18, 716, 2, Decimal("1431.50"), Decimal("0.00"), lt(2, "1431.50", "0.00")),
    ( 9, 19, 708, 2, Decimal(  "34.99"), Decimal("0.05"), lt(2,   "34.99", "0.05")),
    # OrderID 10
    (10, 20, 718, 1, Decimal( "539.99"), Decimal("0.00"), lt(1,  "539.99", "0.00")),
    # OrderID 11
    (11, 21, 722, 2, Decimal("2319.99"), Decimal("0.00"), lt(2, "2319.99", "0.00")),
    (11, 22, 715, 3, Decimal(  "49.99"), Decimal("0.00"), lt(3,   "49.99", "0.00")),
    # OrderID 12
    (12, 23, 716, 2, Decimal("1431.50"), Decimal("0.00"), lt(2, "1431.50", "0.00")),
    (12, 24, 707, 2, Decimal(  "34.99"), Decimal("0.00"), lt(2,   "34.99", "0.00")),
    # OrderID 13
    (13, 25, 714, 2, Decimal(  "49.99"), Decimal("0.00"), lt(2,   "49.99", "0.00")),
    (13, 26, 718, 1, Decimal( "539.99"), Decimal("0.05"), lt(1,  "539.99", "0.05")),
    # OrderID 14
    (14, 27, 718, 1, Decimal( "539.99"), Decimal("0.00"), lt(1,  "539.99", "0.00")),
    # OrderID 15
    (15, 28, 722, 1, Decimal("2319.99"), Decimal("0.00"), lt(1, "2319.99", "0.00")),
    (15, 29, 706, 1, Decimal("1431.50"), Decimal("0.05"), lt(1, "1431.50", "0.05")),
    (15, 30, 711, 2, Decimal(  "34.99"), Decimal("0.05"), lt(2,   "34.99", "0.05")),
    # OrderID 16
    (16, 31, 716, 1, Decimal("1431.50"), Decimal("0.00"), lt(1, "1431.50", "0.00")),
    # OrderID 17
    (17, 32, 722, 1, Decimal("2319.99"), Decimal("0.00"), lt(1, "2319.99", "0.00")),
    (17, 33, 713, 1, Decimal(  "49.99"), Decimal("0.00"), lt(1,   "49.99", "0.00")),
    # OrderID 18
    (18, 34, 716, 1, Decimal("1431.50"), Decimal("0.00"), lt(1, "1431.50", "0.00")),
    (18, 35, 709, 5, Decimal(   "9.50"), Decimal("0.00"), lt(5,    "9.50", "0.00")),
    # OrderID 19
    (19, 36, 718, 1, Decimal( "539.99"), Decimal("0.00"), lt(1,  "539.99", "0.00")),
    # OrderID 20
    (20, 37, 722, 2, Decimal("2319.99"), Decimal("0.00"), lt(2, "2319.99", "0.00")),
    (20, 38, 714, 3, Decimal(  "49.99"), Decimal("0.05"), lt(3,   "49.99", "0.05")),
    # OrderID 21
    (21, 39, 718, 1, Decimal( "539.99"), Decimal("0.05"), lt(1,  "539.99", "0.05")),
    (21, 40, 714, 2, Decimal(  "49.99"), Decimal("0.00"), lt(2,   "49.99", "0.00")),
    # OrderID 22
    (22, 41, 716, 2, Decimal("1431.50"), Decimal("0.00"), lt(2, "1431.50", "0.00")),
    (22, 42, 708, 1, Decimal(  "34.99"), Decimal("0.05"), lt(1,   "34.99", "0.05")),
    # OrderID 23
    (23, 43, 709, 5, Decimal(   "9.50"), Decimal("0.05"), lt(5,    "9.50", "0.05")),
    (23, 44, 710, 5, Decimal(   "9.50"), Decimal("0.05"), lt(5,    "9.50", "0.05")),
    # OrderID 24
    (24, 45, 722, 1, Decimal("2319.99"), Decimal("0.00"), lt(1, "2319.99", "0.00")),
    (24, 46, 706, 1, Decimal("1431.50"), Decimal("0.05"), lt(1, "1431.50", "0.05")),
    (24, 47, 711, 2, Decimal(  "34.99"), Decimal("0.00"), lt(2,   "34.99", "0.00")),
    # OrderID 25
    (25, 48, 716, 1, Decimal("1431.50"), Decimal("0.00"), lt(1, "1431.50", "0.00")),
    # OrderID 26
    (26, 49, 722, 1, Decimal("2319.99"), Decimal("0.00"), lt(1, "2319.99", "0.00")),
    (26, 50, 713, 1, Decimal(  "49.99"), Decimal("0.00"), lt(1,   "49.99", "0.00")),
    # OrderID 27
    (27, 51, 718, 1, Decimal( "539.99"), Decimal("0.00"), lt(1,  "539.99", "0.00")),
    # OrderID 28
    (28, 52, 722, 2, Decimal("2319.99"), Decimal("0.00"), lt(2, "2319.99", "0.00")),
    (28, 53, 715, 3, Decimal(  "49.99"), Decimal("0.05"), lt(3,   "49.99", "0.05")),
    # OrderID 29
    (29, 54, 718, 1, Decimal( "539.99"), Decimal("0.05"), lt(1,  "539.99", "0.05")),
    (29, 55, 714, 2, Decimal(  "49.99"), Decimal("0.00"), lt(2,   "49.99", "0.00")),
    # OrderID 30
    (30, 56, 716, 2, Decimal("1431.50"), Decimal("0.00"), lt(2, "1431.50", "0.00")),
    (30, 57, 708, 1, Decimal(  "34.99"), Decimal("0.05"), lt(1,   "34.99", "0.05")),
]

df_detail = spark.createDataFrame(rows_detail, schema_detail)
df_detail.write.format("delta").mode("overwrite").saveAsTable("salesorderdetail")
print(f"SalesOrderDetail: {df_detail.count()} rows written")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# ─────────────────────────────────────────────
# Cell 6 – Verify all tables
# ─────────────────────────────────────────────
for tbl in ["ProductCategory", "Product", "Customer", "SalesOrderHeader", "SalesOrderDetail"]:
    n = spark.table(tbl).count()
    print(f"  {tbl}: {n} rows")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }
