import Badge from "./badge";

interface NewBadgeProps {
  show?: boolean;
}

const NewBadge: React.FC<NewBadgeProps> = ({ show = true }) => {
  if (!show) return null;

  return (
    <div className="absolute -top-2 -left-2 z-10 transition-transform duration-300 group-hover:scale-105">
      <Badge variant="new" showSparkle={true} rotation={-45}>
        NEW
      </Badge>
    </div>
  );
};

export default NewBadge;
