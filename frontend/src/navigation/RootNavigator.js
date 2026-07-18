import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Users, Building2, MessageCircle, FileText, Wallet, Settings as SettingsIcon } from 'lucide-react-native';

import CurriculumAuditScreen from '../screens/CurriculumAuditScreen';
import RosterScreen from '../screens/RosterScreen';
import MySchoolScreen from '../screens/MySchoolScreen';
import ChatScreen from '../screens/ChatScreen';
import ReportsScreen from '../screens/ReportsScreen';
import CostScreen from '../screens/CostScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0A0F1D',
    card: '#0A0F1D',
    border: '#1F2937',
    primary: '#3B82F6',
  },
};

const ICONS = {
  Home: LayoutDashboard,
  Roster: Users,
  MySchool: Building2,
  Chat: MessageCircle,
  Reports: FileText,
  Cost: Wallet,
  Settings: SettingsIcon,
};

export default function RootNavigator({ profile, userEmail, onSignOut }) {
  return (
    <NavigationContainer theme={NavTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: '#0A0F1D', borderTopColor: '#1F2937' },
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#6B7280',
          tabBarIcon: ({ color, size }) => {
            const Icon = ICONS[route.name];
            return Icon ? <Icon color={color} size={size ?? 20} /> : null;
          },
        })}
      >
        <Tab.Screen name="Home" component={CurriculumAuditScreen} />
        <Tab.Screen name="Roster" component={RosterScreen} />
        <Tab.Screen name="MySchool" component={MySchoolScreen} options={{ title: 'My School' }} />
        <Tab.Screen name="Chat" component={ChatScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
        <Tab.Screen name="Cost" component={CostScreen} />
        <Tab.Screen name="Settings">
          {(props) => <SettingsScreen {...props} profile={profile} userEmail={userEmail} onSignOut={onSignOut} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
