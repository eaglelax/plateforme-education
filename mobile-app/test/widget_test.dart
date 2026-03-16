import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:faso_yiri/main.dart';

void main() {
  testWidgets('App launches with splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: FasoYiriApp()),
    );
    // Splash screen shows logo
    expect(find.text('FY'), findsOneWidget);
    expect(find.text('Faso Yiri'), findsOneWidget);
  });
}
