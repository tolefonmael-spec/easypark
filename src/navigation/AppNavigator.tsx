// src/navigation/AppNavigator.tsx
import React from 'react';
import { View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { LogoFull } from '../components/Logo';
import { useAuth } from '../hooks/useAuth';

import MapScreen         from '../screens/MapScreen';
import ReportScreen      from '../screens/ReportScreen';
import SearchScreen      from '../screens/SearchScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen     from '../screens/ProfileScreen';
import SettingsScreen    from '../screens/SettingsScreen';
import AuthScreen        from '../screens/AuthScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type TabName = 'Map'|'Search'|'Report'|'Leaderboard'|'Profile';

const TAB_CONFIG: Record<TabName, {label:string; icon:string; iconActive:string}> = {
  Map:         { label:'Carte',      icon:'map-outline',      iconActive:'map' },
  Search:      { label:'Recherche',  icon:'search-outline',   iconActive:'search' },
  Report:      { label:'Signaler',   icon:'location-outline', iconActive:'location' },
  Leaderboard: { label:'Classement', icon:'podium-outline',   iconActive:'podium' },
  Profile:     { label:'Profil',     icon:'person-outline',   iconActive:'person' },
};

function TabIcon({ name, focused }: { name:TabName; focused:boolean }) {
  const cfg = TAB_CONFIG[name];
  return (
    <View style={{ alignItems:'center', justifyContent:'center', marginTop:2 }}>
      <Ionicons
        name={(focused ? cfg.iconActive : cfg.icon) as any}
        size={22}
        color={focused ? Colors.accent : Colors.text3}
      />
    </View>
  );
}

function MainTabs() {
  const { colors: c } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon:  ({ focused }) => <TabIcon name={route.name as TabName} focused={focused}/>,
        tabBarStyle: {
          backgroundColor: c.card,
          borderTopColor:  c.border,
          borderTopWidth:  1,
          paddingBottom:   Platform.OS==='ios' ? 22 : 10,
          paddingTop:      8,
          height:          Platform.OS==='ios' ? 86 : 66,
        },
        tabBarActiveTintColor:   c.accent,
        tabBarInactiveTintColor: c.text3,
        tabBarLabelStyle: { fontSize:10, fontWeight:'700', marginTop:1 },
      })}
    >
      <Tab.Screen name="Map"         component={MapScreen}/>
      <Tab.Screen name="Search"      component={SearchScreen}/>
      <Tab.Screen name="Report"      component={ReportScreen}
        options={{ tabBarLabel:'Signaler' }}/>
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen}/>
      <Tab.Screen name="Profile"     component={ProfileStack}/>
    </Tab.Navigator>
  );
}

// Profile has Settings as a sub-screen
const ProfileNav = createNativeStackNavigator();
function ProfileStack() {
  return (
    <ProfileNav.Navigator screenOptions={{ headerShown:false }}>
      <ProfileNav.Screen name="ProfileMain" component={ProfileScreen}/>
      <ProfileNav.Screen name="Settings"    component={SettingsScreen}/>
    </ProfileNav.Navigator>
  );
}

export default function AppNavigator() {
  const { session, loading } = useAuth();
  if (loading) return null;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown:false }}>
        {!session
          ? <Stack.Screen name="Auth" component={AuthScreen}/>
          : <Stack.Screen name="Main" component={MainTabs}/>
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
}
