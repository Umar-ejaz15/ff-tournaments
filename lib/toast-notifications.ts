import { toast } from "sonner";

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
  });
};

export const showErrorToast = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: "top-right",
  });
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    position: "top-right",
  });
};

export const updateToast = (id: string | number, message: string, type: "success" | "error" = "success") => {
  if (type === "success") {
    toast.success(message, {
      id,
      duration: 3000,
    });
  } else {
    toast.error(message, {
      id,
      duration: 4000,
    });
  }
};

export const showWarningToast = (message: string) => {
  toast(message, {
    duration: 3500,
    position: "top-right",
    icon: "⚠️",
  });
};

export const showInfoToast = (message: string) => {
  toast(message, {
    duration: 3000,
    position: "top-right",
    icon: "ℹ️",
  });
};
