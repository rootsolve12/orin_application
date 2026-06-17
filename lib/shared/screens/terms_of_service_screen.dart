import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';

class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

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
                  child: const Icon(Icons.description, color: OrinColors.primary, size: 24),
                ),
                const SizedBox(width: 16),
                Text(
                  'Terms of Service',
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
              '1. Acceptance of Terms',
              'By accessing and using the Orin platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform. Orin provides an academic and event management workspace connecting students, professionals, and event organizers.',
            ),
            _buildSection(
              '2. User Conduct & Academic Integrity',
              'As a participant on Orin, you agree to uphold strict standards of academic integrity:\n\n• You will not submit plagiarized work to any hackathon, assessment, or event.\n• You will respect the rules set forth by individual Event Organizers.\n• You will not engage in harassment or abusive behavior in Community chats or Team Workspaces.',
            ),
            _buildSection(
              '3. Organizer Responsibilities',
              'Users creating events ("Organizers") are responsible for ensuring that their events comply with local laws and do not mislead participants. Organizers must honor any prizes, certificates, or claims made on their event pages.',
            ),
            _buildSection(
              '4. Intellectual Property',
              'Unless explicitly stated by an Event Organizer\'s specific rules, you retain the intellectual property rights to the projects and code you submit through the Orin platform. By submitting, you grant Orin and the Event Organizer a limited license to review and display your submission for evaluation purposes.',
            ),
            _buildSection(
              '5. Termination',
              'We reserve the right to suspend or terminate your account at any time for violations of these Terms of Service, especially concerning academic fraud or community harassment.',
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
                  Text('Questions?', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16)),
                  const SizedBox(height: 8),
                  Text(
                    'If you have questions about these Terms, please contact legal@orinplatform.edu.',
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
