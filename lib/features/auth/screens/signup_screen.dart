import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_grid_bg.dart';
import '../../../shared/widgets/orin_tag.dart';
import '../providers/auth_provider.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});
  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey      = GlobalKey<FormState>();
  final _firstCtrl    = TextEditingController();
  final _lastCtrl     = TextEditingController();
  final _emailCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _instCtrl     = TextEditingController();
  bool _loading       = false;
  bool _obscure       = true;
  String? _error;
  int _passwordStrength = 0;

  final int _currentStep = 1; 

  Future<void> _createAccount() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    try {
      final cred = await ref.read(authServiceProvider).signUpWithEmail(
          _emailCtrl.text.trim(), _passwordCtrl.text.trim());
      
      await ref.read(firestoreProvider)
          .collection('users')
          .doc(cred.user!.uid)
          .set({
        'uid':         cred.user!.uid,
        'firstName':   _firstCtrl.text.trim(),
        'lastName':    _lastCtrl.text.trim(),
        'email':       _emailCtrl.text.trim(),
        'institution': _instCtrl.text.trim(),
        'role':        '',         
        'createdAt':   FieldValue.serverTimestamp(),
        'profileComplete': false,
      });
    } on Exception catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    for (final c in [_firstCtrl, _lastCtrl, _emailCtrl, _passwordCtrl, _instCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  void _checkPasswordStrength(String value) {
    int strength = 0;
    if (value.length >= 8) strength++;
    if (value.contains(RegExp(r'[A-Z]'))) strength++;
    if (value.contains(RegExp(r'[0-9]'))) strength++;
    if (value.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) strength++;
    setState(() {
      _passwordStrength = strength;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: OrinGridBg(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _StepPips(total: 3, current: _currentStep),
                  const SizedBox(height: 24),
                  const Center(child: OrinTag('Account Creation')),
                  const SizedBox(height: 24),
                  Text('Join Orin',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 32, fontWeight: FontWeight.w800,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text('Enter your details to create an account',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontSize: 14, color: theme.hintColor),
                  ),
                  const SizedBox(height: 32),

                  Row(children: [
                    Expanded(child: TextFormField(
                      controller: _firstCtrl,
                      decoration: const InputDecoration(labelText: 'First Name'),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                    )),
                    const SizedBox(width: 12),
                    Expanded(child: TextFormField(
                      controller: _lastCtrl,
                      decoration: const InputDecoration(labelText: 'Last Name'),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                    )),
                  ]),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Email Address',
                      prefixIcon: Icon(Icons.email_outlined, size: 20),
                    ),
                    validator: (v) =>
                    (v == null || !v.contains('@')) ? 'Valid email required' : null,
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: _passwordCtrl,
                    obscureText: _obscure,
                    onChanged: _checkPasswordStrength,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline, size: 20),
                      suffixIcon: IconButton(
                        icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility,
                            color: theme.hintColor, size: 20),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                    validator: (v) =>
                    (v == null || v.length < 8) ? 'Min 8 characters' : null,
                  ),
                  if (_passwordCtrl.text.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    _PasswordStrengthMeter(strength: _passwordStrength),
                  ],
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: _instCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Institution',
                      prefixIcon: Icon(Icons.school_outlined, size: 20),
                    ),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),

                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red.withValues(alpha: 0.2)),
                      ),
                      child: Text(_error!,
                          style: GoogleFonts.inter(fontSize: 13, color: Colors.redAccent, fontWeight: FontWeight.w500)),
                    ),
                  ],

                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _loading ? null : _createAccount,
                    child: _loading
                        ? const SizedBox(width: 24, height: 24,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                        : const Text('Create Account'),
                  ),
                  const SizedBox(height: 24),
                  Center(
                    child: GestureDetector(
                      onTap: () => context.go('/login'),
                      child: RichText(
                        text: TextSpan(
                          style: GoogleFonts.inter(fontSize: 14, color: theme.hintColor),
                          children: [
                            const TextSpan(text: 'Already have an account? '),
                            TextSpan(
                              text: 'Sign In',
                              style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StepPips extends StatelessWidget {
  final int total, current;
  const _StepPips({required this.total, required this.current});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(total, (i) {
        Color c = i < current
            ? OrinColors.primary
            : i == current
            ? OrinColors.primary.withValues(alpha: 0.5)
            : Theme.of(context).dividerColor.withValues(alpha: 0.1);
        return Expanded(child: Container(
          height: 4,
          margin: EdgeInsets.only(right: i < total - 1 ? 8 : 0),
          decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(2)),
        ));
      }),
    );
  }
}

class _PasswordStrengthMeter extends StatelessWidget {
  final int strength;
  const _PasswordStrengthMeter({required this.strength});

  @override
  Widget build(BuildContext context) {
    Color getColor() {
      if (strength <= 1) return Colors.redAccent;
      if (strength == 2) return Colors.orangeAccent;
      if (strength == 3) return Colors.lightGreen;
      return Colors.green;
    }

    String getLabel() {
      if (strength <= 1) return 'Weak';
      if (strength == 2) return 'Fair';
      if (strength == 3) return 'Good';
      return 'Strong';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(4, (index) {
            return Expanded(
              child: Container(
                height: 4,
                margin: const EdgeInsets.only(right: 4),
                decoration: BoxDecoration(
                  color: index < strength ? getColor() : Theme.of(context).dividerColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 4),
        Text(
          'Password Strength: ${getLabel()}',
          style: GoogleFonts.inter(fontSize: 11, color: getColor(), fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
