//server layout for reset password
import { ResetForm } from "@/features/auth/reset-form";

const ResetPage = () => {
  const apiUrl = process.env.API_URL!;
  return <ResetForm apiUrl={apiUrl} />;
};

export default ResetPage;
