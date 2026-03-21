import 'react-native-url-polyfill/auto';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider }       from 'react-native-safe-area-context';
import { StatusBar }              from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AppNavigator               from './src/navigation/AppNavigator';

function Root() {
  const { isDark } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex:1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor="transparent" translucent/>
        <AppNavigator/>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root/>
    </ThemeProvider>
  );
}
