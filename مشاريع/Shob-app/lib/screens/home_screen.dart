import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/store_provider.dart';
import 'ready_screen.dart';
import 'weight_screen.dart';
import 'other_screen.dart';
import 'beverages_screen.dart';
import 'inventory_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const ReadyScreen(),
    const WeightScreen(),
    const BeveragesScreen(),
    const OtherScreen(),
  ];

  final List<String> _titles = [
    'المعلبات',
    'الوزن',
    'المشروبات',
    'أخرى',
  ];

  final List<Map<String, String>> _currencies = [
    {'code': 'SDG', 'name': 'جنيه سوداني'},
    {'code': 'SAR', 'name': 'ريال سعودي'},
    {'code': 'EGP', 'name': 'جنيه مصري'},
    {'code': 'USD', 'name': 'دولار أمريكي'},
    {'code': 'AED', 'name': 'درهم إماراتي'},
    {'code': 'QAR', 'name': 'ريال قطري'},
    {'code': 'KWD', 'name': 'دينار كويتي'},
    {'code': 'OMR', 'name': 'ريال عماني'},
    {'code': 'BHD', 'name': 'دينار بحريني'},
    {'code': 'JOD', 'name': 'دينار أردني'},
    {'code': 'EUR', 'name': 'يورو'},
  ];

  void _showCurrencyDialog(BuildContext context) {
    final provider = Provider.of<StoreProvider>(context, listen: false);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('اختر العملة'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: _currencies.length,
            itemBuilder: (ctx, index) {
              final currency = _currencies[index];
              return RadioListTile<String>(
                title: Text('${currency['name']!} (${currency['code']!})'),
                value: currency['code']!,
                groupValue: provider.currency,
                onChanged: (val) {
                  if (val != null) {
                    provider.setCurrency(val);
                    Navigator.pop(ctx);
                  }
                },
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_currentIndex]),
        actions: [
          IconButton(
            icon: const Icon(Icons.analytics_outlined),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const InventoryScreen()),
            ),
            tooltip: 'تقييم المتجر',
          ),
          IconButton(
            icon: const Icon(Icons.currency_exchange),
            onPressed: () => _showCurrencyDialog(context),
            tooltip: 'تغيير العملة',
          ),
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: Colors.blue,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed, // Needed for 4+ items
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            activeIcon: Icon(Icons.inventory_2),
            label: 'المعلبات',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.scale_outlined),
            activeIcon: Icon(Icons.scale),
            label: 'الوزن',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_drink_outlined),
            activeIcon: Icon(Icons.local_drink),
            label: 'مشروبات',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.category_outlined),
            activeIcon: Icon(Icons.category),
            label: 'أخرى',
          ),
        ],
      ),
    );
  }
}
