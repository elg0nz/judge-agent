interface CardProps {
  title: string;
  description: string;
  className?: string;
}

export default function Card({
  title,
  description,
  className = '',
}: CardProps): React.ReactElement {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${className}`}>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600">
        {description}
      </p>
    </div>
  );
}
