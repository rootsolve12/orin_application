/// Email & form validators for Orin app.

class OrinValidators {
  OrinValidators._();

  static const _eduDomains = [
    '.edu', '.edu.in', '.ac.in', '.ac.uk', '.edu.au',
    '.edu.sg', '.ac.jp', '.edu.cn', '.edu.br',
  ];

  /// Check if email belongs to a known educational institution domain.
  static bool isCollegeEmail(String email) {
    final lower = email.toLowerCase().trim();
    return _eduDomains.any((d) => lower.endsWith(d));
  }

  /// Validate email format.
  static String? validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) return 'Email is required';
    if (!value.contains('@') || !value.contains('.')) return 'Enter a valid email';
    return null;
  }

  /// Validate password strength.
  static String? validatePassword(String? value, {int minLength = 8}) {
    if (value == null || value.isEmpty) return 'Password is required';
    if (value.length < minLength) return 'Min $minLength characters';
    return null;
  }

  /// Validate required field.
  static String? required(String? value, [String field = 'Field']) {
    if (value == null || value.trim().isEmpty) return '$field is required';
    return null;
  }

  /// Validate email domain matches a specific college.
  static String? validateEmailDomain(String? email, String? requiredDomain) {
    if (email == null || requiredDomain == null) return null;
    if (!email.toLowerCase().endsWith(requiredDomain.toLowerCase())) {
      return 'Must use a @$requiredDomain email';
    }
    return null;
  }
}
