import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/product.dart';
import '../providers/store_provider.dart';
import '../utils/number_formatter.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  // Formatter: Separates thousands with commas, removes unnecessary decimal zeros (e.g. 100 not 100.0)
  final _formatter = NumberFormat('#,###.##');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('تقييم المتجر والمخزون'),
      ),
      body: Consumer<StoreProvider>(
        builder: (context, provider, child) {
          final products = provider.products;
          
          // الحساب الأساسي - تقدير الأرباح من جميع المنتجات المضافة
          double totalOriginalCapital = 0.0;  // رأس المال الأصلي (كل ما تم شراؤه)
          double totalNetProfit = 0.0;        // صافي الربح المتوقع (مجموع الأرباح لكل قطعة)
          
          // الحساب المتبقي - المخزون الحالي فقط
          double remainingCapital = 0.0;      // رأس المال المتبقي
          double remainingRevenue = 0.0;      // المبيعات المقدرة للمتبقي

          for (var p in products) {
            // الحساب الأساسي - ثابت لا يتغير
            totalOriginalCapital += p.purchasePrice;  // سعر الشراء الكلي للمنتج
            
            // صافي الربح الأساسي = الربح لكل عبوة × عدد العبوات الكلي في الكرتونة
            // هذا الحساب ثابت ولا يعتمد على المخزون المتبقي
            totalNetProfit += p.profit * p.quantity;
            
            // الحساب المتبقي (المخزون فقط)
            // رأس المال المتبقي = عدد العبوات المتبقية × سعر العبوة الواحدة
            remainingCapital += p.totalPurchaseValue;
            remainingRevenue += p.totalSellingValue;
          }

          // إجمالي المبيعات المتوقعة
          final totalPotentialRevenue = totalOriginalCapital + totalNetProfit;
          
          // المبلغ المقدر الأساسي = رأس المال الأصلي + صافي الربح المتوقع
          final totalEstimatedBasic = totalOriginalCapital + totalNetProfit;
          
          // صافي الربح المتوقع من المتبقي
          final remainingProfit = remainingRevenue - remainingCapital;
          
          // المبلغ المقدر المتبقي
          final totalEstimatedRemaining = remainingCapital + remainingProfit;

          return SingleChildScrollView(
            child: Column(
              children: [
                // الحساب الأساسي
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.blue.shade700, Colors.blue.shade500],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Column(
                    children: [
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.account_balance_wallet, color: Colors.white, size: 24),
                          SizedBox(width: 8),
                          Text(
                            'الحساب الأساسي', 
                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(child: _buildBasicCard('رأس المال الأصلي', totalOriginalCapital, provider.currency, Colors.white, Colors.blue.shade700)),
                          const SizedBox(width: 8),
                          Expanded(child: _buildBasicCard('صافي الربح المتوقع', totalNetProfit, provider.currency, Colors.white, Colors.orange.shade700)),
                        ],
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 2),
                
                // الحساب المتبقي
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16.0),
                  color: Colors.green.shade50,
                  child: Column(
                    children: [
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inventory_2, color: Colors.green, size: 24),
                          SizedBox(width: 8),
                          Text(
                            'الحساب المتبقي (المخزون)', 
                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.green),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(child: _buildSummaryCard('رأس المال المتبقي', remainingCapital, provider.currency, Colors.blue)),
                          const SizedBox(width: 8),
                          Expanded(child: _buildSummaryCard('صافي الربح المتوقع', remainingProfit, provider.currency, Colors.orange)),
                          const SizedBox(width: 8),
                          Expanded(child: _buildSummaryCard('المبيعات المقدرة', totalEstimatedRemaining, provider.currency, Colors.green)),
                        ],
                      ),
                    ],
                  ),
                ),
                
                const Divider(height: 1, thickness: 2),
                
                // قائمة المنتجات
                Container(
                  padding: const EdgeInsets.all(16),
                  child: const Text(
                    'إدارة المخزون والمبيعات',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                
                products.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.all(32.0),
                        child: Text('لا توجد منتجات', style: TextStyle(color: Colors.grey)),
                      )
                    : ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: products.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final product = products[index];
                          final stockInitialVal = product.stockCount == 0 ? '' : product.stockCount.toStringAsFixed(product.stockCount % 1 == 0 ? 0 : 1);

                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            child: Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    product.name, 
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          'شراء: ${_formatter.format(product.purchasePrice)} ${provider.currency}',
                                          style: const TextStyle(fontSize: 12, color: Colors.blue),
                                        ),
                                      ),
                                      Expanded(
                                        child: Text(
                                          'بيع: ${_formatter.format(product.sellingPrice)} ${provider.currency}',
                                          style: const TextStyle(fontSize: 12, color: Colors.green),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  // المخزون
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('المخزون (عدد العبوات المتبقية):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 4),
                                      TextFormField(
                                        // Format initial value with commas if not empty/zero
                                        initialValue: stockInitialVal.isEmpty ? '' : NumberFormat('#,###').format(double.tryParse(stockInitialVal) ?? 0),
                                        keyboardType: TextInputType.number,
                                        inputFormatters: [ThousandsSeparatorInputFormatter()], // Add formatter
                                        textAlign: TextAlign.center,
                                        decoration: InputDecoration(
                                          hintText: '0',
                                          contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                          isDense: true,
                                        ),
                                        onChanged: (val) {
                                          // Remove commas before parsing to double for storage
                                          String cleanVal = val.replaceAll(',', '');
                                          final newCount = double.tryParse(cleanVal) ?? 0.0;
                                          final updated = Product(
                                            id: product.id,
                                            name: product.name,
                                            category: product.category,
                                            purchasePrice: product.purchasePrice,
                                            quantity: product.quantity,
                                            unit: product.unit,
                                            sellingPrice: product.sellingPrice,
                                            createdAt: product.createdAt,
                                            stockCount: newCount,
                                            soldCount: product.soldCount,
                                          );
                                          provider.updateProduct(updated);
                                        },
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                const SizedBox(height: 20),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildBasicCard(String title, double value, String currency, Color bgColor, Color textColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 6, offset: const Offset(0, 3)),
        ],
      ),
      child: Column(
        children: [
          Text(
            title, 
            style: TextStyle(fontSize: 11, color: textColor, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              '${_formatter.format(value)} $currency',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textColor),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String title, double value, String currency, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        children: [
          Text(
            title, 
            style: TextStyle(fontSize: 11, color: Colors.grey[800], fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              '${_formatter.format(value)} $currency',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}
