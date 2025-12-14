
enum ProductCategory {
  weight, // Kilo / Ratl
  canned, // Canned / Cartons
  beverages, // Soft Drinks / Dairy
  other, // Other
}

class Product {
  final String id;
  final String name;
  final ProductCategory category;
  final double purchasePrice; // Total price
  final double quantity; // items in carton, or weight value
  final String unit; // 'piece', 'kg', 'lb', etc.
  final double sellingPrice;
  final DateTime createdAt;
  final double stockCount; // Current inventory count (e.g., number of cartons/sacks)
  final double soldCount; // Number of units sold

  Product({
    required this.id,
    required this.name,
    required this.category,
    required this.purchasePrice,
    required this.quantity,
    required this.unit,
    required this.sellingPrice,
    required this.createdAt,
    this.stockCount = 0.0,
    this.soldCount = 0.0,
  });

  // Calculate cost per single unit
  double get costPerUnit {
    if (quantity == 0) return 0.0;
    return purchasePrice / quantity;
  }

  double get profit => sellingPrice - costPerUnit;

  // Valuation helpers
  // Total Purchase Value of Stock = StockCount (عدد العبوات المتبقية) * CostPerUnit (سعر العبوة الواحدة)
  double get totalPurchaseValue => stockCount * costPerUnit;

  // Total Selling Value of Stock 
  // Total Selling = StockCount (عدد العبوات) * SellingPricePerPiece
  double get totalSellingValue => stockCount * sellingPrice;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category.index,
      'purchasePrice': purchasePrice,
      'quantity': quantity,
      'unit': unit,
      'sellingPrice': sellingPrice,
      'createdAt': createdAt.toIso8601String(),
      'stockCount': stockCount,
      'soldCount': soldCount,
    };
  }

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      name: json['name'],
      category: ProductCategory.values[json['category']],
      purchasePrice: (json['purchasePrice'] as num).toDouble(),
      quantity: (json['quantity'] as num).toDouble(),
      unit: json['unit'],
      sellingPrice: (json['sellingPrice'] as num).toDouble(),
      createdAt: DateTime.parse(json['createdAt']),
      stockCount: (json['stockCount'] as num?)?.toDouble() ?? 0.0,
      soldCount: (json['soldCount'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
