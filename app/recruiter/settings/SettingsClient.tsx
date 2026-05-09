import SettingsForm from "@/components/shared/SettingsForm";

type Props = {
  initialFullName: string;
  email: string;
  activeRole: string;
  roles: string[];
};

export default function SettingsClient({ initialFullName, email, activeRole, roles }: Props) {
  return (
    <SettingsForm
      initialFullName={initialFullName}
      email={email}
      activeRole={activeRole}
      roles={roles}
      apiEndpoint="/api/recruiter/settings"
    />
  );
}
