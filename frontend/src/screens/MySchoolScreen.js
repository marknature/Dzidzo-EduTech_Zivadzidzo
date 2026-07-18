import React from 'react';
import { Building2 } from 'lucide-react-native';
import PlaceholderScreen from './PlaceholderScreen';

export default function MySchoolScreen() {
  return (
    <PlaceholderScreen
      icon={Building2}
      title="My School"
      phaseLabel="Coming in Phase 3"
      description="Departments, subjects, and staff as an expandable list, plus CSV/XLSX roster import."
    />
  );
}
