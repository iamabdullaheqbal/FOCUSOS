import { SettingsLayout } from '../../../views/Settings/SettingsLayout';

export default function SettingsLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <SettingsLayout>{children}</SettingsLayout>;
}
