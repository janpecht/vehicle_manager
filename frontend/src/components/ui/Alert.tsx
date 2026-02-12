interface AlertProps {
  type: 'error' | 'success' | 'info';
  message: string;
}

const typeClasses = {
  error: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export function Alert({ type, message }: AlertProps) {
  return (
    <div className={`rounded-md border p-3 text-sm ${typeClasses[type]}`}>
      {message}
    </div>
  );
}
