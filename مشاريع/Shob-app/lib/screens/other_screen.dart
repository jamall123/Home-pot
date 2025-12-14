import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/product.dart';
import '../providers/store_provider.dart';
import '../utils/number_formatter.dart';

class OtherScreen extends StatelessWidget {
  const OtherScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<StoreProvider>(
        builder: (context, provider, child) {
          final products = provider.getByCategory(ProductCategory.other);
          if (products.isEmpty) {
            return const Center(
              child: Text(
                'لا توجد منتجات أخرى.\nاضغط على + للإضافة',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 16),
              ),
            );
          }
          return ListView.builder(
            itemCount: products.length,
            itemBuilder: (context, index) {
              final product = products[index];
              return Dismissible(
                key: Key(product.id),
                direction: DismissDirection.endToStart,
                background: Container(
                  color: Colors.red,
                  alignment: Alignment.centerLeft,
                  padding: const EdgeInsets.only(left: 20),
                  child: const Icon(Icons.delete, color: Colors.white),
                ),
                onDismissed: (_) {
                  provider.deleteProduct(product.id);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('تم حذف المنتج')),
                  );
                },
                child: Card(
                  child: ListTile(
                    onTap: () => showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      builder: (ctx) => AddOtherProductSheet(product: product),
                    ),
                    leading: CircleAvatar(
                      backgroundColor: Colors.blue.shade100,
                      child: const Icon(Icons.category, color: Colors.blue),
                    ),
                    title: Text(
                      product.name,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('قطعة/عبوة: ${product.quantity.toStringAsFixed(0)} قطعة'),
                        Text('شراء العبوة/الدستة: ${product.purchasePrice.toStringAsFixed(1)} ${provider.currency}'),
                        Text('تكلفة القطعة: ${product.costPerUnit.toStringAsFixed(1)} ${provider.currency}',
                             style: const TextStyle(color: Colors.orange)),
                      ],
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('سعر البيع', style: TextStyle(fontSize: 10, color: Colors.grey)),
                        Text(
                          '${product.sellingPrice.toStringAsFixed(1)} ${provider.currency}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.green),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          builder: (ctx) => const AddOtherProductSheet(),
        ),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class AddOtherProductSheet extends StatefulWidget {
  final Product? product;
  const AddOtherProductSheet({super.key, this.product});

  @override
  State<AddOtherProductSheet> createState() => _AddOtherProductSheetState();
}

class _AddOtherProductSheetState extends State<AddOtherProductSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _purchasePriceController = TextEditingController(); // Pack price
  final _quantityController = TextEditingController(); // Items in pack
  final _sellingPriceController = TextEditingController();

  double _calculatedCostItem = 0.0;

  @override
  void initState() {
    super.initState();
    if (widget.product != null) {
      _nameController.text = widget.product!.name;
      _purchasePriceController.text = NumberFormat('#,###.##').format(widget.product!.purchasePrice);
      _quantityController.text = NumberFormat('#,###.##').format(widget.product!.quantity);
      _sellingPriceController.text = NumberFormat('#,###.##').format(widget.product!.sellingPrice);
      _calculateCost();
    }
  }

  double _parseFormatted(String val) {
    if (val.isEmpty) return 0.0;
    return double.tryParse(val.replaceAll(',', '')) ?? 0.0;
  }

  void _calculateCost() {
    final price = _parseFormatted(_purchasePriceController.text);
    final qty = _parseFormatted(_quantityController.text);
    setState(() {
      if (qty > 0) {
        _calculatedCostItem = price / qty;
      } else {
        _calculatedCostItem = 0.0;
      }
    });
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final provider = Provider.of<StoreProvider>(context, listen: false);

      final purchasePrice = _parseFormatted(_purchasePriceController.text);
      final quantity = _parseFormatted(_quantityController.text);
      final sellingPrice = _parseFormatted(_sellingPriceController.text);
      
      if (widget.product != null) {
        final updatedProduct = Product(
          id: widget.product!.id,
          name: _nameController.text,
          category: widget.product!.category,
          purchasePrice: purchasePrice,
          quantity: quantity,
          unit: widget.product!.unit,
          sellingPrice: sellingPrice,
          createdAt: widget.product!.createdAt,
          stockCount: widget.product!.stockCount,
          soldCount: widget.product!.soldCount,
        );
        provider.updateProduct(updatedProduct);
      } else {
        final product = Product(
          id: DateTime.now().toString(),
          name: _nameController.text,
          category: ProductCategory.other,
          purchasePrice: purchasePrice,
          quantity: quantity,
          unit: 'piece',
          sellingPrice: sellingPrice,
          createdAt: DateTime.now(),
          stockCount: 0.0,
          soldCount: 0.0,
        );
        provider.addProduct(product);
      }
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 16,
        right: 16,
        top: 16,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('إضافة منتج آخر', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'اسم المنتج', border: OutlineInputBorder()),
              validator: (val) => val!.isEmpty ? 'مطلوب' : null,
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _purchasePriceController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [ThousandsSeparatorInputFormatter()],
                    decoration: const InputDecoration(labelText: 'سعر شراء (عبوة/دستة)', border: OutlineInputBorder()),
                    onChanged: (_) => _calculateCost(),
                    validator: (val) => val!.isEmpty ? 'مطلوب' : null,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: _quantityController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [ThousandsSeparatorInputFormatter()],
                    decoration: const InputDecoration(labelText: 'عدد القطع بالداخل', border: OutlineInputBorder()),
                    onChanged: (_) => _calculateCost(),
                    validator: (val) => val!.isEmpty ? 'مطلوب' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Display Calculated Cost
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('تكلفة القطعة الواحدة:'),
                  Text(
                    NumberFormat('#,###.##').format(_calculatedCostItem),
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.blue),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            TextFormField(
              controller: _sellingPriceController,
              keyboardType: TextInputType.number,
              inputFormatters: [ThousandsSeparatorInputFormatter()],
              decoration: const InputDecoration(labelText: 'سعر بيع القطعة', border: OutlineInputBorder()),
              validator: (val) => val!.isEmpty ? 'مطلوب' : null,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submit,
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                child: const Text('حفظ'),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
