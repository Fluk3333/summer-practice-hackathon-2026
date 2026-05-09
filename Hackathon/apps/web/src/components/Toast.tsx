import styles from './Toast.module.css';

export interface ToastType {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContainerProps {
  toasts: ToastType[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className={styles.container}>
      {toasts.map((toast) => {
        const typeClass = toast.type === 'success' ? styles.success : styles.error;

        return (
          <div
            key={toast.id}
            className={`${styles.toastCard} ${typeClass}`}
          >
            <div className={styles.toastContent}>
              <span className={styles.icon}>
                {toast.type === 'success' ? '⚡' : '⚠️'}
              </span>
              <p className={styles.message}>{toast.message}</p>
            </div>
            
            <button
              onClick={() => onClose(toast.id)}
              className={styles.closeButton}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}