import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';

class OrinTag extends StatelessWidget {
  final String label;
  final Color? color;
  const OrinTag(this.label, {super.key, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? OrinColors.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: c.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: c.withValues(alpha: 0.15),
            blurRadius: 8,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Text(
        label.toUpperCase(),
        style: GoogleFonts.spaceMono(
          fontSize: 9,
          letterSpacing: 1,
          color: c,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
