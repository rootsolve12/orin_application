import 'package:flutter/material.dart';
import 'event_model.dart';
import '../../../core/theme/app_theme.dart';

extension EventCategoryX on EventCategory {
  String get label => switch (this) {
    EventCategory.hackathon  => 'Hackathon',
    EventCategory.cultural   => 'Cultural',
    EventCategory.technical  => 'Technical',
    EventCategory.sports     => 'Sports',
    EventCategory.workshop   => 'Workshop',
    EventCategory.other      => 'Other',
  };

  String get shortLabel => switch (this) {
    EventCategory.hackathon  => 'HACK',
    EventCategory.cultural   => 'CULTURAL',
    EventCategory.technical  => 'TECH',
    EventCategory.sports     => 'SPORTS',
    EventCategory.workshop   => 'WORKSHOP',
    EventCategory.other      => 'OTHER',
  };

  Color get accent => switch (this) {
    EventCategory.hackathon  => OrinColors.primary,      // Neon Pink
    EventCategory.cultural   => OrinColors.neonYellow,    // Neon Yellow
    EventCategory.technical  => OrinColors.secondary,     // Electric Cyan
    EventCategory.sports     => OrinColors.neonOrange,    // Hot Orange
    EventCategory.workshop   => OrinColors.accent,        // Hot Violet
    EventCategory.other      => OrinColors.muted,
  };

  String get emoji => switch (this) {
    EventCategory.hackathon  => '⚡',
    EventCategory.cultural   => '🎭',
    EventCategory.technical  => '🔧',
    EventCategory.sports     => '🏆',
    EventCategory.workshop   => '📚',
    EventCategory.other      => '✦',
  };

  Color get bgColor => accent.withValues(alpha: 0.12);
}

extension EventModeX on EventMode {
  String get label => switch (this) {
    EventMode.offline => '📍 Offline',
    EventMode.online  => '🌐 Online',
    EventMode.hybrid  => '⚡ Hybrid',
  };
}