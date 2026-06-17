import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier();
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  // Enforce Light Mode explicitly per user request
  ThemeModeNotifier() : super(ThemeMode.light);

  Future<void> _loadTheme() async {
    // No longer load preferences, strictly use light
    state = ThemeMode.light;
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    // Ignore any attempts to change theme, keep it light
    state = ThemeMode.light;
  }
}
