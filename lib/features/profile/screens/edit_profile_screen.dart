import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_grid_bg.dart';
import '../../auth/providers/auth_provider.dart';

const _allInterests = [
  'Hackathons', 'AI/ML', 'Web Dev', 'Cultural', 'Sports',
  'Design', 'Robotics', 'Finance', 'Music', 'Gaming',
  'Research', 'Entrepreneurship',
];

const _years = ['1st', '2nd', '3rd', '4th', 'PG'];

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _firstCtrl;
  late TextEditingController _lastCtrl;
  late TextEditingController _deptCtrl;
  late TextEditingController _branchCtrl;
  late TextEditingController _rollCtrl;
  late TextEditingController _bioCtrl;
  late TextEditingController _linkedinCtrl;
  late TextEditingController _githubCtrl;
  late TextEditingController _portfolioCtrl;

  String _year = '2nd';
  final Set<String> _interests = {};
  bool _loading = false;
  bool _initialized = false;
  String? _photoUrl;
  File? _selectedImage;

  @override
  void initState() {
    super.initState();
    _firstCtrl = TextEditingController();
    _lastCtrl = TextEditingController();
    _deptCtrl = TextEditingController();
    _branchCtrl = TextEditingController();
    _rollCtrl = TextEditingController();
    _bioCtrl = TextEditingController();
    _linkedinCtrl = TextEditingController();
    _githubCtrl = TextEditingController();
    _portfolioCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _firstCtrl.dispose();
    _lastCtrl.dispose();
    _deptCtrl.dispose();
    _branchCtrl.dispose();
    _rollCtrl.dispose();
    _bioCtrl.dispose();
    _linkedinCtrl.dispose();
    _githubCtrl.dispose();
    _portfolioCtrl.dispose();
    super.dispose();
  }

  void _initFields(Map<String, dynamic> data) {
    if (_initialized) return;
    _firstCtrl.text = data['firstName'] ?? '';
    _lastCtrl.text = data['lastName'] ?? '';
    _deptCtrl.text = data['department'] ?? '';
    _branchCtrl.text = data['branch'] ?? '';
    _rollCtrl.text = data['rollNumber'] ?? '';
    _bioCtrl.text = data['bio'] ?? '';
    _linkedinCtrl.text = data['linkedin'] ?? '';
    _githubCtrl.text = data['github'] ?? '';
    _portfolioCtrl.text = data['portfolio'] ?? '';
    _year = data['year'] ?? '2nd';
    _photoUrl = data['photoUrl'];
    
    final savedInterests = data['interests'] as List<dynamic>?;
    if (savedInterests != null) {
      _interests.addAll(savedInterests.cast<String>());
    }
    _initialized = true;
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked != null) {
      setState(() {
        _selectedImage = File(picked.path);
      });
    }
  }

  Future<void> _saveProfile(String uid) async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    try {
      String? uploadedUrl = _photoUrl;

      // Upload image if selected
      if (_selectedImage != null) {
        final storageRef = FirebaseStorage.instance.ref().child('users/$uid/profile.jpg');
        final uploadTask = await storageRef.putFile(_selectedImage!);
        uploadedUrl = await uploadTask.ref.getDownloadURL();
      }

      await ref.read(firestoreProvider).collection('users').doc(uid).update({
        'firstName': _firstCtrl.text.trim(),
        'lastName': _lastCtrl.text.trim(),
        'department': _deptCtrl.text.trim(),
        'branch': _branchCtrl.text.trim(),
        'rollNumber': _rollCtrl.text.trim(),
        'bio': _bioCtrl.text.trim(),
        'linkedin': _linkedinCtrl.text.trim(),
        'github': _githubCtrl.text.trim(),
        'portfolio': _portfolioCtrl.text.trim(),
        'year': _year,
        'photoUrl': uploadedUrl,
        'interests': _interests.toList(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully!'), backgroundColor: OrinColors.secondary),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final userDocAsync = ref.watch(userDocProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: OrinColors.bg,
      appBar: AppBar(
        title: Text('EDIT PROFILE', style: GoogleFonts.syne(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 1)),
        centerTitle: true,
      ),
      body: OrinGridBg(
        child: userDocAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
          error: (e, _) => Center(child: Text('Error loading profile: $e')),
          data: (doc) {
            final data = doc?.data() as Map<String, dynamic>?;
            if (data == null) return const Center(child: Text('User document not found'));
            
            _initFields(data);

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Profile Photo
                    Center(
                      child: GestureDetector(
                        onTap: _pickImage,
                        child: Stack(
                          children: [
                            Container(
                              width: 100,
                              height: 100,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: OrinColors.primary.withValues(alpha: 0.3), width: 2),
                                image: _selectedImage != null
                                    ? DecorationImage(image: FileImage(_selectedImage!), fit: BoxFit.cover)
                                    : _photoUrl != null
                                        ? DecorationImage(image: NetworkImage(_photoUrl!), fit: BoxFit.cover)
                                        : null,
                              ),
                              child: (_selectedImage == null && _photoUrl == null)
                                  ? Icon(Icons.person_outline_rounded, color: theme.hintColor, size: 48)
                                  : null,
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: const BoxDecoration(color: OrinColors.primary, shape: BoxShape.circle),
                                child: const Icon(Icons.edit, color: Colors.white, size: 14),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // First & Last Name
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _firstCtrl,
                            decoration: const InputDecoration(labelText: 'First Name'),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextFormField(
                            controller: _lastCtrl,
                            decoration: const InputDecoration(labelText: 'Last Name'),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Bio
                    TextFormField(
                      controller: _bioCtrl,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Bio',
                        hintText: 'Tell us about yourself...',
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Department & Branch & Year
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _deptCtrl,
                            decoration: const InputDecoration(labelText: 'Department'),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextFormField(
                            controller: _branchCtrl,
                            decoration: const InputDecoration(labelText: 'Branch'),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _rollCtrl,
                            decoration: const InputDecoration(labelText: 'Roll Number'),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 16),
                        SizedBox(
                          width: 120,
                          child: DropdownButtonFormField<String>(
                            value: _year,
                            decoration: const InputDecoration(labelText: 'Year'),
                            items: _years.map((y) => DropdownMenuItem(value: y, child: Text(y))).toList(),
                            onChanged: (v) => setState(() => _year = v!),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Social links
                    Text(
                      'SOCIAL PROFILES',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: theme.hintColor, letterSpacing: 0.5),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _linkedinCtrl,
                      decoration: const InputDecoration(
                        labelText: 'LinkedIn URL',
                        prefixIcon: Icon(Icons.link, size: 20),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _githubCtrl,
                      decoration: const InputDecoration(
                        labelText: 'GitHub URL',
                        prefixIcon: Icon(Icons.code, size: 20),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _portfolioCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Portfolio URL',
                        prefixIcon: Icon(Icons.language, size: 20),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Interests
                    Text(
                      'INTERESTS / SKILLS',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: theme.hintColor, letterSpacing: 0.5),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _allInterests.map((tag) {
                        final on = _interests.contains(tag);
                        return GestureDetector(
                          onTap: () => setState(() => on ? _interests.remove(tag) : _interests.add(tag)),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: on ? OrinColors.primary : theme.colorScheme.surface,
                              border: Border.all(
                                color: on ? OrinColors.primary : theme.dividerColor.withValues(alpha: 0.1),
                              ),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              tag,
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: on ? FontWeight.w700 : FontWeight.w600,
                                color: on ? Colors.white : theme.colorScheme.onSurface.withValues(alpha: 0.7),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 48),

                    ElevatedButton(
                      onPressed: _loading ? null : () => _saveProfile(data['uid']),
                      child: _loading
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('SAVE PROFILE'),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
