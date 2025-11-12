// Basic Flutter widget test for FSM Pro app
import 'package:flutter_test/flutter_test.dart';

import 'package:fsm_pro_flutter/app.dart';

void main() {
  testWidgets('App initializes correctly', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const FSMProApp());

    // Verify that the app name is displayed
    expect(find.text('FSM Pro'), findsOneWidget);
    expect(find.text('Project structure initialized'), findsOneWidget);
  });
}
