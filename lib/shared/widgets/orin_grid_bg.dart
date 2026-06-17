import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

/// Cyberpunk grid background with subtle neon grid lines and radial glow.
class OrinGridBg extends StatelessWidget {
  final Widget child;
  const OrinGridBg({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(color: OrinColors.bg),
      child: Stack(
        children: [
          // Grid pattern
          Positioned.fill(
            child: CustomPaint(painter: _CyberGridPainter()),
          ),
          // Radial glow overlay — top-right pink
          Positioned(
            top: -80,
            right: -80,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    OrinColors.primary.withValues(alpha: 0.06),
                    OrinColors.primary.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),
          // Radial glow overlay — bottom-left cyan
          Positioned(
            bottom: -60,
            left: -60,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    OrinColors.secondary.withValues(alpha: 0.04),
                    OrinColors.secondary.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }
}

class _CyberGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = OrinColors.border.withValues(alpha: 0.15)
      ..strokeWidth = 0.5;

    const spacing = 40.0;

    // Vertical lines
    for (double x = 0; x < size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }

    // Horizontal lines
    for (double y = 0; y < size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
