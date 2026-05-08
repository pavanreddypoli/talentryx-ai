import SettingsForm from "@/components/shared/SettingsForm";

type Props = {
  initialFullName: string;
  email: string;
  activeRole: string;
};

export default function SettingsClient({ initialFullName, email, activeRole }: Props) {
  return (
    <SettingsForm
      initialFullName={initialFullName}
      email={email}
      activeRole={activeRole}
      apiEndpoint="/api/job-seeker/settings"
    />
  );
}
