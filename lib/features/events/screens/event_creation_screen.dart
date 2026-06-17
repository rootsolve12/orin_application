import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_grid_bg.dart';
import '../../../shared/widgets/orin_tag.dart';
import '../models/event_model.dart';
import '../models/event_category_meta.dart';
import '../providers/events_provider.dart';
import '../../auth/providers/auth_provider.dart';
import 'package:geolocator/geolocator.dart';

class EventCreationScreen extends ConsumerStatefulWidget {
  final String? eventId;
  const EventCreationScreen({super.key, this.eventId});
  @override
  ConsumerState<EventCreationScreen> createState() =>
      _EventCreationScreenState();
}

class _EventCreationScreenState extends ConsumerState<EventCreationScreen> {
  int _step = 0;
  static const int _totalSteps = 5;

  // Step 0 — Basic info
  final _titleCtrl    = TextEditingController();
  final _venueCtrl    = TextEditingController();
  EventCategory _category   = EventCategory.hackathon;
  EventMode     _mode       = EventMode.offline;
  double? _latitude;
  double? _longitude;
  bool _fetchingLocation = false;

  // Step 1 — Description
  final _descCtrl     = TextEditingController();
  final _eligCtrl     = TextEditingController();
  final _prizeCtrl    = TextEditingController();

  // Step 2 — Schedule
  DateTime _startDate = DateTime.now().add(const Duration(days: 7));
  DateTime _endDate   = DateTime.now().add(const Duration(days: 8));
  DateTime _deadline  = DateTime.now().add(const Duration(days: 5));

  // Step 3 — Registration settings
  int  _capacity          = 100;
  bool _approvalRequired  = false;
  bool _openToAll         = true;
  ParticipationMode _partMode = ParticipationMode.individual;
  int  _minTeam = 2;
  int  _maxTeam = 4;

  // Step 4 — Tags
  final Set<String> _tags = {};
  static const _suggestedTags = [
    'AI/ML', 'Web Dev', 'Mobile', 'Blockchain', 'Cloud',
    'IoT', 'Cybersecurity', 'UI/UX', 'Data Science', 'Open Source',
  ];

  bool _publishing = false;

  @override
  void initState() {
    super.initState();
    if (widget.eventId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadEventData());
    }
  }

  Future<void> _loadEventData() async {
    final db = ref.read(firestoreProvider);
    final doc = await db.collection('events').doc(widget.eventId).get();
    if (!doc.exists) return;
    final event = EventModel.fromFirestore(doc);
    setState(() {
      _titleCtrl.text = event.title;
      _venueCtrl.text = event.venue ?? '';
      _category = event.category;
      _mode = event.mode;
      _descCtrl.text = event.description;
      _eligCtrl.text = event.eligibility ?? '';
      _prizeCtrl.text = event.prize ?? '';
      _startDate = event.startDate;
      _endDate = event.endDate;
      _deadline = event.registrationDeadline;
      _capacity = event.capacity;
      _approvalRequired = event.approvalRequired;
      _openToAll = event.openToOtherColleges;
      _partMode = event.participationMode;
      _minTeam = event.minTeamSize ?? 2;
      _maxTeam = event.maxTeamSize ?? 4;
      _tags.clear();
      _tags.addAll(event.tags);
    });
  }

  @override
  void dispose() {
    for (final c in [_titleCtrl, _venueCtrl, _descCtrl,
      _eligCtrl, _prizeCtrl]) c.dispose();
    super.dispose();
  }

  Future<void> _publish() async {
    setState(() => _publishing = true);
    final svc  = ref.read(eventServiceProvider);
    final user = ref.read(authServiceProvider).currentUser!;

    final userData = ref.read(userDocProvider).valueOrNull?.data() as Map<String, dynamic>?;
    final institution = userData?['institution'] as String? ?? 'My College';

    final event = EventModel(
      id:                   widget.eventId ?? '',
      title:                _titleCtrl.text.trim(),
      description:          _descCtrl.text.trim(),
      organizerId:          user.uid,
      organizerName:        userData != null ? '${userData['firstName']} ${userData['lastName']}' : 'Organizer',
      institution:          institution,
      category:             _category,
      mode:                 _mode,
      state:                EventState.open,
      participationMode:    _partMode,
      tags:                 _tags.toList(),
      venue:                _venueCtrl.text.isEmpty ? null : _venueCtrl.text,
      latitude:             _latitude,
      longitude:            _longitude,
      startDate:            _startDate,
      endDate:              _endDate,
      registrationDeadline: _deadline,
      capacity:             _capacity,
      registeredCount:      0,
      approvalRequired:     _approvalRequired,
      openToOtherColleges:  _openToAll,
      prize:                _prizeCtrl.text.isEmpty ? null : _prizeCtrl.text,
      eligibility:          _eligCtrl.text.isEmpty ? null : _eligCtrl.text,
      minTeamSize:          _partMode != ParticipationMode.individual ? _minTeam : null,
      maxTeamSize:          _partMode != ParticipationMode.individual ? _maxTeam : null,
      createdAt:            DateTime.now(),
    );

    try {
      if (widget.eventId != null) {
        await svc.updateEvent(widget.eventId!, event.toFirestore());
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Event updated successfully!'), backgroundColor: OrinColors.secondary),
          );
          context.pop();
        }
      } else {
        final id = await svc.createEvent(event);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Event created successfully!'), backgroundColor: OrinColors.secondary),
          );
          context.go('/event/$id');
        }
      }
    } catch (e) {
      setState(() => _publishing = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          backgroundColor: Colors.redAccent,
          content: Text(e.toString(),
              style: GoogleFonts.dmMono(color: Colors.white)),
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: OrinColors.bg,
      body: OrinGridBg(
        child: SafeArea(
          child: Column(
            children: [
              // Header + step pips
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      GestureDetector(
                        onTap: _step > 0
                            ? () => setState(() => _step--)
                            : () => Navigator.pop(context),
                        child: const Icon(Icons.arrow_back,
                            color: OrinColors.muted, size: 20),
                      ),
                      const Spacer(),
                      Text('${_step + 1} / $_totalSteps',
                          style: GoogleFonts.dmMono(
                              fontSize: 11, color: OrinColors.muted)),
                    ]),
                    const SizedBox(height: 12),
                    Row(
                      children: List.generate(_totalSteps, (i) => Expanded(
                        child: Container(
                          height: 3,
                          margin: EdgeInsets.only(right: i < _totalSteps - 1 ? 6 : 0),
                          decoration: BoxDecoration(
                            color: i < _step
                                ? OrinColors.accent
                                : i == _step
                                ? OrinColors.accentTeal
                                : OrinColors.dim,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      )),
                    ),
                  ],
                ),
              ),

              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: _buildStep(),
                ),
              ),

              // CTA
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                child: ElevatedButton(
                  onPressed: _publishing ? null :
                  _step < _totalSteps - 1
                      ? () => setState(() => _step++)
                      : _publish,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _step == _totalSteps - 1
                        ? OrinColors.accentTeal
                        : OrinColors.accent,
                  ),
                  child: _publishing
                      ? const SizedBox(width: 20, height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                      : Text(_step < _totalSteps - 1
                      ? 'NEXT →'
                      : 'PUBLISH EVENT →'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep() {
    return switch (_step) {
      0 => _StepBasicInfo(
        titleCtrl: _titleCtrl, venueCtrl: _venueCtrl,
        category: _category, mode: _mode,
        onCategory: (v) => setState(() => _category = v),
        onMode: (v) => setState(() => _mode = v),
        fetchingLocation: _fetchingLocation,
        latitude: _latitude,
        longitude: _longitude,
        onGetLocation: () async {
          setState(() => _fetchingLocation = true);
          try {
            bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
            if (!serviceEnabled) throw Exception('Location services are disabled.');
            LocationPermission permission = await Geolocator.checkPermission();
            if (permission == LocationPermission.denied) {
              permission = await Geolocator.requestPermission();
              if (permission == LocationPermission.denied) throw Exception('Location permissions are denied');
            }
            if (permission == LocationPermission.deniedForever) throw Exception('Location permissions are permanently denied.');
            final pos = await Geolocator.getCurrentPosition();
            setState(() {
              _latitude = pos.latitude;
              _longitude = pos.longitude;
            });
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.redAccent));
            }
          } finally {
            setState(() => _fetchingLocation = false);
          }
        },
      ),
      1 => _StepDescription(
        descCtrl: _descCtrl, eligCtrl: _eligCtrl, prizeCtrl: _prizeCtrl,
      ),
      2 => _StepSchedule(
        startDate: _startDate, endDate: _endDate, deadline: _deadline,
        onStart: (v) => setState(() => _startDate = v),
        onEnd: (v) => setState(() => _endDate = v),
        onDeadline: (v) => setState(() => _deadline = v),
      ),
      3 => _StepRegistration(
        capacity: _capacity, approvalRequired: _approvalRequired,
        openToAll: _openToAll, partMode: _partMode,
        minTeam: _minTeam, maxTeam: _maxTeam,
        onCapacity: (v) => setState(() => _capacity = v),
        onApproval: (v) => setState(() => _approvalRequired = v),
        onOpenToAll: (v) => setState(() => _openToAll = v),
        onPartMode: (v) => setState(() => _partMode = v),
        onMinTeam: (v) => setState(() => _minTeam = v),
        onMaxTeam: (v) => setState(() => _maxTeam = v),
      ),
      _ => _StepTags(
        tags: _tags, suggested: _suggestedTags,
        onToggle: (t) => setState(() =>
        _tags.contains(t) ? _tags.remove(t) : _tags.add(t)),
      ),
    };
  }
}

// ── Step widgets ───────────────────────────────────────────────────────────

class _StepBasicInfo extends StatelessWidget {
  final TextEditingController titleCtrl, venueCtrl;
  final EventCategory category;
  final EventMode mode;
  final ValueChanged<EventCategory> onCategory;
  final ValueChanged<EventMode> onMode;
  final bool fetchingLocation;
  final double? latitude;
  final double? longitude;
  final VoidCallback onGetLocation;

  const _StepBasicInfo({
    required this.titleCtrl, required this.venueCtrl,
    required this.category, required this.mode,
    required this.onCategory, required this.onMode,
    required this.fetchingLocation,
    required this.latitude, required this.longitude,
    required this.onGetLocation,
  });

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const OrinTag('STEP 1 OF 5 — BASIC INFO'),
      const SizedBox(height: 16),
      Text('Event Details',
          style: GoogleFonts.syne(
              fontSize: 28, fontWeight: FontWeight.w800, color: OrinColors.text)),
      const SizedBox(height: 24),
      _Field(ctrl: titleCtrl, label: 'EVENT TITLE',
          hint: 'e.g. CodeStorm 2026'),
      const SizedBox(height: 14),
      // Category dropdown
      _DropdownField<EventCategory>(
        label: 'CATEGORY',
        value: category,
        items: EventCategory.values,
        itemLabel: (c) => c.label,
        onChanged: onCategory,
      ),
      const SizedBox(height: 14),
      _DropdownField<EventMode>(
        label: 'EVENT MODE',
        value: mode,
        items: EventMode.values,
        itemLabel: (m) => m.label,
        onChanged: onMode,
      ),
      const SizedBox(height: 14),
      _Field(ctrl: venueCtrl, label: 'VENUE (optional)',
          hint: 'e.g. Main Auditorium, SRM Chennai'),
      const SizedBox(height: 14),
      if (mode != EventMode.online) ...[
        Row(
          children: [
            Expanded(
              child: Text(
                latitude != null 
                  ? 'Location: ${latitude!.toStringAsFixed(4)}, ${longitude!.toStringAsFixed(4)}' 
                  : 'No map location set',
                style: GoogleFonts.dmMono(fontSize: 12, color: OrinColors.dim),
              ),
            ),
            TextButton.icon(
              onPressed: fetchingLocation ? null : onGetLocation,
              icon: fetchingLocation 
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.location_on, size: 16, color: OrinColors.secondary),
              label: Text('USE CURRENT LOCATION', style: GoogleFonts.dmMono(fontSize: 10, fontWeight: FontWeight.w700, color: OrinColors.secondary)),
            ),
          ],
        ),
      ],
      const SizedBox(height: 24),
    ]);
  }
}

class _StepDescription extends StatelessWidget {
  final TextEditingController descCtrl, eligCtrl, prizeCtrl;
  const _StepDescription({
    required this.descCtrl, required this.eligCtrl, required this.prizeCtrl});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const OrinTag('STEP 2 OF 5 — DESCRIPTION'),
      const SizedBox(height: 16),
      Text('About the Event',
          style: GoogleFonts.syne(
              fontSize: 28, fontWeight: FontWeight.w800, color: OrinColors.text)),
      const SizedBox(height: 24),
      // AI generate button
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: OrinColors.accent.withValues(alpha: 0.08),
          border: Border.all(color: OrinColors.accent.withValues(alpha: 0.25)),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [
          const Text('✦', style: TextStyle(fontSize: 16, color: OrinColors.accent2)),
          const SizedBox(width: 10),
          Expanded(child: Text('Generate description with AI',
              style: GoogleFonts.dmMono(
                  fontSize: 11, color: OrinColors.accent2))),
          // Phase 3: wire Claude API here
          const Icon(Icons.arrow_forward_ios,
              color: OrinColors.accent2, size: 12),
        ]),
      ),
      const SizedBox(height: 14),
      _Field(ctrl: descCtrl, label: 'DESCRIPTION',
          hint: 'What is your event about?', maxLines: 5),
      const SizedBox(height: 14),
      _Field(ctrl: eligCtrl, label: 'ELIGIBILITY (optional)',
          hint: 'e.g. 2nd year and above, CSE/IT branches', maxLines: 2),
      const SizedBox(height: 14),
      _Field(ctrl: prizeCtrl, label: 'PRIZES (optional)',
          hint: 'e.g. ₹50,000 cash + internship fast-track'),
      const SizedBox(height: 24),
    ]);
  }
}

class _StepSchedule extends StatelessWidget {
  final DateTime startDate, endDate, deadline;
  final ValueChanged<DateTime> onStart, onEnd, onDeadline;

  const _StepSchedule({
    required this.startDate, required this.endDate, required this.deadline,
    required this.onStart, required this.onEnd, required this.onDeadline,
  });

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const OrinTag('STEP 3 OF 5 — SCHEDULE'),
      const SizedBox(height: 16),
      Text('Dates & Timing',
          style: GoogleFonts.syne(
              fontSize: 28, fontWeight: FontWeight.w800, color: OrinColors.text)),
      const SizedBox(height: 24),
      _DateField(label: 'START DATE', date: startDate,
          onPick: (v) => onStart(v)),
      const SizedBox(height: 14),
      _DateField(label: 'END DATE', date: endDate,
          onPick: (v) => onEnd(v)),
      const SizedBox(height: 14),
      _DateField(label: 'REGISTRATION DEADLINE', date: deadline,
          onPick: (v) => onDeadline(v)),
      const SizedBox(height: 24),
    ]);
  }
}

class _StepRegistration extends StatelessWidget {
  final int capacity, minTeam, maxTeam;
  final bool approvalRequired, openToAll;
  final ParticipationMode partMode;
  final ValueChanged<int> onCapacity, onMinTeam, onMaxTeam;
  final ValueChanged<bool> onApproval, onOpenToAll;
  final ValueChanged<ParticipationMode> onPartMode;

  const _StepRegistration({
    required this.capacity, required this.approvalRequired,
    required this.openToAll, required this.partMode,
    required this.minTeam, required this.maxTeam,
    required this.onCapacity, required this.onApproval,
    required this.onOpenToAll, required this.onPartMode,
    required this.onMinTeam, required this.onMaxTeam,
  });

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const OrinTag('STEP 4 OF 5 — REGISTRATION'),
      const SizedBox(height: 16),
      Text('Registration\nSettings',
          style: GoogleFonts.syne(
              fontSize: 28, fontWeight: FontWeight.w800,
              color: OrinColors.text, height: 1.1)),
      const SizedBox(height: 24),
      // Capacity slider
      Text('CAPACITY  ·  $capacity participants',
          style: GoogleFonts.dmMono(
              fontSize: 9, letterSpacing: 0.1, color: OrinColors.muted)),
      const SizedBox(height: 8),
      Slider(
        value: capacity.toDouble(),
        min: 10, max: 2000,
        divisions: 199,
        activeColor: OrinColors.accent,
        inactiveColor: OrinColors.border,
        onChanged: (v) => onCapacity(v.toInt()),
      ),
      const SizedBox(height: 14),
      // Participation mode
      _DropdownField<ParticipationMode>(
        label: 'PARTICIPATION MODE',
        value: partMode,
        items: ParticipationMode.values,
        itemLabel: (m) => m.name[0].toUpperCase() + m.name.substring(1),
        onChanged: onPartMode,
      ),
      if (partMode != ParticipationMode.individual) ...[
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: _NumericField(
              label: 'MIN TEAM SIZE', value: minTeam,
              onChanged: onMinTeam)),
          const SizedBox(width: 12),
          Expanded(child: _NumericField(
              label: 'MAX TEAM SIZE', value: maxTeam,
              onChanged: onMaxTeam)),
        ]),
      ],
      const SizedBox(height: 16),
      _ToggleRow('Approval-based registration',
          'Manually approve each registration',
          approvalRequired, onApproval),
      const SizedBox(height: 8),
      _ToggleRow('Open to other colleges',
          'Students from other institutions can join',
          openToAll, onOpenToAll),
      const SizedBox(height: 24),
    ]);
  }
}

class _StepTags extends StatelessWidget {
  final Set<String> tags;
  final List<String> suggested;
  final ValueChanged<String> onToggle;

  const _StepTags({
    required this.tags, required this.suggested, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const OrinTag('STEP 5 OF 5 — TAGS'),
      const SizedBox(height: 16),
      Text('Add Tags',
          style: GoogleFonts.syne(
              fontSize: 28, fontWeight: FontWeight.w800, color: OrinColors.text)),
      const SizedBox(height: 8),
      Text('Tags improve discovery in search and AI recommendations',
          style: GoogleFonts.dmMono(
              fontSize: 11, color: OrinColors.muted)),
      const SizedBox(height: 20),
      Wrap(spacing: 8, runSpacing: 8,
        children: suggested.map((t) {
          final on = tags.contains(t);
          return GestureDetector(
            onTap: () => onToggle(t),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: on
                    ? OrinColors.accent.withValues(alpha: 0.15)
                    : OrinColors.surface2,
                border: Border.all(
                    color: on
                        ? OrinColors.accent.withValues(alpha: 0.5)
                        : OrinColors.border2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(t,
                  style: GoogleFonts.dmMono(
                      fontSize: 11,
                      color: on ? OrinColors.accent2 : OrinColors.muted)),
            ),
          );
        }).toList(),
      ),
      const SizedBox(height: 24),
    ]);
  }
}

// ── Reusable field widgets ─────────────────────────────────────────────────

class _Field extends StatelessWidget {
  final TextEditingController ctrl;
  final String label;
  final String? hint;
  final int maxLines;

  const _Field({
    required this.ctrl, required this.label,
    this.hint, this.maxLines = 1});

  @override
  Widget build(BuildContext context) => TextFormField(
    controller: ctrl,
    maxLines: maxLines,
    style: const TextStyle(color: OrinColors.text, fontSize: 13),
    decoration: InputDecoration(
        labelText: label, hintText: hint),
  );
}

class _DropdownField<T> extends StatelessWidget {
  final String label;
  final T value;
  final List<T> items;
  final String Function(T) itemLabel;
  final ValueChanged<T> onChanged;

  const _DropdownField({
    required this.label, required this.value, required this.items,
    required this.itemLabel, required this.onChanged});

  @override
  Widget build(BuildContext context) => DropdownButtonFormField<T>(
    value: value,
    dropdownColor: OrinColors.surface2,
    style: const TextStyle(color: OrinColors.text, fontSize: 13),
    decoration: InputDecoration(labelText: label),
    items: items.map((i) => DropdownMenuItem(
        value: i, child: Text(itemLabel(i)))).toList(),
    onChanged: (v) => v != null ? onChanged(v) : null,
  );
}

class _DateField extends StatelessWidget {
  final String label;
  final DateTime date;
  final ValueChanged<DateTime> onPick;

  const _DateField({
    required this.label, required this.date, required this.onPick});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () async {
      final picked = await showDatePicker(
        context: context,
        initialDate: date,
        firstDate: DateTime.now(),
        lastDate: DateTime.now().add(const Duration(days: 365)),
        builder: (ctx, child) => Theme(
          data: Theme.of(ctx).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: OrinColors.accent,
              surface: OrinColors.surface2,
            ),
          ),
          child: child!,
        ),
      );
      if (picked != null) onPick(picked);
    },
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: OrinColors.surface2,
        border: Border.all(color: OrinColors.border2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label,
              style: GoogleFonts.dmMono(
                  fontSize: 9, color: OrinColors.accent,
                  letterSpacing: 0.1)),
          const SizedBox(height: 3),
          Text(
              '${date.day}/${date.month}/${date.year}',
              style: const TextStyle(
                  color: OrinColors.text, fontSize: 13)),
        ]),
        const Spacer(),
        const Icon(Icons.calendar_today_outlined,
            color: OrinColors.muted, size: 16),
      ]),
    ),
  );
}

class _NumericField extends StatelessWidget {
  final String label;
  final int value;
  final ValueChanged<int> onChanged;

  const _NumericField({
    required this.label, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(
      color: OrinColors.surface2,
      border: Border.all(color: OrinColors.border2),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label,
          style: GoogleFonts.dmMono(
              fontSize: 9, color: OrinColors.accent, letterSpacing: 0.1)),
      Row(children: [
        GestureDetector(
            onTap: () { if (value > 1) onChanged(value - 1); },
            child: const Icon(Icons.remove,
                color: OrinColors.muted, size: 18)),
        Expanded(child: Text('$value',
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: OrinColors.text, fontSize: 16))),
        GestureDetector(
            onTap: () => onChanged(value + 1),
            child: const Icon(Icons.add,
                color: OrinColors.muted, size: 18)),
      ]),
    ]),
  );
}

class _ToggleRow extends StatelessWidget {
  final String title, subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleRow(this.title, this.subtitle, this.value, this.onChanged);

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    decoration: BoxDecoration(
      color: OrinColors.surface,
      border: Border.all(color: OrinColors.border2),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(children: [
      Expanded(child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: GoogleFonts.syne(
                  fontSize: 12, fontWeight: FontWeight.w700,
                  color: OrinColors.text)),
          Text(subtitle,
              style: GoogleFonts.dmMono(
                  fontSize: 10, color: OrinColors.muted)),
        ],
      )),
      Switch(
        value: value,
        activeThumbColor: OrinColors.accentTeal,
        onChanged: onChanged,
      ),
    ]),
  );
}