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
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    border: colors.border,
    primary: colors.teal,
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
          tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
          tabBarActiveTintColor: colors.teal,
          tabBarInactiveTintColor: colors.inkFaint,
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
