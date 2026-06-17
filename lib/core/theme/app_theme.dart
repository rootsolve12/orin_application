import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// CYBERPUNK NIGHT CITY THEME — ORIN
/// ═══════════════════════════════════════════════════════════════════════════
class OrinColors {
  OrinColors._();

  // ── Primary Neons ──────────────────────────────────────────────────────
  static const primary     = Color(0xFF7B61FF); // Vibrant Purple
  static const primaryDark = Color(0xFF5A45D1);
  static const secondary   = Color(0xFF00F0FF); // Electric Cyan
  static const accent      = Color(0xFFB24BF3); // Hot Violet
  static const accent2     = Color(0xFFCB6CE6); // Light Violet
  static const neonYellow  = Color(0xFFF8E71C); // Neon Yellow
  static const neonOrange  = Color(0xFFFF6B35); // Hot Orange
  static const accentTeal  = Color(0xFF00F0FF); // Alias for secondary

  // ── Backgrounds ────────────────────────────────────────────────────────
  static const bg          = Color(0xFF0A0A1A); // Deep Space
  static const bgLight     = Color(0xFFF8F9FA); // Very light gray for dashboard
  static const surface     = Color(0xFF121228); // Dark Panel
  static const surface2    = Color(0xFF1A1A3E); // Elevated Panel
  static const surfaceGlass = Color(0x33121228); // Glassmorphism

  // ── Borders ────────────────────────────────────────────────────────────
  static const border      = Color(0xFF2A2A5A); // Dim border
  static const border2     = Color(0xFF2A2A5A); // Alias
  static const borderGlow  = Color(0x55FF2D7B); // Neon pink glow border

  // ── Text ───────────────────────────────────────────────────────────────
  static const text        = Color(0xFFF0F0FF); // Bright
  static const textDark    = Color(0xFFF0F0FF);
  static const muted       = Color(0xFF7B7BA8); // Muted lavender
  static const mutedDark   = Color(0xFF7B7BA8);
  static const dim         = Color(0xFF4A4A6A); // Very dim

  // ── Semantic ───────────────────────────────────────────────────────────
  static const success     = Color(0xFF00E676);
  static const warning     = Color(0xFFF8E71C);
  static const error       = Color(0xFFFF4757);
  static const info        = Color(0xFF00F0FF);

  // ── Light mode aliases (for dashboard) ─────────────────────────────
  static const surfaceLight = Color(0xFFFFFFFF);
  static const borderLight  = Color(0xFFEBEBF0);
  static const textLight    = Color(0xFF1A1C29);
  static const mutedLight   = Color(0xFF8E8E9F);

  // ── Glow utilities ─────────────────────────────────────────────────────
  static List<BoxShadow> neonGlow(Color color, {double blur = 12, double spread = 0}) => [
    BoxShadow(color: color.withValues(alpha: 0.6), blurRadius: blur, spreadRadius: spread),
    BoxShadow(color: color.withValues(alpha: 0.2), blurRadius: blur * 2, spreadRadius: spread),
  ];

  static List<BoxShadow> get primaryGlow => neonGlow(primary);
  static List<BoxShadow> get cyanGlow    => neonGlow(secondary);
  static List<BoxShadow> get violetGlow  => neonGlow(accent);

  static LinearGradient get neonGradient => const LinearGradient(
    colors: [primary, accent, secondary],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient get pinkCyanGradient => const LinearGradient(
    colors: [primary, secondary],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
}

class AppTheme {
  static TextTheme _buildTextTheme(Color textColor, Color mutedColor) {
    return GoogleFonts.interTextTheme().copyWith(
      displayLarge:   GoogleFonts.inter(fontWeight: FontWeight.w800, color: textColor),
      displayMedium:  GoogleFonts.inter(fontWeight: FontWeight.w800, color: textColor),
      headlineLarge:  GoogleFonts.inter(fontWeight: FontWeight.w700, color: textColor),
      headlineMedium: GoogleFonts.inter(fontWeight: FontWeight.w700, color: textColor),
      titleLarge:     GoogleFonts.inter(fontWeight: FontWeight.w600, color: textColor),
      bodyLarge:      GoogleFonts.inter(color: textColor, fontSize: 16),
      bodyMedium:     GoogleFonts.inter(color: mutedColor, fontSize: 14),
      labelSmall:     GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: mutedColor),
    );
  }

  static InputDecorationTheme _inputTheme(Color fillColor, Color borderColor, Color primaryColor) => InputDecorationTheme(
    filled: true,
    fillColor: fillColor,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: borderColor),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: borderColor),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: primaryColor, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: OrinColors.error, width: 1),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    labelStyle: const TextStyle(color: OrinColors.muted),
    hintStyle: TextStyle(color: OrinColors.muted.withValues(alpha: 0.6)),
  );

  static ThemeData get light => ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: OrinColors.bgLight,
    colorScheme: ColorScheme.light(
      primary:   OrinColors.primary,
      secondary: OrinColors.secondary,
      surface:   OrinColors.surfaceLight,
      onPrimary: Colors.white,
      onSurface: OrinColors.textLight,
      error:     OrinColors.error,
    ),
    hintColor: OrinColors.mutedLight,
    dividerColor: OrinColors.borderLight,
    textTheme: _buildTextTheme(OrinColors.textLight, OrinColors.mutedLight),
    appBarTheme: AppBarTheme(
      backgroundColor: OrinColors.bgLight,
      elevation: 0,
      centerTitle: false,
      iconTheme: const IconThemeData(color: OrinColors.textLight),
      titleTextStyle: GoogleFonts.inter(
        color: OrinColors.textLight, fontSize: 18, fontWeight: FontWeight.w700,
      ),
      systemOverlayStyle: SystemUiOverlayStyle.dark,
    ),
    inputDecorationTheme: _inputTheme(OrinColors.surfaceLight, OrinColors.borderLight, OrinColors.primary),
    elevatedButtonTheme: _buttonTheme(OrinColors.primary),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: OrinColors.primary,
        side: const BorderSide(color: OrinColors.primary, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        minimumSize: const Size(double.infinity, 52),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: OrinColors.primary,
      foregroundColor: Colors.white,
      elevation: 4,
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: OrinColors.textLight,
      contentTextStyle: GoogleFonts.inter(color: Colors.white, fontSize: 13),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      behavior: SnackBarBehavior.floating,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: OrinColors.bgLight,
      side: const BorderSide(color: OrinColors.borderLight),
      labelStyle: GoogleFonts.inter(fontSize: 12, color: OrinColors.mutedLight),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: OrinColors.surfaceLight,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  );

  static ThemeData get dark => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: OrinColors.bg,
    colorScheme: ColorScheme.dark(
      primary:   OrinColors.primary,
      secondary: OrinColors.secondary,
      tertiary:  OrinColors.accent,
      surface:   OrinColors.surface,
      onPrimary: Colors.white,
      onSurface: OrinColors.text,
      error:     OrinColors.error,
    ),
    hintColor: OrinColors.muted,
    dividerColor: OrinColors.border,
    textTheme: _buildTextTheme(OrinColors.text, OrinColors.muted),
    appBarTheme: AppBarTheme(
      backgroundColor: OrinColors.bg,
      elevation: 0,
      centerTitle: true,
      iconTheme: const IconThemeData(color: OrinColors.text),
      titleTextStyle: GoogleFonts.inter(
        color: OrinColors.text, fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 1,
      ),
      systemOverlayStyle: SystemUiOverlayStyle.light,
    ),
    inputDecorationTheme: _inputTheme(OrinColors.surface2, OrinColors.border, OrinColors.primary),
    elevatedButtonTheme: _buttonTheme(OrinColors.primary),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: OrinColors.secondary,
        side: const BorderSide(color: OrinColors.secondary, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        minimumSize: const Size(double.infinity, 52),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: OrinColors.primary,
      foregroundColor: Colors.white,
      elevation: 4,
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: OrinColors.surface2,
      contentTextStyle: GoogleFonts.inter(color: OrinColors.text, fontSize: 13),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      behavior: SnackBarBehavior.floating,
    ),
    sliderTheme: const SliderThemeData(
      activeTrackColor: OrinColors.primary,
      inactiveTrackColor: OrinColors.border,
      thumbColor: OrinColors.primary,
      overlayColor: Color(0x33FF2D7B),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((s) =>
        s.contains(WidgetState.selected) ? OrinColors.secondary : OrinColors.muted),
      trackColor: WidgetStateProperty.resolveWith((s) =>
        s.contains(WidgetState.selected) ? OrinColors.secondary.withValues(alpha: 0.3) : OrinColors.border),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: OrinColors.surface2,
      side: const BorderSide(color: OrinColors.border),
      labelStyle: GoogleFonts.inter(fontSize: 12, color: OrinColors.muted),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: OrinColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  );

  static ElevatedButtonThemeData _buttonTheme(Color color) => ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: color,
      foregroundColor: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      minimumSize: const Size(double.infinity, 52),
      textStyle: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15, letterSpacing: 0.5),
    ),
  );
}
