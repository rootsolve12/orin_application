import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: OrinColors.bgLight,
      appBar: AppBar(
        backgroundColor: OrinColors.bgLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: OrinColors.textLight),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: OrinColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.security, color: OrinColors.primary, size: 24),
                ),
                const SizedBox(width: 16),
                Text(
                  'Privacy Policy',
                  style: GoogleFonts.inter(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: OrinColors.textLight,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Last updated: June 17, 2026',
              style: GoogleFonts.inter(color: OrinColors.mutedLight),
            ),
            const SizedBox(height: 32),
            _buildSection(
              '1. Information We Collect',
              'As an academic and event platform, Orin collects information to facilitate your participation in hackathons, workshops, and community events:\n\n• Account Data: Name, email address, university affiliation, and profile details provided during onboarding.\n• Event Registration: Responses to registration forms, resumes (if uploaded), and team formation details.\n• Submission Data: Code repositories, project links, and files uploaded to team vaults or submission portals.',
            ),
            _buildSection(
              '2. How We Use Your Information',
              'We use your data strictly to improve your academic journey:\n\n• To match you with events and communities based on your skills.\n• To share necessary registration details with Event Organizers.\n• To issue and verify digital certificates.\n• To send critical notifications regarding deadlines and emergencies.',
            ),
            _buildSection(
              '3. Data Sharing and Organizers',
              'When you register for an event, the specific Event Organizer will have access to your registration details and submissions. Organizers are required to handle your data responsibly. We do not sell your personal information to third-party advertisers.',
            ),
            _buildSection(
              '4. Security',
              'We utilize Firebase Authentication and Firestore security rules to protect your data. While we strive for commercially acceptable means of protecting your information, no method of transmission over the internet is 100% secure.',
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: OrinColors.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Contact Us', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16)),
                  const SizedBox(height: 8),
                  Text(
                    'If you have questions about this Privacy Policy, please contact us at privacy@orinplatform.edu.',
                    style: GoogleFonts.inter(color: OrinColors.mutedLight, height: 1.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String body) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: OrinColors.textLight),
          ),
          const SizedBox(height: 12),
          Text(
            body,
            style: GoogleFonts.inter(fontSize: 15, color: OrinColors.textLight.withValues(alpha: 0.8), height: 1.6),
          ),
        ],
      ),
    );
  }
}
