"use client";

import {
  getCurrentPushSubscription,
  registerPushNotifications,
  unregisterPushNotifications,
} from "@/features/chat/services/push-service";
import Loading from "@/components/secondary-loader";
import { BellOff, BellRing } from "lucide-react";
import { useEffect, useState, useCallback, memo, ReactElement } from "react";
import { toast } from "sonner";

type NotificationState = boolean | undefined;

const SubToggle = (): ReactElement | null => {
  const [hasActivePushSubscription, setHasActivePushSubscription] =
    useState<NotificationState>();
  const [loading, setLoading] = useState<boolean>(false);

  // Get active push subscription on component mount
  useEffect(() => {
    let isMounted = true;

    async function getActivePushSubscription(): Promise<void> {
      try {
        const subscription = await getCurrentPushSubscription();
        if (isMounted) {
          setHasActivePushSubscription(!!subscription);
        }
      } catch (error) {
        console.error("Failed to get push subscription:", error);
      }
    }

    getActivePushSubscription();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle enabling/disabling push notifications
  const setPushNotificationsEnabled = useCallback(
    async (enabled: boolean): Promise<void> => {
      if (loading) return;

      setLoading(true);

      try {
        if (enabled) {
          await registerPushNotifications();
        } else {
          await unregisterPushNotifications();
        }

        setHasActivePushSubscription(enabled);
        toast.success(`Push notifications ${enabled ? "enabled" : "disabled"}`);
      } catch (error) {
        console.error(error);
        if (enabled && Notification.permission === "denied") {
          alert("Please enable push notifications in your browser settings");
        } else {
          alert("Something went wrong please try again");
        }
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  // Don't render until we know subscription status
  if (hasActivePushSubscription === undefined) return null;

  // Render notification toggle buttons
  return (
    <div className="relative">
      {loading && (
        <span className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <Loading />
        </span>
      )}

      {hasActivePushSubscription ? (
        <NotificationButton
          active={true}
          loading={loading}
          onClick={() => setPushNotificationsEnabled(false)}
        />
      ) : (
        <NotificationButton
          active={false}
          loading={loading}
          onClick={() => setPushNotificationsEnabled(true)}
        />
      )}
    </div>
  );
};

// Extract button to reduce nesting and improve readability
interface NotificationButtonProps {
  active: boolean;
  loading: boolean;
  onClick: () => void;
}

const NotificationButton = ({
  active,
  loading,
  onClick,
}: NotificationButtonProps): ReactElement => {
  const baseClassName = `cursor-pointer ${loading ? "opacity-10" : ""}`;

  if (active) {
    return (
      <span title="Disable push notifications for this device?">
        <BellRing onClick={onClick} className={`${baseClassName} bg-inherit`} />
      </span>
    );
  }

  return (
    <span title="Enable push notifications for this device?">
      <BellOff onClick={onClick} className={`${baseClassName} bg-inherit`} />
    </span>
  );
};

export default memo(SubToggle);
