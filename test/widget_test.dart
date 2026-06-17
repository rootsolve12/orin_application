import 'package:flutter_test/flutter_test.dart';
import 'package:orin/core/utils/validators.dart';

void main() {
  group('OrinValidators Tests', () {
    test('isCollegeEmail matches correct domains', () {
      expect(OrinValidators.isCollegeEmail('student@mit.edu'), isTrue);
      expect(OrinValidators.isCollegeEmail('user@iit.ac.in'), isTrue);
      expect(OrinValidators.isCollegeEmail('professor@cam.ac.uk'), isTrue);
      expect(OrinValidators.isCollegeEmail('someone@gmail.com'), isFalse);
      expect(OrinValidators.isCollegeEmail('test@outlook.com'), isFalse);
    });

    test('validateEmail validates format', () {
      expect(OrinValidators.validateEmail(null), equals('Email is required'));
      expect(OrinValidators.validateEmail('   '), equals('Email is required'));
      expect(OrinValidators.validateEmail('invalid-email'), equals('Enter a valid email'));
      expect(OrinValidators.validateEmail('test@domain'), equals('Enter a valid email'));
      expect(OrinValidators.validateEmail('test@domain.com'), isNull);
    });

    test('validatePassword validates length and presence', () {
      expect(OrinValidators.validatePassword(null), equals('Password is required'));
      expect(OrinValidators.validatePassword(''), equals('Password is required'));
      expect(OrinValidators.validatePassword('12345'), equals('Min 8 characters'));
      expect(OrinValidators.validatePassword('12345678'), isNull);
    });

    test('required field validation', () {
      expect(OrinValidators.required(null, 'Username'), equals('Username is required'));
      expect(OrinValidators.required('  ', 'Title'), equals('Title is required'));
      expect(OrinValidators.required('Hello World', 'Title'), isNull);
    });

    test('validateEmailDomain matches specific college domains', () {
      expect(OrinValidators.validateEmailDomain('student@mit.edu', 'mit.edu'), isNull);
      expect(OrinValidators.validateEmailDomain('student@mit.edu', 'stanford.edu'), equals('Must use a @stanford.edu email'));
      expect(OrinValidators.validateEmailDomain(null, 'mit.edu'), isNull);
      expect(OrinValidators.validateEmailDomain('student@mit.edu', null), isNull);
    });
  });
}
