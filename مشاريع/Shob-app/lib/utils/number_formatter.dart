import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

class ThousandsSeparatorInputFormatter extends TextInputFormatter {
  final NumberFormat _formatter = NumberFormat('#,###');

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.isEmpty) {
      return newValue;
    }

    // Remove non-digits to get raw number
    String newText = newValue.text.replaceAll(RegExp(r'[^\d]'), '');
    
    // If empty after cleanup (e.g. user typed only non-digits), return empty
    if (newText.isEmpty) {
       return newValue.copyWith(text: '');
    }

    // Parse and format
    try {
      int value = int.parse(newText);
      String formatted = _formatter.format(value);
      
      return TextEditingValue(
        text: formatted,
        selection: TextSelection.collapsed(offset: formatted.length),
      );
    } catch (e) {
      return oldValue; // Return old value on error
    }
  }
}
