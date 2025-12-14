
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/product.dart';

class StoreProvider with ChangeNotifier {
  List<Product> _products = [];
  String _currency = 'SDG';

  List<Product> get products => _products;
  String get currency => _currency;

  StoreProvider() {
    loadData();
  }

  Future<void> loadData() async {
    final prefs = await SharedPreferences.getInstance();
    
    // Load Currency
    _currency = prefs.getString('currency') ?? 'SDG';

    // Load Products
    final String? productsString = prefs.getString('products');
    if (productsString != null) {
      final List<dynamic> decoded = jsonDecode(productsString);
      _products = decoded.map((item) => Product.fromJson(item)).toList();
      _sortProducts();
    }
    notifyListeners();
  }

  Future<void> addProduct(Product product) async {
    // Validation: Skip if any critical value is missing (0) or negative
    if (product.quantity <= 0 || product.purchasePrice <= 0 || product.sellingPrice <= 0) {
      if (kDebugMode) {
        print('Skipping invalid product: ${product.name}, Price: ${product.purchasePrice}, Qty: ${product.quantity}, Sell: ${product.sellingPrice}');
      }
      return;
    }

    _products.add(product);
    _sortProducts();
    await _saveData();
    notifyListeners();
  }

  Future<void> deleteProduct(String id) async {
    _products.removeWhere((p) => p.id == id);
    await _saveData();
    notifyListeners();
  }

  Future<void> updateProduct(Product updatedProduct) async {
    final index = _products.indexWhere((p) => p.id == updatedProduct.id);
    if (index != -1) {
      _products[index] = updatedProduct;
      await _saveData();
      notifyListeners();
    }
  }

  Future<void> setCurrency(String newCurrency) async {
    _currency = newCurrency;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('currency', _currency);
    notifyListeners();
  }

  void _sortProducts() {
    _products.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
  }

  Future<void> _saveData() async {
    final prefs = await SharedPreferences.getInstance();
    final String encoded = jsonEncode(_products.map((p) => p.toJson()).toList());
    await prefs.setString('products', encoded);
  }

  List<Product> getByCategory(ProductCategory category) {
    return _products.where((p) => p.category == category).toList();
  }
}
