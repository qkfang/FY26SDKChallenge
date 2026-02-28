dotnet new tool-manifest
dotnet tool install microsoft.dataapibuilder --prerelease
dotnet tool restore

dotnet dab init --database-type mssql --connection-string "@env('MSSQL_CONNECTION_STRING')" --host-mode Development --config dab-config.json
dotnet dab add Customers --source SalesLT.Customer --permissions "anonymous:*" --description "Customer records."
dotnet dab add CustomerAddress --source SalesLT.CustomerAddress --permissions "anonymous:*" --description "Customer address records."
dotnet dab add Product --source SalesLT.Product --permissions "anonymous:*" --description "Product records."
dotnet dab add ProductCategory --source SalesLT.ProductCategory --permissions "anonymous:*" --description "Product category records."
dotnet dab add ProductDescription --source SalesLT.ProductDescription --permissions "anonymous:*" --description "Product description records."
dotnet dab add ProductModel --source SalesLT.ProductModel --permissions "anonymous:*" --description "Product model records."
dotnet dab add ProductModelProductDescription --source SalesLT.ProductModelProductDescription --permissions "anonymous:*" --description "Product model product description records."
dotnet dab add SalesOrderDetail --source SalesLT.SalesOrderDetail --permissions "anonymous:*" --description "Sales order detail records."
dotnet dab add SalesOrderHeader --source SalesLT.SalesOrderHeader --permissions "anonymous:*" --description "Sales order header records."
dotnet dab start --config dab-config.json


