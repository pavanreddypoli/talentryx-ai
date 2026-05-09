import SignupClient from "./SignupClient";

type Props = { searchParams: Promise<{ reason?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  return <SignupClient incompleteSetup={reason === "incomplete_setup"} />;
}
